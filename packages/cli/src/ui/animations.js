// ═══════════════════════════════════════════════════
// 🎬 mindctl — Terminal Animations Engine
// Breathing circles, mandalas, progress spinners
// ═══════════════════════════════════════════════════

import chalk from 'chalk';

// ─── Breathing Animation Frames ───────────────────
const BREATH_FRAMES = {
    box: {
        phases: ['BREATHE IN', 'HOLD', 'BREATHE OUT', 'HOLD'],
        durations: [4, 4, 4, 4],
        total: 'Box Breathing • 4-4-4-4',
    },
    '478': {
        phases: ['BREATHE IN', 'HOLD', 'BREATHE OUT'],
        durations: [4, 7, 8],
        total: '4-7-8 Technique',
    },
    calm: {
        phases: ['BREATHE IN', 'BREATHE OUT'],
        durations: [5, 5],
        total: 'Calm Breathing • 5-5',
    },
    panic: {
        phases: ['BREATHE IN', 'HOLD', 'BREATHE OUT'],
        durations: [3, 3, 6],
        total: 'Grounding Breath • 3-3-6',
    },
    sleep: {
        phases: ['BREATHE IN', 'HOLD', 'BREATHE OUT'],
        durations: [4, 7, 8],
        total: 'Sleep Breathing • 4-7-8',
    },
    energize: {
        phases: ['BREATHE IN', 'BREATHE OUT'],
        durations: [2, 2],
        total: 'Energizing Breath • 2-2',
    },
};

// Circle sizes for breathing animation
const CIRCLES = [
    ['    ●    '],
    ['   ╭─╮   ', '   │ │   ', '   ╰─╯   '],
    ['  ╭───╮  ', '  │   │  ', '  │   │  ', '  ╰───╯  '],
    [' ╭─────╮ ', ' │     │ ', ' │     │ ', ' │     │ ', ' ╰─────╯ '],
    ['╭───────╮', '│       │', '│       │', '│       │', '│       │', '╰───────╯'],
    ['╭─────────╮', '│         │', '│         │', '│         │', '│         │', '│         │', '╰─────────╯'],
];

// ─── Breathing Exercise Runner ────────────────────
export async function runBreathingAnimation(type = 'box', rounds = 4, onComplete) {
    const config = BREATH_FRAMES[type] || BREATH_FRAMES.box;
    const colors = {
        'BREATHE IN': '#4ECDC4',
        'HOLD': '#FFD93D',
        'BREATHE OUT': '#6C63FF',
    };

    process.stdout.write('\x1B[?25l'); // Hide cursor

    for (let round = 0; round < rounds; round++) {
        for (let phase = 0; phase < config.phases.length; phase++) {
            const phaseName = config.phases[phase];
            const duration = config.durations[phase];
            const color = colors[phaseName] || '#45B7D1';

            for (let sec = 0; sec < duration * 10; sec++) {
                const progress = sec / (duration * 10);
                let circleIdx;

                if (phaseName === 'BREATHE IN') {
                    circleIdx = Math.floor(progress * (CIRCLES.length - 1));
                } else if (phaseName === 'BREATHE OUT') {
                    circleIdx = Math.floor((1 - progress) * (CIRCLES.length - 1));
                } else {
                    circleIdx = CIRCLES.length - 1;
                }

                const circle = CIRCLES[Math.max(0, Math.min(circleIdx, CIRCLES.length - 1))];
                const timeLeft = (duration - sec / 10).toFixed(1);

                // Build frame
                const lines = [
                    '',
                    chalk.hex(color).bold(`       ${phaseName}`),
                    '',
                    ...circle.map(l => chalk.hex(color)(l)),
                    '',
                    chalk.dim(`       ${timeLeft}s`),
                    '',
                    chalk.dim(`  Round ${round + 1}/${rounds} • ${config.total}`),
                    '',
                ];

                // Clear and redraw
                process.stdout.write(`\x1B[${lines.length + 1}A`);
                lines.forEach(line => {
                    process.stdout.write(`\x1B[2K${line}\n`);
                });

                await sleep(100);
            }
        }
    }

    process.stdout.write('\x1B[?25h'); // Show cursor

    if (onComplete) onComplete();
}

// ─── Meditation Mandala ───────────────────────────
const MANDALA_FRAMES = [
    [
        '        ✦        ',
        '    ✦   ●   ✦    ',
        '  ✦   ● ◆ ●   ✦  ',
        '    ✦   ●   ✦    ',
        '        ✦        ',
    ],
    [
        '      ✦   ✦      ',
        '   ✦  ● ◆ ●  ✦   ',
        '  ✦ ● ◆ ★ ◆ ● ✦  ',
        '   ✦  ● ◆ ●  ✦   ',
        '      ✦   ✦      ',
    ],
    [
        '    ✦    ●    ✦    ',
        '  ✦  ● ◆ ★ ◆ ●  ✦  ',
        ' ✦ ● ◆ ★ ✦ ★ ◆ ● ✦ ',
        '  ✦  ● ◆ ★ ◆ ●  ✦  ',
        '    ✦    ●    ✦    ',
    ],
    [
        '   ✦   ●   ◆   ●   ✦   ',
        ' ✦  ● ◆ ★ ✦ ★ ◆ ●  ✦ ',
        '✦ ● ◆ ★ ✦ ☀ ✦ ★ ◆ ● ✦',
        ' ✦  ● ◆ ★ ✦ ★ ◆ ●  ✦ ',
        '   ✦   ●   ◆   ●   ✦   ',
    ],
];

