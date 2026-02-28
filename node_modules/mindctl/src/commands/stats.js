// ═══════════════════════════════════════════════════
// 📊 mindctl stats — Wellness Analytics Dashboard
// Terminal-based charts, trends, and AI insights
// ═══════════════════════════════════════════════════

import chalk from 'chalk';
import ora from 'ora';
import { GRADIENTS, createInfoBox, progressBar, moodBar, sparkline, scoreDisplay, calendarHeatmap, fancyDivider, formatDuration, MOOD_COLORS } from '../ui/theme.js';
import { getMoodHistory, getMoodToday, getWellnessSessions, getJournalEntries, getOverallStats, getHabits, getHabitStreak, getSleepHistory, getWaterToday, getScreenTimeToday, getGamification, getDailySummaries } from '../db.js';
import { generateWeeklyReport } from '../ai.js';
import { renderCompanion } from '../companion.js';
import { showHeader, renderAscii, DIVIDERS } from '../ui/ascii.js';

export async function statsCommand(subcommand, options = {}) {
    switch (subcommand) {
        case 'today':
            return todayStats();
        case 'week':
            return weekStats();
        case 'month':
            return monthStats();
        case 'report':
            return weeklyReport();
        default:
            return todayStats();
    }
}

async function todayStats() {
    showHeader('stats', '#45B7D1');
    console.log('');

    const today = getMoodToday();
    const sessions = getWellnessSessions(1);
    const water = getWaterToday();
    const screenTime = getScreenTimeToday();
    const gamification = getGamification();

    // Mood
    if (today.length > 0) {
        const avg = today.reduce((s, e) => s + e.mood_score, 0) / today.length;
        const moods = today.map(e => MOOD_COLORS[e.mood]?.emoji || '•').join(' → ');
        console.log(`  🎭 Mood:        ${moodBar(avg * 10, 15)} ${chalk.bold(avg.toFixed(1))} ${moods}`);
    } else {
        console.log(chalk.dim('  🎭 Mood:        No check-ins yet today'));
    }

    // Exercises
    const breathing = sessions.filter(s => s.type === 'breathing').length;
    const meditation = sessions.filter(s => s.type === 'meditation').length;
    console.log(`  🫁 Breathing:   ${breathing} session${breathing !== 1 ? 's' : ''}`);
    console.log(`  🧘 Meditation:  ${meditation} session${meditation !== 1 ? 's' : ''}`);

    // Water
    console.log(`  💧 Water:       ${progressBar(water, 8, 15)} ${water}/8 glasses`);

    // Screen time
    console.log(`  🖥️  Screen time: ${formatDuration(screenTime)}`);

    // Streak & XP
    console.log('');
    console.log(`  🔥 Streak: ${chalk.hex('#FFD93D').bold(gamification.current_streak + ' days')}  (longest: ${gamification.longest_streak})`);
    console.log(`  ⭐ Level ${gamification.user_level} • ${gamification.user_xp} XP`);

    console.log('');
    console.log(renderCompanion());
}

async function weekStats() {
    console.log('');
    console.log(GRADIENTS.calm('  ─── Weekly Dashboard ───'));
    console.log('');

    const moods = getMoodHistory(7);
    const sessions = getWellnessSessions(7);
    const journals = getJournalEntries(7);
    const sleep = getSleepHistory(7);
    const gamification = getGamification();

    // Mood trend
    if (moods.length > 0) {
        const dailyAvg = {};
        moods.forEach(m => {
            const d = (m.timestamp.split('T')[0] || m.timestamp.split(' ')[0]);
            if (!dailyAvg[d]) dailyAvg[d] = [];
            dailyAvg[d].push(m.mood_score);
        });

        const values = Object.values(dailyAvg).map(arr => arr.reduce((s, v) => s + v, 0) / arr.length);
        const avg = values.reduce((s, v) => s + v, 0) / values.length;

        console.log(chalk.bold('  🎭 Mood Trend (7 days)'));
        console.log(`  ${sparkline(values.map(v => v * 10), { min: 0, max: 100 })}`);
        console.log(`  Average: ${scoreDisplay(Math.round(avg * 10))}`);

        // Most common moods
        const moodCounts = {};
        moods.forEach(m => moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1);
        const topMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
        console.log(`  Top moods: ${topMoods.map(([m, c]) => `${MOOD_COLORS[m]?.emoji || '•'} ${m} (${c}x)`).join('  ')}`);
    } else {
        console.log(chalk.dim('  🎭 No mood data this week'));
    }

    console.log('');

    // Activity summary
    console.log(chalk.bold('  📊 Activity Summary'));
    const breathCount = sessions.filter(s => s.type === 'breathing').length;
    const meditCount = sessions.filter(s => s.type === 'meditation').length;
    console.log(`  🫁 Breathing:       ${progressBar(breathCount, 14, 12)} ${breathCount} sessions`);
    console.log(`  🧘 Meditation:      ${progressBar(meditCount, 7, 12)} ${meditCount} sessions`);
    console.log(`  📝 Journal entries: ${progressBar(journals.length, 7, 12)} ${journals.length}`);
    console.log(`  🎭 Mood check-ins: ${progressBar(moods.length, 14, 12)} ${moods.length}`);

    // Sleep
    if (sleep.length > 0) {
        console.log('');
        console.log(chalk.bold('  💤 Sleep'));
        const avgSleep = sleep.reduce((s, sl) => s + (sl.duration_hours || 0), 0) / sleep.length;
        const avgQuality = sleep.reduce((s, sl) => s + (sl.quality || 5), 0) / sleep.length;
        console.log(`  Average: ${avgSleep.toFixed(1)}h  Quality: ${moodBar(avgQuality * 10, 10)} ${avgQuality.toFixed(1)}/10`);
        const sleepValues = sleep.map(s => (s.duration_hours || 0) * 10);
        console.log(`  Trend: ${sparkline(sleepValues.reverse(), { min: 0, max: 100 })}`);
    }

    console.log('');

    // Gamification
    console.log(chalk.bold('  🏆 Progress'));
    console.log(`  Level: ${chalk.hex('#FFD93D').bold(gamification.user_level)} • XP: ${gamification.user_xp}`);
    console.log(`  Streak: ${chalk.hex('#FF6B6B').bold(gamification.current_streak + ' days')} 🔥`);
    console.log(`  Total sessions: ${gamification.total_sessions}`);

    const achievements = JSON.parse(gamification.achievements || '[]');
    if (achievements.length > 0) {
        console.log(`  Achievements: ${achievements.length} unlocked`);
    }

    console.log('');
}

