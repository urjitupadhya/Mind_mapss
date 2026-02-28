// ═══════════════════════════════════════════════════
// 🔗 mindctl insights — Behavioral Correlation Engine
// Discovers statistical relationships in wellness data
// ═══════════════════════════════════════════════════

import chalk from 'chalk';
import ora from 'ora';
import { GRADIENTS, createInfoBox, progressBar, moodBar, sparkline } from '../ui/theme.js';
import { getMoodHistory, getSleepHistory, getWellnessSessions, getHabits, getHabitCompletions, getHabitStreak, getWaterToday, getScreenTimeToday, getGamification, getDailySummaries } from '../db.js';
import { callAI } from '../ai.js';
import { showHeader, renderAscii, DIVIDERS } from '../ui/ascii.js';
import { getDb } from '../db.js';

// ─── Pearson Correlation ──────────────────────────
function pearsonCorrelation(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 3) return { r: 0, p: 1, significant: false };

    const xSlice = x.slice(0, n);
    const ySlice = y.slice(0, n);

    const avgX = xSlice.reduce((s, v) => s + v, 0) / n;
    const avgY = ySlice.reduce((s, v) => s + v, 0) / n;

    let sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
        const dx = xSlice[i] - avgX;
        const dy = ySlice[i] - avgY;
        sumXY += dx * dy;
        sumX2 += dx * dx;
        sumY2 += dy * dy;
    }

    const denom = Math.sqrt(sumX2 * sumY2);
    if (denom === 0) return { r: 0, p: 1, significant: false };

    const r = sumXY / denom;

    // t-test for significance
    const t = r * Math.sqrt((n - 2) / (1 - r * r + 0.0001));
    // Approximate p-value (simplified)
    const p = n > 5 ? Math.max(0.001, 1 - Math.min(1, Math.abs(t) / 3)) : 0.5;
    const significant = Math.abs(r) > 0.3 && p < 0.1;

    return { r: parseFloat(r.toFixed(3)), p: parseFloat(p.toFixed(3)), significant, n };
}

// ─── Data Alignment by Date ───────────────────────
function alignDataByDate(moods, sleep, sessions) {
    const dateMap = {};

    // Mood: average per day
    moods.forEach(m => {
        const date = (m.timestamp || '').split('T')[0] || (m.timestamp || '').split(' ')[0];
        if (!date) return;
        if (!dateMap[date]) dateMap[date] = { mood: [], energy: [], sleep: null, sessions: 0, water: 0 };
        dateMap[date].mood.push(m.mood_score);
        dateMap[date].energy.push(m.energy || 5);
    });

    // Sleep: join by date
    sleep.forEach(s => {
        const date = s.date;
        if (!date) return;
        if (!dateMap[date]) dateMap[date] = { mood: [], energy: [], sleep: null, sessions: 0, water: 0 };
        dateMap[date].sleep = { hours: s.duration_hours, quality: s.quality };
    });

    // Sessions: count per day
    sessions.forEach(s => {
        const date = (s.timestamp || '').split('T')[0] || (s.timestamp || '').split(' ')[0];
        if (!date) return;
        if (!dateMap[date]) dateMap[date] = { mood: [], energy: [], sleep: null, sessions: 0, water: 0 };
        dateMap[date].sessions++;
    });

    // Water per day
    try {
        const db = getDb();
        const waterData = db.prepare('SELECT date, SUM(glasses) as total FROM water_log GROUP BY date').all();
        waterData.forEach(w => {
            if (dateMap[w.date]) dateMap[w.date].water = w.total;
        });
    } catch { }

    return dateMap;
}

