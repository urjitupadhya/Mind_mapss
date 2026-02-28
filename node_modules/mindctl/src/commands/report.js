// ═══════════════════════════════════════════════════
// 📊 mindctl report — AI Weekly Wellness Report
// Narrative storytelling with data insights
// ═══════════════════════════════════════════════════

import chalk from 'chalk';
import ora from 'ora';
import { GRADIENTS, createInfoBox, progressBar, moodBar, sparkline } from '../ui/theme.js';
import { getMoodHistory, getSleepHistory, getWellnessSessions, getHabits, getHabitCompletions, getHabitStreak, getWaterToday, getGamification, getDailySummaries } from '../db.js';
import { callAI } from '../ai.js';
import { showHeader, renderAscii, DIVIDERS, renderGradientAscii } from '../ui/ascii.js';
import { getDb } from '../db.js';

// ─── Report ASCII Art ─────────────────────────────
const REPORT_ART = [
    '  ╔═══════════════════════════════════╗',
    '  ║    📊  W E E K L Y  R E P O R T  ║',
    '  ║    ─────────────────────────────  ║',
    '  ║      Your wellness narrative      ║',
    '  ╚═══════════════════════════════════╝',
];

// ─── Compute Weekly Stats ─────────────────────────
function computeWeeklyStats() {
    const moods = getMoodHistory(7);
    const prevMoods = getMoodHistory(14).filter(m => {
        const d = new Date(m.timestamp);
        return (Date.now() - d.getTime()) > 7 * 24 * 60 * 60 * 1000;
    });
    const sleep = getSleepHistory(7);
    const sessions = getWellnessSessions(7);
    const habits = getHabits();
    const gamification = getGamification();

    // Mood stats
    const moodAvg = moods.length > 0 ? moods.reduce((s, m) => s + m.mood_score, 0) / moods.length : 0;
    const prevMoodAvg = prevMoods.length > 0 ? prevMoods.reduce((s, m) => s + m.mood_score, 0) / prevMoods.length : moodAvg;
    const moodChange = moodAvg - prevMoodAvg;
    const moodTrend = moodChange > 0.5 ? 'up' : moodChange < -0.5 ? 'down' : 'stable';

    // Sleep stats
    const sleepAvg = sleep.length > 0 ? sleep.reduce((s, sl) => s + (sl.duration_hours || 0), 0) / sleep.length : 0;
    const sleepQualityAvg = sleep.length > 0 ? sleep.reduce((s, sl) => s + (sl.quality || 5), 0) / sleep.length : 0;

    // Session stats
    const breathingSessions = sessions.filter(s => s.type === 'breathing').length;
    const meditationSessions = sessions.filter(s => s.type === 'meditation').length;
    const totalSessionTime = sessions.reduce((s, sess) => s + (sess.duration_seconds || 0), 0);

    // Habit stats
    const habitCompletionRate = habits.length > 0 ? (() => {
        let total = 0, completed = 0;
        habits.forEach(h => {
            const comps = getHabitCompletions(h.id, 7);
            total += 7;
            completed += comps.length;
        });
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    })() : 0;

    // Water stats
    let waterData = [];
    try {
        const db = getDb();
        waterData = db.prepare(`SELECT date, SUM(glasses) as total FROM water_log WHERE date >= date('now', '-7 days') GROUP BY date`).all();
    } catch { }
    const waterAvg = waterData.length > 0 ? waterData.reduce((s, w) => s + w.total, 0) / waterData.length : 0;

    // Mood by day for sparkline
    const moodByDay = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayMoods = moods.filter(m => (m.timestamp || '').startsWith(dateStr));
        const avg = dayMoods.length > 0 ? dayMoods.reduce((s, m) => s + m.mood_score, 0) / dayMoods.length : 0;
        moodByDay.push({ day: dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1], score: avg });
    }

    // Wins
    const wins = [];
    if (moods.length >= 7) wins.push(`Logged mood daily (${moods.length} entries)`);
    if (gamification?.current_streak >= 7) wins.push(`Maintained ${gamification.current_streak}-day streak`);
    if (breathingSessions >= 3) wins.push(`Completed ${breathingSessions} breathing sessions`);
    if (meditationSessions >= 2) wins.push(`${meditationSessions} meditation sessions`);
    if (habitCompletionRate >= 70) wins.push(`Habit completion: ${habitCompletionRate}%`);
    if (sleepAvg >= 7) wins.push(`Averaged ${sleepAvg.toFixed(1)}hrs sleep`);
    if (wins.length === 0 && moods.length > 0) wins.push('Showed up and tracked wellness');

    // Focus areas
    const focus = [];
    if (sleepAvg > 0 && sleepAvg < 7) focus.push(`Sleep: Target 7.5hrs for 5 nights`);
    if (breathingSessions < 2) focus.push('Add 2-3 breathing sessions');
    if (habitCompletionRate < 50) focus.push('Focus on habit consistency');
    if (waterAvg < 6) focus.push('Increase water intake to 8 glasses/day');
    if (focus.length === 0) focus.push('Maintain your excellent routine!');

    const dateRange = (() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${fmt(start)} - ${fmt(end)}, ${end.getFullYear()}`;
    })();

    return {
        dateRange,
        mood: { avg: moodAvg, change: moodChange, trend: moodTrend, byDay: moodByDay, count: moods.length },
        sleep: { avg: sleepAvg, quality: sleepQualityAvg, count: sleep.length },
        sessions: { breathing: breathingSessions, meditation: meditationSessions, totalTime: totalSessionTime, total: sessions.length },
        habits: { rate: habitCompletionRate, count: habits.length },
        water: { avg: waterAvg },
        streak: gamification?.current_streak || 0,
        longestStreak: gamification?.longest_streak || 0,
        level: gamification?.user_level || 1,
        xp: gamification?.user_xp || 0,
        wins,
        focus,
    };
}

// ─── Main Command ─────────────────────────────────
export async function reportCommand() {
    showHeader('report', '#6C63FF');
    console.log('');

    const spinner = ora({
        text: chalk.dim('  Generating weekly wellness report...'),
        color: 'blue',
    }).start();

    const stats = computeWeeklyStats();

    // Generate AI narrative
    let aiNarrative = '';
    try {
        aiNarrative = await callAI([
            {
                role: 'system',
                content: `You are a supportive wellness coach generating a weekly report for a developer.
Write a 100-word narrative using a weather/nature metaphor. Include:
1. Opening metaphor about their "cognitive weather" this week
2. Key pattern observed (specific data reference)
3. What went well (celebrate wins)
4. One gentle priority for next week
Tone: encouraging, non-judgmental, evidence-based. Use "you" language.`,
            },
            { role: 'user', content: `Weekly data:\n${JSON.stringify(stats, null, 2)}` },
        ], { temperature: 0.8, maxTokens: 250, type: 'weekly' });

        spinner.succeed(chalk.dim('Report generated'));
    } catch {
        spinner.succeed(chalk.dim('Report generated (offline)'));
        aiNarrative = `This week was ${stats.mood.trend === 'up' ? 'an upward journey' : stats.mood.trend === 'down' ? 'a challenging stretch' : 'a steady cruise'}. Your mood averaged ${stats.mood.avg.toFixed(1)}/10 across ${stats.mood.count} check-ins. ${stats.wins[0] || 'You showed up, and that matters.'}. Next week, focus on ${stats.focus[0] || 'maintaining your routine'}.`;
    }

    // ── Display Report ──
    console.log('');

    // Report header
    REPORT_ART.forEach(line => console.log(chalk.hex('#6C63FF')(line)));
    console.log(chalk.hex('#6C63FF')(`  ${chalk.dim(stats.dateRange)}`));
    console.log('');

    // Overview box
    console.log(chalk.hex('#45B7D1').bold('  📊 OVERVIEW'));
    console.log(chalk.hex('#45B7D1')('  ─────────────────────────────────'));

    const trendIcon = stats.mood.trend === 'up' ? '↗️' : stats.mood.trend === 'down' ? '↘️' : '➡️';
    const trendColor = stats.mood.trend === 'up' ? '#4ECDC4' : stats.mood.trend === 'down' ? '#FF6B6B' : '#FFD93D';
    const changeStr = stats.mood.change > 0 ? `+${(stats.mood.change * 10).toFixed(0)}%` : `${(stats.mood.change * 10).toFixed(0)}%`;

    console.log(`  Mood Trend:     ${trendIcon} ${chalk.hex(trendColor).bold(changeStr)} ${stats.mood.trend === 'stable' ? 'stable' : stats.mood.trend === 'up' ? 'improvement' : 'decline'}`);

    if (stats.sleep.count > 0) {
        const sleepIcon = stats.sleep.avg >= 7 ? '✅' : stats.sleep.avg >= 6 ? '⚠️' : '🔴';
        console.log(`  Sleep Quality:  ${sleepIcon} ${chalk.dim(`${stats.sleep.avg.toFixed(1)}hrs avg, quality ${stats.sleep.quality.toFixed(1)}/10`)}`);
    } else {
        console.log(`  Sleep Quality:  ${chalk.dim('No data — log with `mindctl sleep log`')}`);
    }

    console.log(`  Habit Strength: ${stats.habits.rate >= 70 ? '✅' : stats.habits.rate >= 40 ? '⚠️' : '🔴'} ${chalk.dim(`${stats.habits.rate}% completion (${stats.habits.count} habits tracked)`)}`);

    const burnoutRisk = stats.mood.avg < 4 || stats.sleep.avg < 5 ? 'High' : stats.mood.avg < 6 ? 'Moderate' : 'Low';
    const burnoutColor = burnoutRisk === 'High' ? '#FF6B6B' : burnoutRisk === 'Moderate' ? '#FFD93D' : '#4ECDC4';
    console.log(`  Burnout Risk:   ${chalk.hex(burnoutColor).bold(burnoutRisk)}`);
    console.log('');

    // Mood sparkline
    console.log(chalk.hex('#E040FB').bold('  📈 MOOD TREND'));
    console.log(chalk.hex('#E040FB')('  ─────────────────────────────────'));
    stats.mood.byDay.forEach(d => {
        const bar = d.score > 0 ? progressBar(d.score, 10, 15, d.score >= 7 ? '#4ECDC4' : d.score >= 5 ? '#FFD93D' : '#FF6B6B') : chalk.dim('  (no data)');
        console.log(`  ${chalk.dim(d.day)}  ${bar} ${d.score > 0 ? chalk.bold(d.score.toFixed(1)) : ''}`);
    });
    console.log('');

    // AI Narrative
    console.log(chalk.hex('#FFD93D').bold('  🎯 KEY INSIGHT'));
    console.log(chalk.hex('#FFD93D')('  ─────────────────────────────────'));
    const narrativeLines = wrapText(aiNarrative, 50);
    narrativeLines.forEach(line => {
        console.log(chalk.hex('#45B7D1').italic(`  ${line}`));
    });
    console.log('');

    // Wins
    console.log(chalk.hex('#4ECDC4').bold('  🏆 WINS THIS WEEK'));
    console.log(chalk.hex('#4ECDC4')('  ─────────────────────────────────'));
    stats.wins.forEach(w => console.log(chalk.hex('#4ECDC4')(`  ├─ ✅ ${w}`)));
    console.log('');

    // Focus areas
    console.log(chalk.hex('#FF8E53').bold('  🎯 FOCUS AREAS'));
    console.log(chalk.hex('#FF8E53')('  ─────────────────────────────────'));
    stats.focus.forEach(f => console.log(chalk.hex('#FF8E53')(`  ├─ ${f}`)));
    console.log('');

    // Level & XP
    const xpProgress = stats.xp % 100;
    const xpBar = progressBar(xpProgress, 100, 20, '#6C63FF');
    console.log(chalk.hex('#6C63FF')(`  ⭐ Level ${stats.level} • ${stats.xp} XP  [${xpBar}]`));
    console.log(chalk.hex('#FFD93D')(`  🔥 Streak: ${stats.streak} days (longest: ${stats.longestStreak})`));
    console.log('');
    console.log(chalk.hex('#9B89B3').italic('  "Progress is not linear, but it is always valuable."'));
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

export default { reportCommand };
