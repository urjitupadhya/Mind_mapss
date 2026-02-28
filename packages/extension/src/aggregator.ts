export interface CognitiveMetrics {
  syntaxErrorRate: number;
  undoFrequency: number;
  fileSwitchRate: number;
  commitClustering: number;
  complexitySpike: number;
  saveWithoutDiff: number;
  lateNightActivity: number;
  typingVariance: number;
}

export interface WeightedScore {
  cognitiveScore: number;
  burnoutProbability: number;
  flowState: number;
  strainLevel: 'low' | 'moderate' | 'high' | 'critical';
  breakdown: {
    metric: string;
    raw: number;
    normalized: number;
    weighted: number;
  }[];
}

const METRIC_WEIGHTS = {
  syntaxErrorRate: { weight: 0.20, maxValue: 10 },
  undoFrequency: { weight: 0.12, maxValue: 50 },
  fileSwitchRate: { weight: 0.10, maxValue: 30 },
  commitClustering: { weight: 0.08, maxValue: 5 },
  complexitySpike: { weight: 0.15, maxValue: 10 },
  saveWithoutDiff: { weight: 0.10, maxValue: 20 },
  lateNightActivity: { weight: 0.15, maxValue: 1 },
  typingVariance: { weight: 0.10, maxValue: 100 }
};

const TIME_WINDOW_MS = 5 * 60 * 1000;
const EMA_ALPHA = 0.3;

export class MetricsAggregator {
  private keystrokeTimestamps: number[] = [];
  private errorEvents: number[] = [];
  private complexityScores: number[] = [];
  private totalEvents: number = 0;
  private undoSpikes: number = 0;
  private fileSwitches: number = 0;
  private sessionStart: number = Date.now();
  private saveWithoutDiffCount: number = 0;
  private commitCount: number = 0;
  private lastSaveContentHash: string = '';
  
  private windowedMetrics: {
    timestamp: number;
    errorCount: number;
    undoCount: number;
    fileSwitchCount: number;
  }[] = [];
  
  private emaCognitiveScore: number = 75;
  private emaStability: number = 75;

  private recentComplexityScores: number[] = [];
  private baselineComplexity: number = 5;

  private preferredCodingStart: number = 9;
  private preferredCodingEnd: number = 18;
  private sleepWindowStart: number = 22;
  private sleepWindowEnd: number = 6;

  setUserPreferences(prefs: {
    codingStartHour?: number;
    codingEndHour?: number;
    sleepStartHour?: number;
    sleepEndHour?: number;
  }) {
    if (prefs.codingStartHour !== undefined) this.preferredCodingStart = prefs.codingStartHour;
    if (prefs.codingEndHour !== undefined) this.preferredCodingEnd = prefs.codingEndHour;
    if (prefs.sleepStartHour !== undefined) this.sleepWindowStart = prefs.sleepStartHour;
    if (prefs.sleepEndHour !== undefined) this.sleepWindowEnd = prefs.sleepEndHour;
  }

  addKeystroke(timestamp: number): void {
    this.keystrokeTimestamps.push(timestamp);
    this.totalEvents++;
    this.pruneOldWindowData(timestamp);
    this.updateEMA();
  }

  addError(): void {
    this.errorEvents.push(Date.now());
    const now = Date.now();
    this.windowedMetrics.push({ timestamp: now, errorCount: 1, undoCount: 0, fileSwitchCount: 0 });
  }

  addComplexity(score: number): void {
    this.complexityScores.push(score);
    this.recentComplexityScores.push(score);
    if (this.recentComplexityScores.length > 20) {
      this.recentComplexityScores.shift();
    }
    if (this.complexityScores.length > 10) {
      this.baselineComplexity = this.complexityScores.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    }
  }

  addUndoSpike(): void {
    this.undoSpikes++;
    const now = Date.now();
    this.windowedMetrics.push({ timestamp: now, errorCount: 0, undoCount: 1, fileSwitchCount: 0 });
  }

  addFileSwitch(): void {
    this.fileSwitches++;
    const now = Date.now();
    this.windowedMetrics.push({ timestamp: now, errorCount: 0, undoCount: 0, fileSwitchCount: 1 });
  }

  addCommit(): void {
    this.commitCount++;
  }

  addSaveWithoutDiff(hasDiff: boolean): void {
    if (!hasDiff) {
      this.saveWithoutDiffCount++;
    }
  }

  setContentHash(hash: string): void {
    this.lastSaveContentHash = hash;
  }