// ─── Compute Correlations ─────────────────────────
function computeCorrelations() {
    const moods = getMoodHistory(30);
    const sleep = getSleepHistory(30);
    const sessions = getWellnessSessions(30);
    const dateMap = alignDataByDate(moods, sleep, sessions);

    const dates = Object.keys(dateMap).sort();
    const correlations = [];

    // Prepare aligned arrays
    const dailyMood = [];
    const dailyEnergy = [];
    const dailySleepHours = [];
    const dailySleepQuality = [];
    const dailySessions = [];
    const dailyWater = [];

    // Next-day mood (shifted)
    const nextDayMood = [];

    for (let i = 0; i < dates.length; i++) {
        const d = dateMap[dates[i]];
        const avgMood = d.mood.length > 0 ? d.mood.reduce((s, v) => s + v, 0) / d.mood.length : null;
        const avgEnergy = d.energy.length > 0 ? d.energy.reduce((s, v) => s + v, 0) / d.energy.length : null;

        if (avgMood !== null) {
            dailyMood.push(avgMood);
            dailyEnergy.push(avgEnergy || 5);
            dailySleepHours.push(d.sleep?.hours || 0);
            dailySleepQuality.push(d.sleep?.quality || 0);
            dailySessions.push(d.sessions);
            dailyWater.push(d.water);

            // Next day mood
            if (i + 1 < dates.length) {
                const nextD = dateMap[dates[i + 1]];
                const nextMood = nextD.mood.length > 0 ? nextD.mood.reduce((s, v) => s + v, 0) / nextD.mood.length : avgMood;
                nextDayMood.push(nextMood);
            }
        }
    }

    // ── Correlation 1: Sleep Hours ↔ Mood ──
    if (dailySleepHours.filter(v => v > 0).length >= 3) {
        const filtered = { x: [], y: [] };
        dailySleepHours.forEach((v, i) => {
            if (v > 0) { filtered.x.push(v); filtered.y.push(dailyMood[i]); }
        });
        const result = pearsonCorrelation(filtered.x, filtered.y);
        correlations.push({
            name: 'Sleep Hours ↔ Mood',
            ...result,
            icon: '💤',
            description: result.r > 0 ? 'More sleep tends to improve your mood' : 'Sleep pattern needs attention',
            goodLabel: 'WHEN YOU SLEEP WELL (≥7hrs)',
            badLabel: 'WHEN YOU SLEEP POORLY (<6hrs)',
            getGoodStats: () => {
                const good = dailySleepHours.map((v, i) => v >= 7 ? dailyMood[i] : null).filter(v => v !== null);
                return good.length > 0 ? (good.reduce((s, v) => s + v, 0) / good.length).toFixed(1) : 'N/A';
            },
            getBadStats: () => {
                const bad = dailySleepHours.map((v, i) => v > 0 && v < 6 ? dailyMood[i] : null).filter(v => v !== null);
                return bad.length > 0 ? (bad.reduce((s, v) => s + v, 0) / bad.length).toFixed(1) : 'N/A';
            },
        });
    }

    // ── Correlation 2: Sleep Quality ↔ Energy ──
    if (dailySleepQuality.filter(v => v > 0).length >= 3) {
        const filtered = { x: [], y: [] };
        dailySleepQuality.forEach((v, i) => {
            if (v > 0) { filtered.x.push(v); filtered.y.push(dailyEnergy[i]); }
        });
        const result = pearsonCorrelation(filtered.x, filtered.y);
        correlations.push({
            name: 'Sleep Quality ↔ Energy',
            ...result,
            icon: '⚡',
            description: result.r > 0 ? 'Better sleep quality boosts your energy' : 'Sleep quality may not affect energy much',
        });
    }

    // ── Correlation 3: Wellness Sessions ↔ Next-Day Mood ──
    if (dailySessions.length >= 3 && nextDayMood.length >= 3) {
        const sessSlice = dailySessions.slice(0, nextDayMood.length);
        const result = pearsonCorrelation(sessSlice, nextDayMood);
        correlations.push({
            name: 'Wellness Activity ↔ Next-Day Mood',
            ...result,
            icon: '🧘',
            description: result.r > 0 ? 'Wellness sessions improve your next-day mood' : 'More data needed to see clear impact',
        });
    }

    // ── Correlation 4: Water ↔ Mood ──
    if (dailyWater.filter(v => v > 0).length >= 3) {
        const filtered = { x: [], y: [] };
        dailyWater.forEach((v, i) => {
            if (v > 0) { filtered.x.push(v); filtered.y.push(dailyMood[i]); }
        });
        const result = pearsonCorrelation(filtered.x, filtered.y);
        correlations.push({
            name: 'Water Intake ↔ Mood',
            ...result,
            icon: '💧',
            description: result.r > 0 ? 'Hydration positively influences your mood' : 'Hydration impact is subtle — keep tracking',
        });
    }

    // ── Correlation 5: Energy ↔ Mood ──
    if (dailyEnergy.length >= 3) {
        const result = pearsonCorrelation(dailyEnergy, dailyMood);
        correlations.push({
            name: 'Energy Level ↔ Mood',
            ...result,
            icon: '🔋',
            description: result.r > 0 ? 'Your energy and mood are closely linked' : 'Energy and mood move independently',
        });
    }

    // Sort by absolute correlation strength
    correlations.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));

    return {
        correlations,
        dataPoints: { moods: moods.length, sleep: sleep.length, sessions: sessions.length, days: dates.length },
    };
}

