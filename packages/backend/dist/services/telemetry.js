// Telemetry processing service
// Converts raw telemetry to aggregate metrics
export function processTelemetry(rawData) {
    // Calculate stability score (0-100)
    // Based on error rate and undo spikes relative to activity
    const activity = rawData.keystrokeCount + rawData.fileSwitches;
    const errorRatio = activity > 0 ? (rawData.undoSpikes / activity) : 0;
    const stability = Math.max(0, Math.min(100, Math.round(100 * (1 - errorRatio))));
    // Calculate error rate (0-1)
    const errorRate = activity > 0
        ? Math.min(1, rawData.errorCount / Math.max(1, activity / 10))
        : 0;
    // Calculate complexity index (1-10)
    // Based on file switching frequency and session duration
    const fileSwitchRate = rawData.sessionDuration > 0
        ? rawData.fileSwitches / (rawData.sessionDuration / 60) // per minute
        : 0;
    const complexityIndex = Math.min(10, Math.max(1, 1 + Math.round(fileSwitchRate * 2)));
    // Calculate typing cadence variance (0-100)
    // Higher value = more variable typing pattern
    const typingVariance = Math.min(100, Math.round(errorRatio * 100));
    return {
        stability,
        errorRate,
        complexityIndex,
        typingVariance,
        undoSpikes: rawData.undoSpikes,
        fileSwitches: rawData.fileSwitches
    };
}
// Determine if a micro-nudge should be triggered
export function shouldTriggerNudge(metrics) {
    // Trigger if stability drops below 40
    if (metrics.stability < 40) {
        return { triggered: true, reason: 'stability_drop' };
    }
    // Trigger if error rate exceeds 20%
    if (metrics.errorRate > 0.2) {
        return { triggered: true, reason: 'error_spike' };
    }
    // Trigger if session exceeds 90 minutes without break
    if (metrics.sessionDuration > 5400 && metrics.sessionDuration % 1800000 < 60000) {
        return { triggered: true, reason: 'long_session' };
    }
    // Trigger if more than 10 undo spikes in last minute
    if (metrics.undoSpikes > 10) {
        return { triggered: true, reason: 'undo_burst' };
    }
    return { triggered: false };
}
// Calculate hourly risk score
export function calculateRiskScore(aggregate) {
    const { avg_stability, error_rate, complexity_index, undo_spikes, total_duration_minutes, hour } = aggregate;
    // Normalize error rate to 0-1
    const normalizedErrorRate = error_rate;
    // Complexity spike frequency (0-1)
    const complexitySpikeFreq = Math.min(1, complexity_index / 10);
    // Session length penalty (0-1)
    // Penalize sessions over 60 minutes
    const sessionLengthPenalty = Math.min(1, Math.max(0, (total_duration_minutes - 60) / 120));
    // Late night factor (0-1)
    // Higher risk between 22:00-02:00
    const lateNightFactor = (hour >= 22 || hour < 2) ? 1 :
        (hour >= 20 || hour < 4) ? 0.5 : 0;
    // Calculate weighted risk score
    const riskScore = (normalizedErrorRate * 0.35 +
        complexitySpikeFreq * 0.25 +
        sessionLengthPenalty * 0.20 +
        lateNightFactor * 0.20) * 100;
    return Math.min(100, Math.max(0, Math.round(riskScore)));
}
