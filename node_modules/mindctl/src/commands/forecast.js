// ═══════════════════════════════════════════════════
// 🌤️ mindctl forecast — Predictive Mood Forecast
// AI-powered cognitive weather prediction
// ═══════════════════════════════════════════════════

import chalk from 'chalk';
import ora from 'ora';
import { GRADIENTS, createInfoBox, progressBar, moodBar, sparkline } from '../ui/theme.js';
import { getMoodHistory, getSleepHistory, getWellnessSessions, getHabits, getHabitCompletions, getHabitStreak, getWaterToday, getScreenTimeToday, getGamification, getOverallStats } from '../db.js';
import { callAI } from '../ai.js';
import { showHeader, renderAscii, DIVIDERS, renderGradientAscii } from '../ui/ascii.js';

// ─── Forecast ASCII Art ───────────────────────────
const FORECAST_ART = {
    sunny: [
        '        \\  |  /     ',
        '      ─── ☀ ───    ',
        '        /  |  \\     ',
        '                    ',
        '    SUNNY OUTLOOK   ',
    ],
    cloudy: [
        '         ☁️         ',
        '      ╭──────╮      ',
        '    ╭─┤      ├─╮    ',
        '    ╰──────────╯    ',
        '   PARTLY CLOUDY    ',
    ],
    rainy: [
        '      ╭──────╮      ',
        '    ╭─┤  ☁️  ├─╮    ',
        '    ╰──────────╯    ',
        '     ╱ ╱ ╱ ╱ ╱      ',
        '    EMOTIONAL RAIN   ',
    ],
    stormy: [
        '    ╭═══════════╮   ',
        '   ╭┤   ⛈️    ├╮  ',
        '   ╰════════════╯   ',
        '    ⚡╱ ╱ ⚡╱ ╱     ',
        '    STORM WARNING    ',
    ],
    rainbow: [
        '         🌈          ',
        '      ╭──────╮      ',
        '    ╱──────────╲    ',
        '  ╱              ╲  ',
        '   LOOKING BRIGHT   ',
    ],
};

const HOUR_LABELS = ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'];

