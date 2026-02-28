// Forecast generation service
// Deterministic time-series forecasting for cognitive strain prediction

export function generateForecast(historicalData: Array<{
  hour: number;
  date: string;
  avg_stability: number;
  error_rate: number;
  complexity_index: number;
  total_duration_minutes: number;
  undo_spikes: number;
  file_switches: number;
}>) {
  // Group by hour
  const hourlyMap = new Map<number, {
    stability: number[];
    errorRate: number[];
    complexity: number[];
    duration: number[];
    samples: number;
  }>();

  for (const entry of historicalData) {
    const hour = entry.hour;
    if (!hourlyMap.has(hour)) {
      hourlyMap.set(hour, { stability: [], errorRate: [], complexity: [], duration: [], samples: 0 });
    }
    const hourData = hourlyMap.get(hour)!;
    hourData.stability.push(entry.avg_stability);
    hourData.errorRate.push(entry.error_rate);
    hourData.complexity.push(entry.complexity_index);
    hourData.duration.push(entry.total_duration_minutes);
    hourData.samples++;
  }

  // Generate forecast for next 24 hours
  const forecasts = [];
  const now = new Date();

  for (let i = 0; i < 24; i++) {
    const forecastHour = (now.getHours() + i) % 24;
    const hourData = hourlyMap.get(forecastHour);

    let predictedStability = 70; // Default baseline
    let riskScore = 20; // Default low risk
    let confidence = 0.5;

    if (hourData && hourData.samples >= 3) {
      // Use historical average with decay weighting
      const avgStability = hourData.stability.reduce((a, b) => a + b, 0) / hourData.stability.length;
      const avgErrorRate = hourData.errorRate.reduce((a, b) => a + b, 0) / hourData.errorRate.length;
      const avgComplexity = hourData.complexity.reduce((a, b) => a + b, 0) / hourData.complexity.length;
      const avgDuration = hourData.duration.reduce((a, b) => a + b, 0) / hourData.duration.length;

      predictedStability = Math.round(avgStability);
      confidence = Math.min(0.9, hourData.samples / 14); // Max confidence with 14 days of data

      // Calculate risk score using deterministic model
      const normalizedErrorRate = avgErrorRate;
      const complexitySpikeFreq = Math.min(1, avgComplexity / 10);
      const sessionLengthPenalty = Math.min(1, Math.max(0, (avgDuration - 60) / 120));
      const lateNightFactor = (forecastHour >= 22 || forecastHour < 2) ? 1 : 
                             (forecastHour >= 20 || forecastHour < 4) ? 0.5 : 0;

      riskScore = Math.round((
        normalizedErrorRate * 0.35 +
        complexitySpikeFreq * 0.25 +
        sessionLengthPenalty * 0.20 +
        lateNightFactor * 0.20
      ) * 100);
    } else {
      // Use baseline with hour-specific adjustments
      predictedStability = getBaselineStability(forecastHour);
      riskScore = getBaselineRisk(forecastHour);
      confidence = 0.3;
    }

    const forecastDate = new Date(now);
    forecastDate.setHours(forecastDate.getHours() + i);
    const dateStr = forecastDate.toISOString().split('T')[0];

    forecasts.push({
      hour: forecastHour,
      date: dateStr,
      predicted_stability: predictedStability,
      risk_score: riskScore,
      confidence: confidence,
      contributing_factors: getContributingFactors(forecastHour, riskScore)
    });
  }

  // Calculate optimal deep work window
  const optimalWindow = findOptimalWindow(forecasts);
  const highRiskWindows = findHighRiskWindows(forecasts);

  return {
    hourly_forecast: forecasts,
    optimal_window: optimalWindow,
    high_risk_windows: highRiskWindows,
    generated_at: Date.now()
  };
}

function getBaselineStability(hour: number): number {
  // Typical circadian rhythm stability peaks
  if (hour >= 9 && hour <= 12) return 85;
  if (hour >= 14 && hour <= 17) return 80;
  if (hour >= 19 && hour <= 21) return 70;
  if (hour >= 22 || hour <= 5) return 45;
  return 65;
}

function getBaselineRisk(hour: number): number {
  // Risk follows inverse of stability + late night penalty
  if (hour >= 22 || hour <= 2) return 70;
  if (hour >= 0 && hour <= 5) return 65;
  if (hour >= 23 || hour <= 4) return 55;
  return 25;
}

function getContributingFactors(hour: number, riskScore: number): string[] {
  const factors: string[] = [];

  if (hour >= 22 || hour < 6) {
    factors.push('circadian_factor');
  }
  if (hour >= 9 && hour <= 11) {
    factors.push('morning_peak');
  }
  if (hour >= 14 && hour <= 16) {
    factors.push('afternoon_peak');
  }

  if (riskScore > 60) {
    factors.push('high_risk');
  } else if (riskScore > 40) {
    factors.push('moderate_risk');
  } else {
    factors.push('low_risk');
  }

  return factors;
}

function findOptimalWindow(forecasts: Array<{ hour: number; predicted_stability: number; risk_score: number }>) {
  // Find the longest stretch of low-risk, high-stability hours
  let bestStart = 0;
  let bestLength = 0;
  let currentStart = 0;
  let currentLength = 0;

  for (let i = 0; i < forecasts.length; i++) {
    const { predicted_stability, risk_score } = forecasts[i];
    
    if (predicted_stability >= 70 && risk_score <= 35) {
      if (currentLength === 0) {
        currentStart = i;
      }
      currentLength++;
    } else {
      if (currentLength > bestLength) {
        bestStart = currentStart;
        bestLength = currentLength;
      }
      currentLength = 0;
    }
  }

  // Check final stretch
  if (currentLength > bestLength) {
    bestStart = currentStart;
    bestLength = currentLength;
  }

  if (bestLength < 2) {
    // Fallback to single best hour
    let bestHour = 0;
    let bestScore = -1;
    for (let i = 0; i < forecasts.length; i++) {
      const score = forecasts[i].predicted_stability - forecasts[i].risk_score;
      if (score > bestScore) {
        bestScore = score;
        bestHour = i;
      }
    }
    return { start: forecasts[bestHour].hour, end: forecasts[bestHour].hour };
  }

  return {
    start: forecasts[bestStart].hour,
    end: forecasts[bestStart + bestLength - 1].hour
  };
}

function findHighRiskWindows(forecasts: Array<{ hour: number; risk_score: number }>): Array<{ start: number; end: number; reason: string }> {
  const windows: Array<{ start: number; end: number; reason: string }> = [];
  let currentStart = -1;
  let currentReason = '';

  for (let i = 0; i < forecasts.length; i++) {
    const { hour, risk_score } = forecasts[i];

    if (risk_score > 50) {
      if (currentStart === -1) {
        currentStart = hour;
        currentReason = risk_score > 70 ? 'high_strain' : 'elevated_risk';
      }
    } else {
      if (currentStart !== -1) {
        windows.push({ start: currentStart, end: hour, reason: currentReason });
        currentStart = -1;
      }
    }
  }

  // Close final window if still open
  if (currentStart !== -1) {
    windows.push({ start: currentStart, end: forecasts[forecasts.length - 1].hour, reason: currentReason });
  }

  return windows;
}