async function monthStats() {
    console.log('');
    console.log(GRADIENTS.calm('  ─── Monthly Overview ───'));
    console.log('');

    const moods = getMoodHistory(30);

    // Calendar heatmap of mood scores
    if (moods.length > 0) {
        console.log(chalk.bold('  📅 Mood Calendar'));
        const heatData = [];
        const now = new Date();
        for (let i = 27; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayMoods = moods.filter(m => (m.timestamp.split('T')[0] || m.timestamp.split(' ')[0]) === dateStr);
            const avg = dayMoods.length > 0
                ? (dayMoods.reduce((s, m) => s + m.mood_score, 0) / dayMoods.length) * 10
                : 0;
            heatData.push(avg);
        }
        console.log(calendarHeatmap(heatData));
    }

    // Monthly stats
    const stats = getOverallStats();
    const journals = getJournalEntries(30);
    const sessions = getWellnessSessions(30);

    console.log(chalk.bold('  📊 30-Day Summary'));
    console.log(`  Check-ins:  ${moods.length}`);
    console.log(`  Journals:   ${journals.length}`);
    console.log(`  Exercises:  ${sessions.length}`);

    if (moods.length > 0) {
        const weeklyAvgs = [];
        for (let w = 0; w < 4; w++) {
            const weekMoods = moods.filter(m => {
                const daysAgo = (Date.now() - new Date(m.timestamp).getTime()) / (1000 * 60 * 60 * 24);
                return daysAgo >= w * 7 && daysAgo < (w + 1) * 7;
            });
            if (weekMoods.length > 0) {
                weeklyAvgs.push(weekMoods.reduce((s, m) => s + m.mood_score, 0) / weekMoods.length);
            }
        }

        if (weeklyAvgs.length >= 2) {
            const trend = weeklyAvgs[0] - weeklyAvgs[weeklyAvgs.length - 1];
            const trendStr = trend > 0.5 ? chalk.hex('#4ECDC4')('↑ Improving') :
                trend < -0.5 ? chalk.hex('#FF6B6B')('↓ Declining') :
                    chalk.hex('#FFD93D')('→ Stable');
            console.log(`  Mood trend: ${trendStr}`);
        }
    }

    console.log('');
}

async function weeklyReport() {
    console.log('');
    console.log(GRADIENTS.calm('  ─── AI Weekly Report ───'));

    const spinner = ora({ text: chalk.dim('Generating your weekly wellness narrative...'), color: 'cyan' }).start();

    const moods = getMoodHistory(7);
    const sessions = getWellnessSessions(7);
    const journals = getJournalEntries(7);
    const sleep = getSleepHistory(7);
    const gamification = getGamification();

    const weekData = {
        moodEntries: moods.length,
        avgMood: moods.length > 0 ? (moods.reduce((s, m) => s + m.mood_score, 0) / moods.length).toFixed(1) : 'N/A',
        topMoods: getMostCommon(moods.map(m => m.mood)),
        breathingSessions: sessions.filter(s => s.type === 'breathing').length,
        meditationSessions: sessions.filter(s => s.type === 'meditation').length,
        journalEntries: journals.length,
        sleepData: sleep.map(s => ({ hours: s.duration_hours, quality: s.quality })),
        streak: gamification.current_streak,
        level: gamification.user_level,
    };

    try {
        const report = await generateWeeklyReport(weekData);
        spinner.succeed(chalk.dim('Report generated'));
        console.log('');
        console.log(createInfoBox('🤖 Your Weekly Wellness Narrative', chalk.hex('#45B7D1')(report)));
    } catch {
        spinner.info(chalk.dim('Could not generate AI report'));
        console.log('');
        console.log(chalk.dim('  Run `mindctl stats week` for data-based overview.'));
    }
}

function getMostCommon(arr) {
    const counts = {};
    arr.forEach(v => counts[v] = (counts[v] || 0) + 1);
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
}

export default { statsCommand };