  private pruneOldWindowData(currentTime: number): void {
    const cutoff = currentTime - TIME_WINDOW_MS;
    this.windowedMetrics = this.windowedMetrics.filter(m => m.timestamp > cutoff);
    this.keystrokeTimestamps = this.keystrokeTimestamps.filter(t => t > cutoff);
    this.errorEvents = this.errorEvents.filter(t => t > cutoff);
  }

  private updateEMA(): void {
    const rawScore = this.calculateRawCognitiveScore();
    this.emaCognitiveScore = EMA_ALPHA * rawScore + (1 - EMA_ALPHA) * this.emaCognitiveScore;
    const stability = this.calculateStability();
    this.emaStability = EMA_ALPHA * stability + (1 - EMA_ALPHA) * this.emaStability;
  }

  private calculateRawCognitiveScore(): number {
    const metrics = this.getNormalizedMetrics();
    let score = 100;
    for (const [key, config] of Object.entries(METRIC_WEIGHTS)) {
      const metricValue = metrics[key as keyof typeof metrics] as number;
      score -= metricValue * config.weight * 100;
    }
    return Math.max(0, Math.min(100, score));
  }

  getNormalizedMetrics(): CognitiveMetrics {
    const windowDuration = this.getWindowDuration();
    const windowedErrors = this.windowedMetrics.reduce((sum, m) => sum + m.errorCount, 0);
    const windowedUndos = this.windowedMetrics.reduce((sum, m) => sum + m.undoCount, 0);
    const windowedFileSwitches = this.windowedMetrics.reduce((sum, m) => sum + m.fileSwitchCount, 0);
    
    const windowDurationMinutes = windowDuration / 60000;
    const errorsPerMin = windowDurationMinutes > 0 ? windowedErrors / windowDurationMinutes : 0;
    const undosPerMin = windowDurationMinutes > 0 ? windowedUndos / windowDurationMinutes : 0;
    const fileSwitchesPerMin = windowDurationMinutes > 0 ? windowedFileSwitches / windowDurationMinutes : 0;
    const keystrokesPerMin = windowDurationMinutes > 0 ? this.keystrokeTimestamps.length / windowDurationMinutes : 0;
    
    const avgRecentComplexity = this.recentComplexityScores.length > 0 
      ? this.recentComplexityScores.reduce((a, b) => a + b, 0) / this.recentComplexityScores.length 
      : this.baselineComplexity;
    const complexitySpike = avgRecentComplexity / Math.max(1, this.baselineComplexity);
    
    const hour = new Date().getHours();
    const isLateNight = hour >= this.sleepWindowStart || hour < this.sleepWindowEnd;
    
    const sessionDurationMinutes = (Date.now() - this.sessionStart) / 60000;
    const saveWithoutDiffRate = sessionDurationMinutes > 0 ? this.saveWithoutDiffCount / sessionDurationMinutes : 0;
    
    return {
      syntaxErrorRate: Math.min(1, errorsPerMin / 2),
      undoFrequency: Math.min(1, undosPerMin / 10),
      fileSwitchRate: Math.min(1, fileSwitchesPerMin / 6),
      commitClustering: Math.min(1, this.commitCount / 3),
      complexitySpike: Math.min(1, complexitySpike - 1),
      saveWithoutDiff: Math.min(1, saveWithoutDiffRate / 4),
      lateNightActivity: isLateNight ? 1 : 0,
      typingVariance: this.calculateTypingVariance() / 100
    };
  }

  calculateWeightedScore(): WeightedScore {
    const metrics = this.getNormalizedMetrics();
    const breakdown: WeightedScore['breakdown'] = [];
    let totalWeighted = 0;
    
    for (const [key, config] of Object.entries(METRIC_WEIGHTS)) {
      const rawValue = metrics[key as keyof typeof metrics] as number;
      const normalizedValue = rawValue;
      const weightedValue = normalizedValue * config.weight;
      totalWeighted += weightedValue;
      
      breakdown.push({
        metric: key,
        raw: rawValue,
        normalized: normalizedValue,
        weighted: weightedValue
      });
    }
    
    const cognitiveScore = Math.round((1 - totalWeighted) * 100);
    const burnoutProbability = this.calculateBurnoutProbability();
    const flowState = this.calculateFlowState();
    
    let strainLevel: WeightedScore['strainLevel'];
    if (cognitiveScore >= 75) strainLevel = 'low';
    else if (cognitiveScore >= 50) strainLevel = 'moderate';
    else if (cognitiveScore >= 25) strainLevel = 'high';
    else strainLevel = 'critical';
    
    return {
      cognitiveScore,
      burnoutProbability,
      flowState,
      strainLevel,
      breakdown
    };
  }

