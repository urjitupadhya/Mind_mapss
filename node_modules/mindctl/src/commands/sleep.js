// ═══════════════════════════════════════════════════
// 💤 mindctl sleep — Sleep Tracking & Hygiene
// ═══════════════════════════════════════════════════

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GRADIENTS, createSuccessBox, moodBar, sparkline } from '../ui/theme.js';
import { addSleepLog, getSleepHistory } from '../db.js';
import { analyzeSleep } from '../ai.js';
import { showHeader, renderAscii, WELLNESS_ART } from '../ui/ascii.js';

export async function sleepCommand(subcommand, options = {}) {
    switch (subcommand) {
        case 'log':
            return logSleep();
        case 'history':
        case 'analyze':
            return sleepHistory(options);
        case 'tips':
            return sleepTips();
        default:
            return logSleep();
    }
}

async function logSleep() {
    showHeader('sleep', '#7B68EE');
    console.log('');

    const { date } = await inquirer.prompt([{
        type: 'list',
        name: 'date',
        message: chalk.hex('#6C63FF')('Which night?'),
        choices: [
            { name: 'Last night', value: new Date().toISOString().split('T')[0] },
            { name: '2 nights ago', value: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
            { name: '3 nights ago', value: new Date(Date.now() - 172800000).toISOString().split('T')[0] },
        ],
    }]);

    const { bedtime } = await inquirer.prompt([{
        type: 'list',
        name: 'bedtime',
        message: chalk.hex('#7B68EE')('What time did you go to bed?'),
        choices: [
            '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM',
            '11:30 PM', '12:00 AM', '12:30 AM', '1:00 AM', '1:30 AM',
            '2:00 AM', '2:30 AM', '3:00 AM',
        ].map(t => ({ name: t, value: t })),
        default: 4,
    }]);

    const { waketime } = await inquirer.prompt([{
        type: 'list',
        name: 'waketime',
        message: chalk.hex('#45B7D1')('What time did you wake up?'),
        choices: [
            '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM',
            '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
            '10:00 AM', '10:30 AM', '11:00 AM',
        ].map(t => ({ name: t, value: t })),
        default: 4,
    }]);

    const { quality } = await inquirer.prompt([{
        type: 'list',
        name: 'quality',
        message: chalk.hex('#4ECDC4')('Sleep quality?'),
        choices: [
            { name: `${'★'.repeat(1)}${'☆'.repeat(4)}  Terrible`, value: 2 },
            { name: `${'★'.repeat(2)}${'☆'.repeat(3)}  Poor`, value: 4 },
            { name: `${'★'.repeat(3)}${'☆'.repeat(2)}  Okay`, value: 6 },
            { name: `${'★'.repeat(4)}${'☆'.repeat(1)}  Good`, value: 8 },
            { name: `${'★'.repeat(5)}             Great`, value: 10 },
        ],
    }]);

    // Estimate duration
    const durationHours = estimateDuration(bedtime, waketime);

    const { notes } = await inquirer.prompt([{
        type: 'input',
        name: 'notes',
        message: chalk.dim('Any notes? (dreams, interruptions, etc.)'),
        default: '',
    }]);

    addSleepLog(date, bedtime, waketime, durationHours, quality, notes, '');

    // AI analysis
    const spinner = ora({ text: chalk.dim('Analyzing sleep...'), color: 'magenta' }).start();
    try {
        const analysis = await analyzeSleep({ date, bedtime, waketime, durationHours, quality, notes });
        spinner.succeed(chalk.dim('Analysis complete'));
        console.log('');
        console.log(chalk.hex('#45B7D1')(`  🤖 ${analysis}`));
    } catch {
        spinner.info(chalk.dim('Sleep logged'));
    }

    console.log('');
    console.log(createSuccessBox([
        chalk.hex('#6C63FF').bold('  ✓ Sleep logged'),
        '',
        chalk.dim(`  🛏️  ${bedtime} → ☀️  ${waketime}`),
        chalk.dim(`  Duration: ${durationHours.toFixed(1)}h`),
        `  Quality:  ${moodBar(quality * 10, 10)} ${quality}/10`,
    ].join('\n')));
}

async function sleepHistory(options) {
    const days = options.days || 14;
    const history = getSleepHistory(days);

    console.log('');
    console.log(GRADIENTS.aurora(`  ─── Sleep History (${days} days) ───`));
    console.log('');

    if (history.length === 0) {
        console.log(chalk.dim('  No sleep data yet. Run `mindctl sleep log` to start.'));
        return;
    }

    history.forEach(s => {
        const bar = moodBar((s.quality || 5) * 10, 10);
        const hours = s.duration_hours ? `${s.duration_hours.toFixed(1)}h` : '?h';
        console.log(`  ${chalk.dim(s.date)}  ${bar}  ${chalk.bold(hours)}  ${s.bedtime || ''} → ${s.waketime || ''}`);
    });

    console.log('');
    const avgHours = history.reduce((s, sl) => s + (sl.duration_hours || 0), 0) / history.length;
    const avgQuality = history.reduce((s, sl) => s + (sl.quality || 5), 0) / history.length;
    console.log(`  Avg duration: ${chalk.bold(avgHours.toFixed(1) + 'h')}  Avg quality: ${moodBar(avgQuality * 10, 10)} ${avgQuality.toFixed(1)}/10`);

    const durationTrend = history.map(s => (s.duration_hours || 0) * 10).reverse();
    console.log(`  Duration trend: ${sparkline(durationTrend)}`);
}

async function sleepTips() {
    console.log('');
    console.log(GRADIENTS.aurora('  ─── Sleep Hygiene Tips ───'));
    console.log('');

    const tips = [
        '🛏️  Keep a consistent sleep schedule (even weekends)',
        '📱  No screens 30 min before bed (or use night mode)',
        '☕  No caffeine after 2 PM',
        '🏃  Exercise daily, but not within 3 hours of bed',
        '🌡️  Keep bedroom cool (65-68°F / 18-20°C)',
        '🌑  Make your room as dark as possible',
        '🫁  Try 4-7-8 breathing: `mindctl breathe --type 478`',
        '📝  Journal before bed: `mindctl journal write`',
        '🧘  Evening meditation: `mindctl meditate`',
        '💧  Avoid large meals and alcohol before bed',
    ];

    tips.forEach(t => console.log(`  ${t}`));
    console.log('');
}

function estimateDuration(bedtime, waketime) {
    const parseTime = (t) => {
        const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return 0;
        let hours = parseInt(match[1]);
        const mins = parseInt(match[2]);
        const ampm = match[3].toUpperCase();
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        return hours + mins / 60;
    };

    const bed = parseTime(bedtime);
    const wake = parseTime(waketime);
    let duration = wake - bed;
    if (duration < 0) duration += 24;
    return duration;
}

export default { sleepCommand };