// ─── Main Command ─────────────────────────────────
export async function insightsCommand() {
    showHeader('insights', '#E040FB');
    console.log('');

    const spinner = ora({
        text: chalk.dim('  Computing behavioral correlations...'),
        color: 'magenta',
    }).start();

    const { correlations, dataPoints } = computeCorrelations();

    spinner.succeed(chalk.dim('Analysis complete'));

    console.log('');
    console.log(chalk.hex('#E040FB').bold('  ╔══════════════════════════════════════════════╗'));
    console.log(chalk.hex('#E040FB').bold('  ║     🔗  BEHAVIORAL CORRELATIONS              ║'));
    console.log(chalk.hex('#E040FB').bold('  ╠══════════════════════════════════════════════╣'));
    console.log(chalk.hex('#E040FB')('  ║                                              ║'));

    if (correlations.length === 0) {
        console.log(chalk.hex('#E040FB')('  ║  Not enough data for correlations yet.        ║'));
        console.log(chalk.hex('#E040FB')('  ║                                              ║'));
        console.log(chalk.hex('#E040FB')('  ║  📊 Keep tracking to unlock insights:         ║'));
        console.log(chalk.hex('#E040FB')('  ║  • mindctl check-in  (log mood daily)        ║'));
        console.log(chalk.hex('#E040FB')('  ║  • mindctl sleep log (track sleep)            ║'));
        console.log(chalk.hex('#E040FB')('  ║  • mindctl water     (log hydration)          ║'));
        console.log(chalk.hex('#E040FB')('  ║  • mindctl breathe   (wellness sessions)     ║'));
        console.log(chalk.hex('#E040FB')('  ║                                              ║'));
        console.log(chalk.hex('#E040FB')('  ║  Need at least 3 days of data per metric.    ║'));
    } else {
        correlations.forEach((corr, idx) => {
            const strength = Math.abs(corr.r);
            let strengthLabel, strengthColor;
            if (strength >= 0.7) { strengthLabel = 'STRONG'; strengthColor = '#FF6B6B'; }
            else if (strength >= 0.4) { strengthLabel = 'MODERATE'; strengthColor = '#FFD93D'; }
            else { strengthLabel = 'WEAK'; strengthColor = '#4ECDC4'; }

            const direction = corr.r > 0 ? '↑↑' : '↓↑';
            const significance = corr.significant ? chalk.hex('#4ECDC4')(' ★') : '';

            console.log(chalk.hex('#E040FB')(`  ║  ${corr.icon} ${chalk.bold(corr.name)}${' '.repeat(Math.max(1, 28 - corr.name.length))}║`));
            console.log(chalk.hex('#E040FB')(`  ║    ${chalk.hex(strengthColor).bold(strengthLabel)} (r=${corr.r > 0 ? '+' : ''}${corr.r})${significance}${' '.repeat(Math.max(1, 26 - strengthLabel.length))}║`));

            // Correlation bar
            const barLen = Math.round(Math.abs(corr.r) * 20);
            const bar = (corr.r > 0 ? chalk.hex('#4ECDC4') : chalk.hex('#FF6B6B'))('█'.repeat(barLen)) + chalk.dim('░'.repeat(20 - barLen));
            console.log(chalk.hex('#E040FB')(`  ║    [${bar}]${' '.repeat(19)}║`));

            console.log(chalk.hex('#E040FB')(`  ║    ${chalk.dim(corr.description)}${' '.repeat(Math.max(1, 37 - corr.description.length))}║`));

            // Good/bad comparison if available
            if (corr.getGoodStats) {
                console.log(chalk.hex('#E040FB')(`  ║    ${chalk.hex('#4ECDC4')(`📈 ${corr.goodLabel}: Mood ${corr.getGoodStats()}/10`)}${' '.repeat(5)}║`));
                console.log(chalk.hex('#E040FB')(`  ║    ${chalk.hex('#FF6B6B')(`📉 ${corr.badLabel}: Mood ${corr.getBadStats()}/10`)}${' '.repeat(5)}║`));
            }

            console.log(chalk.hex('#E040FB')('  ║                                              ║'));
        });
    }

    // AI Recommendation
    if (correlations.length > 0) {
        const topCorr = correlations[0];
        let aiRecommendation = '';

        try {
            aiRecommendation = await callAI([
                {
                    role: 'system',
                    content: `You are a data-driven wellness advisor. Given correlation data between wellness metrics, provide ONE specific, actionable recommendation based on the strongest correlation found. Be warm, specific, and evidence-based. Keep under 40 words.`,
                },
                {
                    role: 'user',
                    content: `Strongest correlation: ${topCorr.name} (r=${topCorr.r}, ${topCorr.significant ? 'statistically significant' : 'not yet significant'}). Description: ${topCorr.description}. Data points: ${topCorr.n} days.`,
                },
            ], { temperature: 0.6, maxTokens: 100, type: 'insights' });
        } catch {
            aiRecommendation = `Your data shows ${topCorr.name.toLowerCase()} is your strongest wellness lever. Focus on improving ${topCorr.name.split(' ↔ ')[0].toLowerCase()} for maximum impact.`;
        }

        console.log(chalk.hex('#E040FB')(`  ║  ${chalk.bold('💡 AI RECOMMENDATION:')}${' '.repeat(21)} ║`));
        const wrapped = wrapText(aiRecommendation, 40);
        wrapped.forEach(line => {
            console.log(chalk.hex('#E040FB')(`  ║  ${chalk.hex('#45B7D1').italic(line.padEnd(42))} ║`));
        });
        console.log(chalk.hex('#E040FB')('  ║                                              ║'));
    }

    console.log(chalk.hex('#E040FB').bold('  ╚══════════════════════════════════════════════╝'));
    console.log('');
    console.log(chalk.dim(`  Analysis based on: ${dataPoints.moods} moods, ${dataPoints.sleep} sleep logs, ${dataPoints.sessions} sessions across ${dataPoints.days} days`));
    console.log(chalk.dim('  ★ = statistically significant correlation'));
    console.log('');
}

function wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
        if ((current + ' ' + word).trim().length > maxWidth) {
            lines.push(current.trim());
            current = word;
        } else {
            current = (current + ' ' + word).trim();
        }
    }
    if (current.trim()) lines.push(current.trim());
    return lines;
}

export default { insightsCommand };
