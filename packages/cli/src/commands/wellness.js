// ═══════════════════════════════════════════════════
// 💧 mindctl wellness — Physical Wellness Commands
// Water, posture, eyes, stretch reminders
// ═══════════════════════════════════════════════════

import inquirer from 'inquirer';
import chalk from 'chalk';
import { GRADIENTS, createSuccessBox, progressBar } from '../ui/theme.js';
import { addWater, getWaterToday, addWellnessSession } from '../db.js';
import { STRETCH_FRAMES, sleep } from '../ui/animations.js';
import { showHeader, renderAscii, WELLNESS_ART, DIVIDERS } from '../ui/ascii.js';

export async function waterCommand() {
    const { glasses } = await inquirer.prompt([{
        type: 'list',
        name: 'glasses',
        message: chalk.hex('#45B7D1')('💧 How much water?'),
        choices: [
            { name: '💧 1 glass', value: 1 },
            { name: '💧💧 2 glasses', value: 2 },
            { name: '💧💧💧 3 glasses', value: 3 },
        ],
    }]);

    addWater(glasses);
    const total = getWaterToday();

    console.log('');
    showHeader('water', '#45B7D1');
    console.log(renderAscii(WELLNESS_ART.water_glass, '#45B7D1'));
    console.log('');
    console.log(createSuccessBox([
        chalk.hex('#45B7D1').bold(`  ✓ +${glasses} glass${glasses > 1 ? 'es' : ''} logged`),
        '',
        `  Today: ${progressBar(total, 8, 20, '#45B7D1')} ${total}/8 🎯`,
        total >= 8 ? chalk.hex('#4ECDC4')('  🎉 Daily target reached!') : chalk.dim(`  ${8 - total} more to go`),
    ].join('\n')));
    console.log('');
}

export async function eyesCommand() {
    console.log('');
    console.log(renderAscii(WELLNESS_ART.eye, '#45B7D1'));
    console.log('');
    console.log(chalk.hex('#45B7D1').bold('  👁  20-20-20 Rule'));
    console.log(chalk.dim('  Every 20 minutes, look at something 20 feet away for 20 seconds.'));
    console.log('');
    console.log(chalk.hex('#4ECDC4')('  Starting 20-second timer...'));
    console.log('');

    process.stdout.write('\x1B[?25l');

    for (let i = 20; i >= 0; i--) {
        const bar = progressBar(20 - i, 20, 20, '#45B7D1');
        process.stdout.write(`\r  ${bar} ${chalk.bold(i + 's')} — Look at something far away 👁 `);
        await sleep(1000);
    }

    process.stdout.write('\x1B[?25h');
    console.log('');
    console.log('');
    console.log(chalk.hex('#4ECDC4').bold('  ✓ Eye break complete! Your eyes thank you. +5 XP'));

    addWellnessSession('eyes', '20-20-20', 20, null, null, '20-20-20 eye break');
    console.log('');
}

export async function stretchCommand() {
    console.log('');
    console.log(GRADIENTS.calm('  ─── Desk Stretches ───'));
    console.log(chalk.dim('  5 stretches to release tension'));
    console.log('');

    for (const stretch of STRETCH_FRAMES) {
        console.log(chalk.hex('#4ECDC4').bold(`  💪 ${stretch.name} (${stretch.duration}s)`));
        console.log('');
        stretch.art.forEach(line => console.log(chalk.hex('#45B7D1')(`     ${line}`)));
        console.log('');

        // Timer
        for (let i = stretch.duration; i >= 0; i--) {
            const bar = progressBar(stretch.duration - i, stretch.duration, 15, '#4ECDC4');
            process.stdout.write(`\r  ${bar} ${i}s remaining `);
            await sleep(1000);
        }

        console.log('');
        console.log(chalk.dim('  ✓ Done'));
        console.log('');
        await sleep(1000);
    }

    console.log(createSuccessBox([
        chalk.hex('#4ECDC4').bold('  ✓ All stretches complete!'),
        chalk.dim('  Your body thanks you. +15 XP'),
    ].join('\n')));

    addWellnessSession('stretch', 'desk', 75, null, null, 'Desk stretch routine');
    console.log('');
}

export async function postureCommand() {
    console.log('');
    console.log(renderAscii(WELLNESS_ART.posture, '#4ECDC4'));
    console.log('');
    console.log(chalk.hex('#4ECDC4').bold('  🧍 Posture Check'));
    console.log('');
    console.log(chalk.hex('#45B7D1')('  Quick body scan:'));
    console.log('');

    const checks = [
        '  👤 Head — aligned over shoulders, not forward',
        '  💆 Shoulders — relaxed, not hunched up',
        '  🪑 Back — supported by chair, slight curve',
        '  🦵 Hips — even, feet flat on floor',
        '  💻 Screen — at eye level, arm\'s length away',
        '  ⌨️  Wrists — straight, not bent up or down',
    ];

    for (const check of checks) {
        console.log(chalk.hex('#4ECDC4')(check));
        await sleep(1500);
    }

    console.log('');
    console.log(chalk.dim('  Adjust anything that feels off. Small corrections add up! +5 XP'));
    addWellnessSession('posture', 'check', 15, null, null, 'Posture check');
    console.log('');
}

export async function walkCommand() {
    console.log('');
    console.log(GRADIENTS.success('  ─── Walk Timer ───'));
    console.log(chalk.dim('  Time for a walk! Movement is medicine.'));
    console.log('');

    const { duration } = await inquirer.prompt([{
        type: 'list',
        name: 'duration',
        message: chalk.hex('#4ECDC4')('How long?'),
        choices: [
            { name: '5 minutes — Quick break', value: 5 },
            { name: '10 minutes — Proper break', value: 10 },
            { name: '15 minutes — Good walk', value: 15 },
            { name: '20 minutes — Extended walk', value: 20 },
            { name: '30 minutes — Full walk', value: 30 },
        ],
    }]);

    console.log('');
    console.log(chalk.hex('#4ECDC4')(`  🚶 Go walk! Timer set for ${duration} minutes.`));
    console.log(chalk.dim('  Press Enter when you\'re back.'));

    const startTime = Date.now();

    // Countdown
    for (let min = duration; min >= 0; min--) {
        const bar = progressBar(duration - min, duration, 20, '#6BCB77');
        process.stdout.write(`\r  ${bar} ${min} min remaining 🚶`);
        await sleep(Math.min(60000, 5000)); // Speed up for demo
    }

    console.log('');
    console.log('');

    const actualDuration = Math.round((Date.now() - startTime) / 1000);
    addWellnessSession('walk', 'walk', actualDuration, null, null, `${duration} min walk`);

    console.log(chalk.hex('#4ECDC4').bold(`  ✓ Walk complete! ${duration} minutes of movement. +20 XP 🌳`));
    console.log('');
}

export default { waterCommand, eyesCommand, stretchCommand, postureCommand, walkCommand };