// ─── Compute Forecast ────────────────────────────
function computeForecast() {
    const moods = getMoodHistory(14);
    const sleep = getSleepHistory(7);
    const sessions = getWellnessSessions(7);
    const habits = getHabits();
    const gamification = getGamification();

    // ── Factor 1: Mood Trend (weight: 0.35) ──
    let moodFactor = 5;
    let moodTrend = 'stable';
    if (moods.length >= 2) {
        const recentAvg = moods.slice(0, Math.min(3, moods.length)).reduce((s, m) => s + m.mood_score, 0) / Math.min(3, moods.length);
        const olderAvg = moods.slice(3, Math.min(7, moods.length)).reduce((s, m) => s + m.mood_score, 0) / Math.max(1, Math.min(4, moods.length - 3));
        moodFactor = recentAvg;
        if (recentAvg > olderAvg + 0.5) moodTrend = 'improving';
        else if (recentAvg < olderAvg - 0.5) moodTrend = 'declining';
    } else if (moods.length === 1) {
        moodFactor = moods[0].mood_score;
    }

    // ── Factor 2: Sleep Quality (weight: 0.25) ──
    let sleepFactor = 5;
    let sleepStatus = 'unknown';
    if (sleep.length > 0) {
        const avgSleep = sleep.reduce((s, sl) => s + (sl.duration_hours || 0), 0) / sleep.length;
        const avgQuality = sleep.reduce((s, sl) => s + (sl.quality || 5), 0) / sleep.length;
        sleepFactor = (avgSleep >= 7 ? 8 : avgSleep >= 6 ? 6 : 4) * 0.5 + avgQuality * 0.5;
        sleepStatus = avgSleep >= 7 ? 'good' : avgSleep >= 6 ? 'moderate' : 'poor';
    }

    // ── Factor 3: Wellness Activity (weight: 0.2) ──
    let activityFactor = 3;
    let activityStatus = 'low';
    const recentSessions = sessions.filter(s => {
        const d = new Date(s.timestamp);
        return (Date.now() - d.getTime()) < 3 * 24 * 60 * 60 * 1000;
    });
    if (recentSessions.length >= 5) { activityFactor = 9; activityStatus = 'high'; }
    else if (recentSessions.length >= 3) { activityFactor = 7; activityStatus = 'moderate'; }
    else if (recentSessions.length >= 1) { activityFactor = 5; activityStatus = 'some'; }

    // ── Factor 4: Habit Streaks (weight: 0.1) ──
    let habitFactor = 3;
    let habitStatus = 'none';
    if (habits.length > 0) {
        const streaks = habits.map(h => getHabitStreak(h.id));
        const avgStreak = streaks.reduce((s, v) => s + v, 0) / streaks.length;
        habitFactor = avgStreak >= 7 ? 9 : avgStreak >= 3 ? 7 : avgStreak >= 1 ? 5 : 3;
        habitStatus = avgStreak >= 3 ? 'maintained' : avgStreak >= 1 ? 'building' : 'none';
    }

    // ── Factor 5: Streak & Engagement (weight: 0.1) ──
    let streakFactor = 3;
    const streak = gamification?.current_streak || 0;
    if (streak >= 14) streakFactor = 10;
    else if (streak >= 7) streakFactor = 8;
    else if (streak >= 3) streakFactor = 6;
    else if (streak >= 1) streakFactor = 4;

    // ── Weighted Score ──
    const predictedScore = (
        moodFactor * 0.35 +
        sleepFactor * 0.25 +
        activityFactor * 0.2 +
        habitFactor * 0.1 +
        streakFactor * 0.1
    );

    // ── Confidence ──
    const dataPoints = moods.length + sleep.length + sessions.length;
    const confidence = Math.min(95, Math.max(30, 30 + dataPoints * 3));

    // ── Weather Metaphor ──
    let weather;
    if (predictedScore >= 8) weather = 'sunny';
    else if (predictedScore >= 6.5) weather = 'rainbow';
    else if (predictedScore >= 5) weather = 'cloudy';
    else if (predictedScore >= 3.5) weather = 'rainy';
    else weather = 'stormy';

    // ── Hourly Risk Timeline ──
    const hourlyRisk = generateHourlyTimeline(sleep, moods, predictedScore);

    // ── Contributing Factors ──
    const factors = [];
    if (sleepStatus === 'good') factors.push({ icon: '✅', text: `Good sleep pattern (avg ${(sleep.reduce((s, sl) => s + (sl.duration_hours || 0), 0) / Math.max(1, sleep.length)).toFixed(1)}hrs)` });
    else if (sleepStatus === 'poor') factors.push({ icon: '🔴', text: 'Poor sleep detected — mood risk' });
    else if (sleepStatus === 'moderate') factors.push({ icon: '⚠️', text: 'Sleep could be better (<7hrs avg)' });
    else factors.push({ icon: '❓', text: 'No sleep data yet — log with `mindctl sleep log`' });

    if (moodTrend === 'improving') factors.push({ icon: '✅', text: `Mood trending upward (+${(moodFactor - 5).toFixed(1)})` });
    else if (moodTrend === 'declining') factors.push({ icon: '🔴', text: 'Mood trend declining — pay attention' });
    else factors.push({ icon: '➡️', text: 'Mood trend stable' });

    if (activityStatus === 'high') factors.push({ icon: '✅', text: `Active wellness practice (${recentSessions.length} sessions in 3 days)` });
    else if (activityStatus === 'low') factors.push({ icon: '⚠️', text: 'No recent wellness sessions detected' });
    else factors.push({ icon: '✅', text: `${recentSessions.length} wellness sessions recently` });

    if (habitStatus === 'maintained') factors.push({ icon: '✅', text: 'Habit streaks maintained' });
    else if (habitStatus === 'none') factors.push({ icon: '⚠️', text: 'No habit tracking — try `mindctl habit add`' });
    else factors.push({ icon: '✅', text: 'Building habit consistency' });

    if (streak >= 3) factors.push({ icon: '🔥', text: `${streak}-day engagement streak` });

    return {
        score: predictedScore,
        confidence,
        weather,
        moodTrend,
        sleepStatus,
        activityStatus,
        habitStatus,
        factors,
        hourlyRisk,
        rawData: { moods: moods.length, sleep: sleep.length, sessions: sessions.length, habits: habits.length },
    };
}

