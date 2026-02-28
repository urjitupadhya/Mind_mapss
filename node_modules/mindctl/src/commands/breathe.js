// ═══════════════════════════════════════════════════
// 🫁 mindctl breathe — Guided Breathing Exercises
// Animated terminal breathing with multiple techniques
// ═══════════════════════════════════════════════════

import inquirer from 'inquirer';
import chalk from 'chalk';
import { GRADIENTS, createSuccessBox, createInfoBox, fancyDivider } from '../ui/theme.js';
import { BREATH_FRAMES, sleep } from '../ui/animations.js';
import { addWellnessSession, checkAchievements } from '../db.js';
import { renderCompanion, getCompanionReaction } from '../companion.js';
import { showHeader, BREATH_CIRCLES, renderAscii, COMPLETION } from '../ui/ascii.js';

const TECHNIQUES = {
    box: {
        name: '📦 Box Breathing (4-4-4-4)',
        desc: 'Military-grade calm. Equal inhale, hold, exhale, hold.',
        phases: ['BREATHE IN', 'HOLD', 'BREATHE OUT', 'HOLD'],
        durations: [4, 4, 4, 4],
        colors: ['#4ECDC4', '#FFD93D', '#6C63FF', '#FFD93D'],
        best: 'General anxiety, focus, stress',
    },
    '478': {
        name: '🌙 4-7-8 Technique',
        desc: 'Dr. Weil\'s natural tranquilizer for the nervous system.',
        phases: ['BREATHE IN', 'HOLD', 'BREATHE OUT'],
        durations: [4, 7, 8],
        colors: ['#4ECDC4', '#FFD93D', '#6C63FF'],
        best: 'Sleep, deep relaxation, panic relief',
    },
    calm: {
        name: '🌊 Calm Breathing (5-5)',
        desc: 'Simple, rhythmic breathing for everyday calm.',
        phases: ['BREATHE IN', 'BREATHE OUT'],
        durations: [5, 5],
        colors: ['#4ECDC4', '#6C63FF'],
        best: 'Daily calm, beginners, quick reset',
    },
    panic: {
        name: '🆘 Panic Relief (3-3-6)',
        desc: 'Short inhale, long exhale activates parasympathetic system.',
        phases: ['BREATHE IN', 'HOLD', 'BREATHE OUT'],
        durations: [3, 3, 6],
        colors: ['#4ECDC4', '#FFD93D', '#6C63FF'],
        best: 'Panic attacks, acute anxiety, crisis moments',
    },
    energize: {
        name: '⚡ Energizing Breath (2-2)',
        desc: 'Quick rhythmic breathing to boost energy.',
        phases: ['BREATHE IN', 'BREATHE OUT'],
        durations: [2, 2],
        colors: ['#FF6B6B', '#4ECDC4'],
        best: 'Low energy, morning wake-up, fatigue',
    },
    sleep: {
        name: '💤 Sleep Breathing (4-7-8)',
        desc: 'Extended exhale signals your body it\'s safe to sleep.',
        phases: ['BREATHE IN', 'HOLD', 'BREATHE OUT'],
        durations: [4, 7, 8],
        colors: ['#6C63FF', '#7B68EE', '#9B89B3'],
        best: 'Insomnia, pre-sleep routine, deep relaxation',
    },
};