export async function runMeditationMandala(durationSec = 60) {
    const colors = ['#6C63FF', '#E040FB', '#FF4081', '#4ECDC4', '#FFD93D', '#45B7D1'];
    let frameIdx = 0;
    let elapsed = 0;
    const interval = 2000; // Change frame every 2s

    process.stdout.write('\x1B[?25l');
    // Print initial blank lines
    for (let i = 0; i < 12; i++) process.stdout.write('\n');

    while (elapsed < durationSec * 1000) {
        const frame = MANDALA_FRAMES[frameIdx % MANDALA_FRAMES.length];
        const color = colors[frameIdx % colors.length];
        const remaining = Math.ceil((durationSec * 1000 - elapsed) / 1000);
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;

        const lines = [
            '',
            chalk.hex(color).bold('    🧘 Meditation'),
            '',
            ...frame.map(l => chalk.hex(color)(l)),
            '',
            chalk.dim(`    ${minutes}:${seconds.toString().padStart(2, '0')} remaining`),
            '',
            chalk.dim('    Press Ctrl+C to end'),
            '',
        ];

        process.stdout.write(`\x1B[${lines.length + 1}A`);
        lines.forEach(line => {
            process.stdout.write(`\x1B[2K${line}\n`);
        });

        await sleep(interval);
        frameIdx++;
        elapsed += interval;
    }

    process.stdout.write('\x1B[?25h');
}

// ─── Loading Spinner Styles ───────────────────────
export const SPINNERS = {
    brain: { frames: ['🧠', '💭', '💡', '✨', '🧠'], interval: 200 },
    dots: { frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'], interval: 80 },
    hearts: { frames: ['💜', '💙', '💚', '💛', '🧡', '❤️'], interval: 200 },
    moon: { frames: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'], interval: 150 },
    zen: { frames: ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'], interval: 100 },
};

// ─── Typing Effect ────────────────────────────────
export async function typewriter(text, speed = 30, color = '#4ECDC4') {
    for (const char of text) {
        process.stdout.write(chalk.hex(color)(char));
        await sleep(speed);
    }
    process.stdout.write('\n');
}

// ─── Fade In Text ─────────────────────────────────
export async function fadeIn(text, speed = 50) {
    const steps = ['#1a1a2e', '#333', '#666', '#999', '#ccc', '#fff'];
    for (const color of steps) {
        process.stdout.write(`\r${chalk.hex(color)(text)}`);
        await sleep(speed);
    }
    process.stdout.write('\n');
}

// ─── Grounding Exercise (5-4-3-2-1) ─────────────
export async function groundingAnimation() {
    const senses = [
        { count: 5, sense: 'SEE', emoji: '👁', prompt: 'Name 5 things you can see right now' },
        { count: 4, sense: 'TOUCH', emoji: '✋', prompt: 'Name 4 things you can touch right now' },
        { count: 3, sense: 'HEAR', emoji: '👂', prompt: 'Name 3 things you can hear right now' },
        { count: 2, sense: 'SMELL', emoji: '👃', prompt: 'Name 2 things you can smell right now' },
        { count: 1, sense: 'TASTE', emoji: '👅', prompt: 'Name 1 thing you can taste right now' },
    ];

    return senses;
}

// ─── Stretch Exercise Frames ──────────────────────
export const STRETCH_FRAMES = [
    {
        name: 'Neck Roll',
        duration: 15,
        art: [
            '    O    ',
            '   /|\\   ',
            '   / \\   ',
            '',
            'Slowly roll head',
            'in circles',
        ],
    },
    {
        name: 'Shoulder Shrug',
        duration: 10,
        art: [
            '  \\ O /  ',
            '   |\\|   ',
            '   / \\   ',
            '',
            'Raise shoulders',
            'to ears & release',
        ],
    },
    {
        name: 'Wrist Stretch',
        duration: 15,
        art: [
            '    O    ',
            '   /|──  ',
            '   / \\   ',
            '',
            'Extend arm, pull',
            'fingers back gently',
        ],
    },
    {
        name: 'Seated Twist',
        duration: 15,
        art: [
            '    O    ',
            '   /|⟳   ',
            '   / \\   ',
            '',
            'Twist torso left',
            'then right, slowly',
        ],
    },
    {
        name: 'Eye Rest',
        duration: 20,
        art: [
            '  ◉   ◉  ',
            '   ‿‿‿   ',
            '',
            'Close eyes',
            'Roll gently',
            'Look far away 20ft',
        ],
    },
];

// ─── Helper ───────────────────────────────────────
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export { BREATH_FRAMES, sleep };

export default {
    runBreathingAnimation,
    runMeditationMandala,
    SPINNERS,
    typewriter,
    fadeIn,
    groundingAnimation,
    STRETCH_FRAMES,
    BREATH_FRAMES,
    sleep,
};
