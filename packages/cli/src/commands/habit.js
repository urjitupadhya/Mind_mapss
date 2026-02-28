// ═══════════════════════════════════════════════════
// 🏆 mindctl habit — Habit Tracker with Streaks
// Build healthy habits with gamification
// ═══════════════════════════════════════════════════

import inquirer from 'inquirer';
import chalk from 'chalk';
import { GRADIENTS, createSuccessBox, progressBar } from '../ui/theme.js';
import { addHabit, getHabits, completeHabit, getHabitStreak, getHabitCompletions, updateGamification } from '../db.js';
import { suggestHabit } from '../ai.js';
import { showHeader } from '../ui/ascii.js';

export async function habitCommand(subcommand, options = {}) {
    switch (subcommand) {
        case 'add':
            return addHabitCommand();
        case 'check':
        case 'done':
            return checkHabits();
        case 'list':
        case 'status':
            return listHabits();
        case 'suggest':
            return suggestHabitCommand();
        default:
            return listHabits();
    }
}

async function addHabitCommand() {
    showHeader('habit', '#6BCB77');
    console.log('');

    const { name } = await inquirer.prompt([{
        type: 'input',
        name: 'name',
        message: chalk.hex('#4ECDC4')('Habit name:'),
        validate: v => v.length > 1 || 'Enter a habit name',
    }]);

    const { description } = await inquirer.prompt([{
        type: 'input',
        name: 'description',
        message: chalk.dim('Description (optional):'),
        default: '',
    }]);

    const { icon } = await inquirer.prompt([{
        type: 'list',
        name: 'icon',
        message: chalk.hex('#45B7D1')('Choose an icon:'),
        choices: [
            { name: '💧 Water', value: '💧' },
            { name: '🏃 Exercise', value: '🏃' },
            { name: '📝 Journal', value: '📝' },
            { name: '🧘 Meditate', value: '🧘' },
            { name: '🫁 Breathe', value: '🫁' },
            { name: '📖 Read', value: '📖' },
            { name: '🌱 Growth', value: '🌱' },
            { name: '😴 Sleep', value: '😴' },
            { name: '🙏 Gratitude', value: '🙏' },
            { name: '🚶 Walk', value: '🚶' },
            { name: '💪 Stretch', value: '💪' },
            { name: '🎵 Music', value: '🎵' },
            { name: '👁 Eye break', value: '👁' },
            { name: '✓ Other', value: '✓' },
        ],
    }]);

    const { frequency } = await inquirer.prompt([{
        type: 'list',
        name: 'frequency',
        message: chalk.dim('Frequency:'),
        choices: [
            { name: 'Daily', value: 'daily' },
            { name: 'Weekdays', value: 'weekdays' },
            { name: 'Weekly', value: 'weekly' },
        ],
    }]);

    addHabit(name, description, frequency, icon, '#4ECDC4');

    console.log('');
    console.log(createSuccessBox([
        chalk.hex('#4ECDC4').bold(`  ✓ Habit "${name}" created!`),
        chalk.dim(`  ${icon} ${frequency} • Track with \`mindctl habit check\``),
    ].join('\n')));
}

async function checkHabits() {
    const habits = getHabits();

    if (habits.length === 0) {
        console.log('');
        console.log(chalk.dim('  No habits yet. Create one with `mindctl habit add`'));
        return;
    }

    console.log('');
    console.log(GRADIENTS.success('  ─── Check Off Habits ───'));
    console.log('');

    const today = new Date().toISOString().split('T')[0];

    const { completed } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'completed',
        message: chalk.hex('#4ECDC4')('Which habits did you complete today?'),
        choices: habits.map(h => {
            const streak = getHabitStreak(h.id);
            return {
                name: `${h.icon} ${h.name} ${streak > 0 ? chalk.hex('#FFD93D')(`🔥${streak}`) : ''}`,
                value: h.id,
            };
        }),
    }]);

    completed.forEach(id => {
        completeHabit(id, today);
        updateGamification('habit');
    });

    console.log('');
    if (completed.length > 0) {
        console.log(chalk.hex('#4ECDC4').bold(`  ✓ ${completed.length} habit${completed.length > 1 ? 's' : ''} checked off!`));
        console.log(chalk.dim(`  +${completed.length * 10} XP`));
    } else {
        console.log(chalk.dim('  No habits checked. That\'s okay — tomorrow is a new day.'));
    }
    console.log('');
}

async function listHabits() {
    const habits = getHabits();

    console.log('');
    console.log(GRADIENTS.success('  ─── Your Habits ───'));
    console.log('');

    if (habits.length === 0) {
        console.log(chalk.dim('  No habits yet. Start with `mindctl habit add`'));
        console.log(chalk.dim('  Or try `mindctl habit suggest` for AI recommendations.'));
        return;
    }

    habits.forEach(h => {
        const streak = getHabitStreak(h.id);
        const completions = getHabitCompletions(h.id, 7);
        const weekDone = completions.length;
        const weekTarget = h.frequency === 'daily' ? 7 : h.frequency === 'weekdays' ? 5 : 1;

        console.log(`  ${h.icon} ${chalk.bold(h.name)}`);
        if (h.description) console.log(chalk.dim(`     ${h.description}`));
        console.log(`     ${progressBar(weekDone, weekTarget, 15)} ${weekDone}/${weekTarget} this week`);
        console.log(`     Streak: ${streak > 0 ? chalk.hex('#FFD93D')(`🔥 ${streak} days`) : chalk.dim('Not started')}`);
        console.log('');
    });
}

async function suggestHabitCommand() {
    console.log('');
    console.log(GRADIENTS.calm('  ─── AI Habit Suggestion ───'));

    const ora = (await import('ora')).default;
    const spinner = ora({ text: chalk.dim('AI thinking of a habit for you...'), color: 'cyan' }).start();

    try {
        const suggestion = await suggestHabit({});
        spinner.succeed(chalk.dim('Suggestion ready'));
        console.log('');
        console.log(chalk.hex('#4ECDC4')(`  💡 ${suggestion}`));
    } catch {
        spinner.info(chalk.dim('Using default suggestion'));
        console.log('');
        console.log(chalk.hex('#4ECDC4')('  💡 Try adding a "drink water" habit — aim for 8 glasses daily.'));
        console.log(chalk.hex('#4ECDC4')('     Start by having one glass right when you wake up.'));
    }

    console.log('');
    console.log(chalk.dim('  Create it with `mindctl habit add`'));
    console.log('');
}

export default { habitCommand };
