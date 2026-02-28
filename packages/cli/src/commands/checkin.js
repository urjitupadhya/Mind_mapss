// ═══════════════════════════════════════════════════
// 🎭 mindctl check-in — Smart Mood Check-In
// AI-powered daily mood tracking with insights
// ═══════════════════════════════════════════════════

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GRADIENTS, MOOD_COLORS, createSuccessBox, scoreDisplay, moodBar, fancyDivider } from '../ui/theme.js';
import { addMoodEntry, getMoodHistory, getMoodToday, checkAchievements } from '../db.js';
import { analyzeMood, checkForCrisisSignals, getCrisisResources } from '../ai.js';
import { renderCompanion, getCompanionReaction } from '../companion.js';
import { showHeader, showMoodFace, renderAscii, COMPLETION, BADGES } from '../ui/ascii.js';

export async function checkinCommand() {
    showHeader('checkin', '#E040FB');
    console.log('');

    // Mood selection
    const moodChoices = Object.entries(MOOD_COLORS).map(([key, val]) => ({
        name: `${val.emoji}  ${val.label}`,
        value: key,
    }));

    const { mood } = await inquirer.prompt([
        {
            type: 'list',
            name: 'mood',
            message: chalk.hex('#4ECDC4')('How are you feeling right now?'),
            choices: moodChoices,
            pageSize: 15,
        },
    ]);

    // Mood score
    const moodScoreMap = {
        amazing: 10, happy: 8, good: 7, okay: 6, meh: 5,
        low: 4, sad: 3, anxious: 4, stressed: 3, angry: 2,
        peaceful: 8, grateful: 9, tired: 4, overwhelmed: 2, hopeful: 7,
    };
    const moodScore = moodScoreMap[mood] || 5;

    // Energy level
    const { energy } = await inquirer.prompt([
        {
            type: 'list',
            name: 'energy',
            message: chalk.hex('#45B7D1')('Energy level?'),
            choices: [
                { name: '⚡⚡⚡⚡⚡  Very High', value: 10 },
                { name: '⚡⚡⚡⚡    High', value: 8 },
                { name: '⚡⚡⚡      Medium', value: 6 },
                { name: '⚡⚡        Low', value: 4 },
                { name: '⚡          Very Low', value: 2 },
            ],
        },
    ]);

    // Optional note
    const { note } = await inquirer.prompt([
        {
            type: 'input',
            name: 'note',
            message: chalk.dim("What's on your mind? (Enter to skip)"),
            default: '',
        },
    ]);

    // Crisis check
    if (note && checkForCrisisSignals(note)) {
        console.log('');
        console.log(chalk.hex('#FF6B6B').bold(getCrisisResources()));
        console.log('');
    }

    // AI Analysis
    const spinner = ora({
        text: chalk.dim('AI analyzing your check-in...'),
        color: 'cyan',
    }).start();

    let aiInsight = '';
    try {
        aiInsight = await analyzeMood(mood, moodScore, energy, note);
        spinner.succeed(chalk.dim('Analysis complete'));
    } catch {
        spinner.info(chalk.dim('Check-in saved'));
    }

    // Save to database
    addMoodEntry(mood, moodScore, energy, note, [], aiInsight);

    // Display mood face ASCII art
    const mc = MOOD_COLORS[mood];
    console.log('');
    showMoodFace(mood, mc.color);
    console.log('');

    // Display results
    console.log(createSuccessBox([
        chalk.hex(mc.color).bold(`  ${mc.emoji} Feeling: ${mc.label}`),
        `  ${moodBar(moodScore * 10)} ${chalk.dim(`${moodScore}/10`)}`,
        `  ⚡ Energy: ${moodBar(energy * 10)} ${chalk.dim(`${energy}/10`)}`,
        note ? chalk.dim(`  📝 "${note}"`) : '',
        '',
        aiInsight ? chalk.hex('#45B7D1')(`  🤖 ${aiInsight}`) : '',
    ].filter(Boolean).join('\n')));

    // Today's mood history
    const todayMoods = getMoodToday();
    if (todayMoods.length > 1) {
        console.log('');
        console.log(chalk.dim(`  Today's moods: ${todayMoods.map(m => MOOD_COLORS[m.mood]?.emoji || '•').join(' → ')}`));
    }

    // Companion reaction
    console.log(renderCompanion({ mood: 'excited', message: getCompanionReaction('checkin').message }));

    // Check achievements
    const newAchievements = checkAchievements();
    if (newAchievements.length > 0) {
        console.log('');
        console.log(renderAscii(COMPLETION.trophy, '#FFD700'));
        console.log(chalk.hex('#FFD700').bold('  🏆 NEW ACHIEVEMENT UNLOCKED!'));
        newAchievements.forEach(a => {
            console.log(chalk.hex('#FFD700')(`  ${a.label}`));
            if (BADGES[a.id]) console.log(renderAscii(BADGES[a.id], '#FFD700'));
        });
        console.log('');
    }

    console.log(chalk.dim('  ✓ Check-in saved'));
    console.log('');
}

export async function moodHistoryCommand(options = {}) {
    const days = options.days || 7;
    const history = getMoodHistory(days);

    console.log('');
    console.log(GRADIENTS.calm(`  ─── Mood History (${days} days) ───`));
    console.log('');

    if (history.length === 0) {
        console.log(chalk.dim('  No mood entries yet. Run `mindctl check-in` to start!'));
        return;
    }

    // Group by date
    const byDate = {};
    history.forEach(entry => {
        const date = entry.timestamp.split('T')[0] || entry.timestamp.split(' ')[0];
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(entry);
    });

    Object.entries(byDate).slice(0, days).forEach(([date, entries]) => {
        const avgScore = entries.reduce((s, e) => s + e.mood_score, 0) / entries.length;
        const moods = entries.map(e => MOOD_COLORS[e.mood]?.emoji || '•').join(' ');

        console.log(
            `  ${chalk.dim(date)}  ${moodBar(avgScore * 10, 15)} ${chalk.bold(avgScore.toFixed(1))}  ${moods}`
        );
    });

    // Weekly average
    const avg = history.reduce((s, e) => s + e.mood_score, 0) / history.length;
    console.log('');
    console.log(`  ${scoreDisplay(Math.round(avg * 10), `Average (${days}d)`)}`);
    console.log('');
}

export default { checkinCommand, moodHistoryCommand };