  private calculateBurnoutProbability(): number {
    const metrics = this.getNormalizedMetrics();
    const sessionDurationMinutes = (Date.now() - this.sessionStart) / 60000;
    const lateNightWeight = metrics.lateNightActivity * 0.25;
    const errorWeight = metrics.syntaxErrorRate * 0.20;
    const complexityWeight = metrics.complexitySpike * 0.15;
    const durationWeight = Math.min(1, sessionDurationMinutes / 180) * 0.20;
    const undoWeight = metrics.undoFrequency * 0.10;
    const fileSwitchWeight = metrics.fileSwitchRate * 0.10;
    
    const bpi = Math.round((lateNightWeight + errorWeight + complexityWeight + durationWeight + undoWeight + fileSwitchWeight) * 100);
    return Math.min(100, Math.max(0, bpi));
  }

  private calculateFlowState(): number {
    const stability = this.calculateStability();
    const variance = this.typingVariance;
    const complexity = this.calculateComplexity();
    const fileSwitches = this.fileSwitches;
    
    const stabilityFactor = stability / 100;
    const lowVarianceFactor = 1 - (variance / 100);
    const moderateComplexityFactor = Math.min(1, complexity / 6);
    const lowDistractionFactor = 1 - Math.min(1, fileSwitches / 20);
    
    const flow = (stabilityFactor * 0.35 + lowVarianceFactor * 0.25 + moderateComplexityFactor * 0.20 + lowDistractionFactor * 0.20) * 100;
    return Math.round(Math.min(100, Math.max(0, flow)));
  }

  getEMACognitiveScore(): number {
    return Math.round(this.emaCognitiveScore);
  }

  getEMAStability(): number {
    return Math.round(this.emaStability);
  }

  private getWindowDuration(): number {
    if (this.keystrokeTimestamps.length === 0) return 0;
    const sorted = [...this.keystrokeTimestamps].sort((a, b) => a - b);
    return sorted[sorted.length - 1] - sorted[0];
  }

  calculateStability(): number {
    if (this.keystrokeTimestamps.length < 2) return 100;

    const intervals: number[] = [];
    const sorted = [...this.keystrokeTimestamps].sort((a, b) => a - b);

    for (let i = 1; i < sorted.length; i++) {
      intervals.push(sorted[i] - sorted[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    const stability = Math.max(0, Math.min(100, 100 - (stdDev / 5)));
    return Math.round(stability);
  }

  calculateErrorRate(): number {
    if (this.keystrokeTimestamps.length === 0) return 0;
    return Math.min(1, this.undoSpikes / this.keystrokeTimestamps.length);
  }

  calculateComplexity(): number {
    if (this.complexityScores.length === 0) return 1;
    const avg = this.complexityScores.reduce((a, b) => a + b, 0) / this.complexityScores.length;
    return Math.min(10, Math.max(1, avg));
  }

  calculateTypingVariance(): number {
    if (this.keystrokeTimestamps.length < 2) return 0;

    const intervals: number[] = [];
    const sorted = [...this.keystrokeTimestamps].sort((a, b) => a - b);

    for (let i = 1; i < sorted.length; i++) {
      intervals.push(sorted[i] - sorted[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;

    return Math.min(100, Math.round(Math.sqrt(variance) / 10));
  }

  getUndoSpikes(): number {
    return this.undoSpikes;
  }

  getFileSwitches(): number {
    return this.fileSwitches;
  }

  getTotalEvents(): number {
    return this.totalEvents;
  }

  getSessionDuration(): number {
    return Date.now() - this.sessionStart;
  }

  getHourOfDay(): number {
    return new Date().getHours();
  }

  getAggregates(): {
    keystrokeCount: number;
    errorCount: number;
    complexityCount: number;
    totalEvents: number;
    undoSpikes: number;
    fileSwitches: number;
  } {
    return {
      keystrokeCount: this.keystrokeTimestamps.length,
      errorCount: this.errorEvents.length,
      complexityCount: this.complexityScores.length,
      totalEvents: this.totalEvents,
      undoSpikes: this.undoSpikes,
      fileSwitches: this.fileSwitches
    };
  }

  reset(): void {
    this.keystrokeTimestamps = [];
    this.errorEvents = [];
    this.complexityScores = [];
    this.totalEvents = 0;
    this.undoSpikes = 0;
    this.fileSwitches = 0;
    this.sessionStart = Date.now();
    this.saveWithoutDiffCount = 0;
    this.commitCount = 0;
    this.windowedMetrics = [];
    this.recentComplexityScores = [];
    this.emaCognitiveScore = 75;
    this.emaStability = 75;
  }
}