export async function breatheCommand(options = {}) {
    let technique = options.type;
    let rounds = options.rounds || 4;

    showHeader('breathe', '#45B7D1');
    console.log('');

    if (!technique || !TECHNIQUES[technique]) {
        const { selected } = await inquirer.prompt([{
            type: 'list',
            name: 'selected',
            message: chalk.hex('#4ECDC4')('Choose a breathing technique:'),
            choices: Object.entries(TECHNIQUES).map(([key, t]) => ({
                name: `${t.name}\n     ${chalk.dim(t.desc)}\n     ${chalk.dim.italic(`Best for: ${t.best}`)}`,
                value: key,
            })),
            pageSize: 20,
        }]);
        technique = selected;
    }

    const { roundCount } = await inquirer.prompt([{
        type: 'list',
        name: 'roundCount',
        message: chalk.hex('#45B7D1')('How many rounds?'),
        choices: [
            { name: '2 rounds (~1 min)', value: 2 },
            { name: '4 rounds (~2 min)', value: 4 },
            { name: '6 rounds (~3 min)', value: 6 },
            { name: '8 rounds (~5 min)', value: 8 },
        ],
        default: 1,
    }]);
    rounds = roundCount;

    const config = TECHNIQUES[technique];

    console.log('');
    console.log(chalk.hex('#4ECDC4')(`  Starting ${config.name}...`));
    console.log(chalk.dim('  Get comfortable. Focus on the animation.'));
    console.log(chalk.dim('  Press Ctrl+C to stop anytime.'));
    console.log('');

    await sleep(2000);

    // Prepare animation space
    const totalLines = 12;
    for (let i = 0; i < totalLines; i++) process.stdout.write('\n');

    const startTime = Date.now();
    process.stdout.write('\x1B[?25l'); // Hide cursor

    try {
        for (let round = 0; round < rounds; round++) {
            for (let phase = 0; phase < config.phases.length; phase++) {
                const phaseName = config.phases[phase];
                const duration = config.durations[phase];
                const color = config.colors[phase] || '#4ECDC4';

                // Animate the phase
                for (let tick = 0; tick < duration * 10; tick++) {
                    const progress = tick / (duration * 10);
                    const timeLeft = (duration - tick / 10).toFixed(1);

                    // Build visual
                    let size;
                    if (phaseName === 'BREATHE IN') size = Math.floor(progress * 5);
                    else if (phaseName === 'BREATHE OUT') size = Math.floor((1 - progress) * 5);
                    else size = 5;

                    const circles = [
                        '          ●          ',
                        '        ╭───╮        ',
                        '      ╭───────╮      ',
                        '    ╭───────────╮    ',
                        '  ╭───────────────╮  ',
                        '╭───────────────────╮',
                    ];

                    const circle = circles[Math.max(0, Math.min(size, 5))];
                    const pBar = '█'.repeat(Math.floor(progress * 20)) + '░'.repeat(20 - Math.floor(progress * 20));

                    const lines = [
                        '',
                        chalk.hex(color).bold(`         ${phaseName}`),
                        '',
                        chalk.hex(color)(circle),
                        '',
                        chalk.hex(color)(`     [${pBar}]`),
                        chalk.dim(`           ${timeLeft}s`),
                        '',
                        chalk.dim(`   Round ${round + 1}/${rounds} • ${config.name.replace(/^[^\s]+\s/, '')}`),
                        '',
                        '',
                        '',
                    ];

                    process.stdout.write(`\x1B[${totalLines}A`);
                    lines.forEach(line => process.stdout.write(`\x1B[2K${line}\n`));

                    await sleep(100);
                }
            }
        }
    } catch (e) {
        // Handle Ctrl+C gracefully
    } finally {
        process.stdout.write('\x1B[?25h'); // Show cursor
    }

    const durationSec = Math.round((Date.now() - startTime) / 1000);

    // Save session
    addWellnessSession('breathing', technique, durationSec, null, null, `${rounds} rounds of ${technique}`);

    // Results
    console.log('');
    console.log(createSuccessBox([
        chalk.hex('#4ECDC4').bold('  ✓ Breathing session complete!'),
        '',
        chalk.dim(`  Technique: ${config.name}`),
        chalk.dim(`  Duration:  ${Math.floor(durationSec / 60)}m ${durationSec % 60}s`),
        chalk.dim(`  Rounds:    ${rounds}`),
    ].join('\n')));

    // Companion
    console.log(renderCompanion({ mood: 'happy', message: getCompanionReaction('breathing').message }));

    // Achievements
    const newAchievements = checkAchievements();
    if (newAchievements.length > 0) {
        console.log(chalk.hex('#FFD700').bold('  🏆 NEW ACHIEVEMENT!'));
        newAchievements.forEach(a => console.log(chalk.hex('#FFD700')(`  ${a.label}`)));
    }
}

export default { breatheCommand };