function generateHourlyTimeline(sleep, moods, baseScore) {
    // Model energy throughout the day based on sleep and patterns
    const timeline = [
        { hour: '6am', energy: baseScore * 0.7, label: 'Wake up', risk: 'low' },
        { hour: '8am', energy: baseScore * 0.85, label: 'Morning ramp', risk: 'low' },
        { hour: '10am', energy: baseScore * 1.0, label: 'Peak focus', risk: 'low' },
        { hour: '12pm', energy: baseScore * 0.95, label: 'Pre-lunch', risk: 'low' },
        { hour: '2pm', energy: baseScore * 0.75, label: 'Afternoon dip', risk: 'medium' },
        { hour: '4pm', energy: baseScore * 0.8, label: 'Recovery', risk: 'low' },
        { hour: '6pm', energy: baseScore * 0.7, label: 'Wind down', risk: 'medium' },
        { hour: '8pm', energy: baseScore * 0.6, label: 'Evening', risk: 'medium' },
        { hour: '10pm', energy: baseScore * 0.45, label: 'Burnout zone', risk: 'high' },
    ];

    // Adjust based on sleep data
    if (sleep.length > 0) {
        const avgSleep = sleep.reduce((s, sl) => s + (sl.duration_hours || 0), 0) / sleep.length;
        if (avgSleep < 6) {
            // Poor sleep = worse afternoon
            timeline[4].energy *= 0.7;
            timeline[4].risk = 'high';
            timeline[5].energy *= 0.8;
            timeline[6].risk = 'high';
        }
    }

    // Categorize risk
    timeline.forEach(t => {
        if (t.energy >= 6) t.risk = 'low';
        else if (t.energy >= 4) t.risk = 'medium';
        else t.risk = 'high';
    });

    return timeline;
}

