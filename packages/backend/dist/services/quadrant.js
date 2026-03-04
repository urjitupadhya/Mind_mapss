export function calculateProductivityQuadrant(bpiMetrics) {
    if (!bpiMetrics || bpiMetrics.length === 0) {
        return {
            quadrant: 'unknown',
            label: 'No Data',
            description: 'Start coding to see your productivity quadrant',
            productivity: 50,
            strain: 50,
            recommendation: 'Begin a coding session to calibrate your baseline'
        };
    }
    const avgCognitiveScore = bpiMetrics.reduce((sum, m) => sum + (m.cognitive_score || m.ema_cognitive_score), 0) / bpiMetrics.length;
    const avgStability = bpiMetrics.reduce((sum, m) => sum + (m.ema_stability || 75), 0) / bpiMetrics.length;
    const avgBurnout = bpiMetrics.reduce((sum, m) => sum + (m.burnout_probability || 25), 0) / bpiMetrics.length;
    const avgFlow = bpiMetrics.reduce((sum, m) => sum + (m.flow_state || 50), 0) / bpiMetrics.length;
    const productivity = avgCognitiveScore;
    const strain = avgBurnout;
    let quadrant;
    let label;
    let description;
    let recommendation;
    let color;
    if (productivity >= 60 && strain < 40) {
        quadrant = 'flow';
        label = 'Flow State';
        description = 'You\'re in the zone! High productivity with manageable strain levels.';
        recommendation = 'Great time for deep work. Consider a short break to maintain this state.';
        color = '#22c55e';
    }
    else if (productivity >= 60 && strain >= 40) {
        quadrant = 'overdrive';
        label = 'Overdrive';
        description = 'High output but strain is building. Running on adrenaline?';
        recommendation = 'Schedule a recovery break soon. You\'re burning bright but may burn out.';
        color = '#f97316';
    }
    else if (productivity < 60 && strain >= 40) {
        quadrant = 'burnout_risk';
        label = 'Burnout Risk';
        description = 'Low productivity with high strain. This is the danger zone.';
        recommendation = 'Stop and recover. Take a real break or end the session for today.';
        color = '#ef4444';
    }
    else {
        quadrant = 'recovery';
        label = 'Recovery Mode';
        description = 'Low strain but also lower productivity. Warming up or winding down?';
        recommendation = 'Good for learning or light tasks. Build up gradually to flow state.';
        color = '#3b82f6';
    }
    return {
        quadrant,
        label,
        description,
        recommendation,
        color,
        productivity: Math.round(productivity),
        strain: Math.round(avgBurnout),
        avgCognitiveScore: Math.round(avgCognitiveScore),
        avgStability: Math.round(avgStability),
        avgBurnout: Math.round(avgBurnout),
        avgFlow: Math.round(avgFlow),
        sampleCount: bpiMetrics.length
    };
}
export function calculateWeeklyBPI(bpiMetrics) {
    if (!bpiMetrics || bpiMetrics.length === 0) {
        return {
            weeklyBPI: 0,
            trend: 'stable',
            assessment: 'Not enough data to assess weekly burnout risk'
        };
    }
    const weeklyBPI = Math.round(bpiMetrics.reduce((sum, d) => sum + (d.avg_burnout_probability || 0), 0) / bpiMetrics.length);
    let trend;
    if (bpiMetrics.length >= 3) {
        const recent = bpiMetrics.slice(-3);
        const earlier = bpiMetrics.slice(0, Math.max(1, bpiMetrics.length - 3));
        const recentAvg = recent.reduce((s, d) => s + (d.avg_burnout_probability || 0), 0) / recent.length;
        const earlierAvg = earlier.reduce((s, d) => s + (d.avg_burnout_probability || 0), 0) / earlier.length;
        if (recentAvg > earlierAvg + 10)
            trend = 'worsening';
        else if (recentAvg < earlierAvg - 10)
            trend = 'improving';
        else
            trend = 'stable';
    }
    else {
        trend = 'stable';
    }
    let assessment;
    if (weeklyBPI < 25) {
        assessment = 'Excellent! Your burnout risk is very low. Keep maintaining this healthy pattern.';
    }
    else if (weeklyBPI < 45) {
        assessment = 'Good. You\'re managing well but watch for accumulated strain.';
    }
    else if (weeklyBPI < 65) {
        assessment = 'Caution. Your burnout risk is elevated. Consider prioritizing recovery.';
    }
    else {
        assessment = 'Warning! High burnout probability. Immediate action needed to prevent exhaustion.';
    }
    return { weeklyBPI, trend, assessment };
}
