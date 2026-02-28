// ═══════════════════════════════════════════════════
// 🧘 mindctl meditate — Meditation & Grounding
// Timer, mandala animation, AI guided meditation
// ═══════════════════════════════════════════════════

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GRADIENTS, createSuccessBox } from '../ui/theme.js';
import { runMeditationMandala, groundingAnimation, sleep } from '../ui/animations.js';
import { addWellnessSession, checkAchievements } from '../db.js';
import { generateMeditation } from '../ai.js';
import { renderCompanion, getCompanionReaction } from '../companion.js';
import { showHeader, renderAscii, WELLNESS_ART } from '../ui/ascii.js';

export async function meditateCommand(subcommand, options = {}) {
    switch (subcommand) {
        case 'guided':
            return guidedMeditation();
        case 'ground':
        case 'grounding':
            return groundingExercise();
        default:
            return meditationTimer(options);
    }
}

async function meditationTimer(options) {
    showHeader('meditate', '#9B89B3');
    console.log('');

    const { duration } = await inquirer.prompt([{
        type: 'list',
        name: 'duration',
        message: chalk.hex('#4ECDC4')('How long would you like to meditate?'),
        choices: [
            { name: '1 minute — Quick reset', value: 60 },
            { name: '3 minutes — Short session', value: 180 },
            { name: '5 minutes — Standard', value: 300 },
            { name: '10 minutes — Deep session', value: 600 },
            { name: '15 minutes — Extended', value: 900 },
            { name: '20 minutes — Full practice', value: 1200 },
        ],
        default: 2,
    }]);

    console.log('');
    console.log(chalk.dim('  Find a comfortable position. Close your eyes when ready.'));
    console.log(chalk.dim('  The mandala will pulse gently. Focus on it or close your eyes.'));
    console.log(chalk.dim('  Press Ctrl+C to end early.'));
    console.log('');

    await sleep(3000);

    const startTime = Date.now();

    try {
        await runMeditationMandala(duration);
    } catch {
        // Ctrl+C - graceful exit
    }

    const actualDuration = Math.round((Date.now() - startTime) / 1000);
    addWellnessSession('meditation', 'timer', actualDuration, null, null, `${Math.round(actualDuration / 60)} min session`);

    console.log('');
    console.log(createSuccessBox([
        chalk.hex('#4ECDC4').bold('  ✓ Meditation complete'),
        '',
        chalk.dim(`  Duration: ${Math.floor(actualDuration / 60)}m ${actualDuration % 60}s`),
        chalk.dim('  "Silence is a source of great strength." — Lao Tzu'),
    ].join('\n')));

    console.log(renderCompanion({ mood: 'happy', message: getCompanionReaction('meditation').message }));

    const achievements = checkAchievements();
    if (achievements.length > 0) {
        achievements.forEach(a => console.log(chalk.hex('#FFD700')(`  ${a.label}`)));
    }
}

async function guidedMeditation() {
    console.log('');
    console.log(GRADIENTS.zen('  ─── AI Guided Meditation ───'));
    console.log('');

    const { mood } = await inquirer.prompt([{
        type: 'list',
        name: 'mood',
        message: chalk.hex('#4ECDC4')('How are you feeling right now?'),
        choices: [
            { name: '😰 Anxious — I need calm', value: 'anxious' },
            { name: '😤 Stressed — I need release', value: 'stressed' },
            { name: '😢 Sad — I need comfort', value: 'sad' },
            { name: '😴 Tired — I need restoration', value: 'tired' },
            { name: '😐 Neutral — Just want to meditate', value: 'neutral' },
            { name: '😊 Good — Deepen my presence', value: 'good' },
        ],
    }]);

    const spinner = ora({ text: chalk.dim('AI creating your personalized meditation...'), color: 'magenta' }).start();

    try {
        const script = await generateMeditation(mood, 3);
        spinner.succeed(chalk.dim('Meditation ready'));

        console.log('');
        console.log(chalk.hex('#9B89B3').bold('  🧘 Your Guided Meditation'));
        console.log('');

        // Display script paragraph by paragraph
        const paragraphs = script.split('\n').filter(p => p.trim());
        for (const para of paragraphs) {
            console.log(chalk.hex('#C4B7CB')(`  ${para.trim()}`));
            console.log('');
            await sleep(2000);
        }

        console.log(chalk.dim('  [Take a moment when you\'re ready]'));

        const { done } = await inquirer.prompt([{
            type: 'confirm',
            name: 'done',
            message: chalk.dim('Ready to return?'),
            default: true,
        }]);

        addWellnessSession('meditation', 'guided', 180, null, null, `Guided meditation for ${mood}`);

        console.log('');
        console.log(chalk.hex('#4ECDC4')('  ✓ Welcome back. How do you feel?'));
    } catch {
        spinner.info(chalk.dim('Using default meditation'));
        console.log('');
        console.log(chalk.hex('#C4B7CB')('  Close your eyes. Take three deep breaths.'));
        console.log(chalk.hex('#C4B7CB')('  Notice the weight of your body in your chair.'));
        console.log(chalk.hex('#C4B7CB')('  Feel your feet on the ground. You are here. You are safe.'));
        console.log(chalk.hex('#C4B7CB')('  With each breath, let tension leave your body.'));
        console.log(chalk.hex('#C4B7CB')('  There is nothing to fix right now. Just be.'));
    }
    console.log('');
}

async function groundingExercise() {
    console.log('');
    console.log(GRADIENTS.calm('  ─── 5-4-3-2-1 Grounding Exercise ───'));
    console.log(chalk.dim('  This technique brings you back to the present moment.'));
    console.log('');

    const senses = await groundingAnimation();

    for (const sense of senses) {
        console.log(chalk.hex('#4ECDC4').bold(`  ${sense.emoji} ${sense.count} things you can ${sense.sense}`));
        console.log(chalk.dim(`  ${sense.prompt}`));
        console.log('');

        for (let i = 1; i <= sense.count; i++) {
            const { item } = await inquirer.prompt([{
                type: 'input',
                name: 'item',
                message: chalk.hex('#45B7D1')(`  ${i}.`),
            }]);
        }
        console.log('');
    }

    addWellnessSession('grounding', '54321', 300, null, null, '5-4-3-2-1 grounding exercise');

    console.log(createSuccessBox([
        chalk.hex('#4ECDC4').bold('  ✓ Grounding complete'),
        '',
        chalk.dim('  You are here. You are safe. You are present.'),
        chalk.dim('  Notice how your body feels right now.'),
    ].join('\n')));
}

export default { meditateCommand };