// ─── Main Command ─────────────────────────────────
export async function forecastCommand() {
    showHeader('forecast', '#FFD93D');
    console.log('');

    const spinner = ora({
        text: chalk.dim('  Computing wellness forecast...'),
        color: 'yellow',
    }).start();

    const forecast = computeForecast();

    // AI Insight
    let aiInsight = '';
    try {
        const forecastData = {
            predictedMood: forecast.score.toFixed(1),
            confidence: forecast.confidence,
            weather: forecast.weather,
            factors: forecast.factors.map(f => f.text),
            dataPoints: forecast.rawData,
        };

        aiInsight = await callAI([
            {
                role: 'system',
                content: `You are a predictive wellness advisor for developers. Given wellness forecast data, provide:
1. A brief weather-metaphor opening (1 sentence)
2. One proactive suggestion for tomorrow based on the data (1-2 sentences)
3. The optimal time window for deep work based on the energy timeline
Keep under 60 words. Be warm, specific, and actionable.`,
            },
            { role: 'user', content: `Forecast data:\n${JSON.stringify(forecastData, null, 2)}` },
        ], { temperature: 0.7, maxTokens: 150, type: 'forecast' });

        spinner.succeed(chalk.dim('Forecast computed'));
    } catch {
        spinner.succeed(chalk.dim('Forecast computed (offline mode)'));
        aiInsight = `Based on your patterns, ${forecast.weather === 'sunny' ? 'tomorrow looks bright!' : forecast.weather === 'stormy' ? 'take it easy tomorrow — prioritize rest.' : 'tomorrow is a mixed bag — focus on what you can control.'}`;
    }

    // ── Forecast Date ──
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    // ── Display ──
    console.log('');
    console.log(chalk.hex('#FFD93D').bold('  ╔══════════════════════════════════════════════╗'));
    console.log(chalk.hex('#FFD93D').bold('  ║     🌤️  WELLNESS FORECAST                    ║'));
    console.log(chalk.hex('#FFD93D').bold('  ╠══════════════════════════════════════════════╣'));
    console.log(chalk.hex('#FFD93D')('  ║                                              ║'));
    console.log(chalk.hex('#FFD93D')(`  ║  📅 ${dateStr.padEnd(40)} ║`));
    console.log(chalk.hex('#FFD93D')('  ║                                              ║'));

    // Weather art
    const art = FORECAST_ART[forecast.weather];
    art.forEach(line => {
        console.log(chalk.hex('#FFD93D')(`  ║  ${chalk.hex(getWeatherColor(forecast.weather))(line.padEnd(42))} ║`));
    });

    console.log(chalk.hex('#FFD93D')('  ║                                              ║'));

    // Predicted Score
    const scoreColor = forecast.score >= 7 ? '#4ECDC4' : forecast.score >= 5 ? '#FFD93D' : '#FF6B6B';
    const scoreBar = moodBar(forecast.score * 10, 20);
    console.log(chalk.hex('#FFD93D')(`  ║  ${chalk.hex(scoreColor).bold(`PREDICTED MOOD: ${forecast.score.toFixed(1)}/10`)}${' '.repeat(22)} ║`));
    console.log(chalk.hex('#FFD93D')(`  ║  ${scoreBar}${' '.repeat(22)} ║`));
    console.log(chalk.hex('#FFD93D')(`  ║  ${chalk.dim(`CONFIDENCE: ${forecast.confidence}%`)}${' '.repeat(30)} ║`));

    console.log(chalk.hex('#FFD93D')('  ║                                              ║'));

    // Contributing Factors
    console.log(chalk.hex('#FFD93D')(`  ║  ${chalk.bold('📊 CONTRIBUTING FACTORS:')}${' '.repeat(19)} ║`));
    forecast.factors.forEach(f => {
        const line = `  ${f.icon} ${f.text}`;
        console.log(chalk.hex('#FFD93D')(`  ║  ${chalk.dim(line).substring(0, 42).padEnd(42)} ║`));
    });

    console.log(chalk.hex('#FFD93D')('  ║                                              ║'));

    // Hourly Timeline
    console.log(chalk.hex('#FFD93D')(`  ║  ${chalk.bold('⏰ HOURLY RISK TIMELINE:')}${' '.repeat(19)} ║`));
    forecast.hourlyRisk.forEach(h => {
        const riskIcon = h.risk === 'low' ? '🟢' : h.risk === 'medium' ? '🟡' : '🔴';
        const bar = '█'.repeat(Math.max(1, Math.round(h.energy))) + '░'.repeat(Math.max(0, 10 - Math.round(h.energy)));
        const line = `${h.hour.padEnd(5)} ${riskIcon} ${chalk.hex(h.risk === 'high' ? '#FF6B6B' : h.risk === 'medium' ? '#FFD93D' : '#4ECDC4')(bar)} ${h.label}`;
        console.log(chalk.hex('#FFD93D')(`  ║  ${line.substring(0, 44).padEnd(44)} ║`));
    });

    console.log(chalk.hex('#FFD93D')('  ║                                              ║'));

    // AI Insight
    console.log(chalk.hex('#FFD93D')(`  ║  ${chalk.bold('💡 AI INSIGHT:')}${' '.repeat(28)} ║`));
    const wrappedInsight = wrapText(aiInsight, 40);
    wrappedInsight.forEach(line => {
        console.log(chalk.hex('#FFD93D')(`  ║  ${chalk.hex('#45B7D1').italic(line.padEnd(42))} ║`));
    });

    console.log(chalk.hex('#FFD93D')('  ║                                              ║'));
    console.log(chalk.hex('#FFD93D').bold('  ╚══════════════════════════════════════════════╝'));
    console.log('');

    // Data transparency
    console.log(chalk.dim(`  Forecast based on: ${forecast.rawData.moods} mood entries, ${forecast.rawData.sleep} sleep logs, ${forecast.rawData.sessions} sessions`));
    console.log(chalk.dim('  More data = more accurate predictions. Keep tracking! 📈'));
    console.log('');
}

// ─── Helpers ──────────────────────────────────────
function getWeatherColor(weather) {
    const colors = {
        sunny: '#FFD700',
        rainbow: '#E040FB',
        cloudy: '#45B7D1',
        rainy: '#7B68EE',
        stormy: '#FF6B6B',
    };
    return colors[weather] || '#FFD93D';
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

export default { forecastCommand };
