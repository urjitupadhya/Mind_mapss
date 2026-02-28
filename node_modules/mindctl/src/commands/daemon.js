// ═══════════════════════════════════════════════════
// 👁️ mindctl daemon — Background Guardian
// Screen time monitoring, smart reminders, break enforcement
// ═══════════════════════════════════════════════════

import chalk from 'chalk';
import { GRADIENTS, createInfoBox, createWarningBox, formatDuration } from '../ui/theme.js';
import { startScreenSession, endScreenSession, getScreenTimeToday, getGamification, getWaterToday, getMoodToday, getOverallStats } from '../db.js';
import { showHeader, renderAscii, WELLNESS_ART } from '../ui/ascii.js';
import { callAI } from '../ai.js';

let daemonInterval = null;
let sessionStartTime = null;
let breakCount = 0;
let lastReminder = 0;
let sessionId = null;

const REMINDER_INTERVALS = {
    eyeBreak: 20 * 60 * 1000,    // 20 minutes
    shortBreak: 45 * 60 * 1000,   // 45 minutes
    longBreak: 120 * 60 * 1000,   // 2 hours
    water: 60 * 60 * 1000,        // 1 hour
    posture: 30 * 60 * 1000,      // 30 minutes
    lateNight: 0,                  // Time-based check
};

export async function daemonCommand(subcommand) {
    switch (subcommand) {
        case 'start':
            return startDaemon();
        case 'stop':
            return stopDaemon();
        case 'status':
            return daemonStatus();
        default:
            return startDaemon();
    }
}

async function startDaemon() {
    if (daemonInterval) {
        console.log(chalk.dim('  ⚠️  Daemon already running.'));
        return;
    }

    showHeader('daemon', '#6C63FF');
    console.log('');
    console.log(chalk.hex('#4ECDC4')('  🛡️  mindctl guardian is now watching over you.'));
    console.log(chalk.dim('  Running quietly in the background...'));
    console.log('');
    console.log(chalk.dim('  📡 Monitoring:'));
    console.log(chalk.dim('  • Screen time        • Break reminders'));
    console.log(chalk.dim('  • Water intake        • Late night alerts'));
    console.log(chalk.dim('  • Posture checks      • Eye strain prevention'));
    console.log('');
    console.log(chalk.dim('  Press Ctrl+C to stop, or run `mindctl daemon stop`'));
    console.log('');

    sessionStartTime = Date.now();
    lastReminder = Date.now();

    // Start screen session in DB
    const result = startScreenSession();
    sessionId = result.lastInsertRowid;

    let tickCount = 0;

    daemonInterval = setInterval(() => {
        tickCount++;
        const elapsed = Date.now() - sessionStartTime;
        const hour = new Date().getHours();
        const mins = Math.floor(elapsed / 60000);

        // 1. Eye break every 3 seconds (EXTREME REAL-TIME)
        if (tickCount % 1 === 0) {
            showReminder('eye', elapsed);
        }

        // 2. Water reminder (every hour: 1200 ticks * 3s = 60m)
        if (tickCount % 1200 === 0) {
            showReminder('water', elapsed);
        }

        // 3. Morning Meditation (6 AM - 9 AM)
        if (hour >= 6 && hour <= 9 && (tickCount === 10 || tickCount % 1200 === 0)) {
            showReminder('meditation', elapsed);
        }

        // 4. Posture reminder (every 30 min: 600 ticks)
        if (tickCount % 600 === 0) {
            showReminder('posture', elapsed);
        }

        // 5. 45 min break reminder (900 ticks)
        if (mins >= 45 && tickCount % 900 === 0) {
            showReminder('break', elapsed);
        }

        // 6. 2 hour intense warning (2400 ticks)
        if (mins >= 120 && tickCount % 2400 === 0) {
            showReminder('long', elapsed);
        }

        // 7. Late night check (after 11 PM)
        if (hour >= 23 && tickCount % 200 === 0) {
            showReminder('latenight', elapsed);
        }

        // 8. Proactive AI Intervention (every hour: 1200 ticks)
        if (tickCount > 0 && tickCount % 1200 === 0) {
            showReminder('proactive', elapsed);
        }

        // Status line
        const waterToday = getWaterToday();
        process.stdout.write(
            `\r  ${chalk.dim(`⏱ ${formatDuration(mins)} active`)} ${chalk.dim(`• 💧 ${waterToday}/8`)} ${chalk.dim(`• ☕ ${breakCount} breaks`)}  `
        );

    }, 3000); // EXTREME REAL-TIME: Check every 3 seconds

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        stopDaemon();
        process.exit(0);
    });

    // Keep alive
    await new Promise(() => { }); // Block forever until Ctrl+C
}

function showReminder(type, elapsed) {
    lastReminder = Date.now();
    const elapsedMin = Math.floor(elapsed / 60000);

    console.log('');

    switch (type) {
        case 'proactive':
            (async () => {
                try {
                    const stats = getOverallStats();
                    const mood = stats.todayMoods[0]?.mood || 'neutral';
                    const intervention = await callAI([
                        { role: 'system', content: 'You are the Mind Control AI Guardian. Be brief, proactive, and supportive. Tell the user what they should do right now based on their state. 1 short sentence.' },
                        { role: 'user', content: `Stats: ⏰ ${elapsedMin} min active, 🎭 Mood ${mood}. Suggest intervention.` }
                    ], { temperature: 0.7, maxTokens: 60, type: 'general' });
                    console.log('\n  ' + chalk.hex('#6BCB77').bold('🛡️  GUARD-AI: ') + chalk.hex('#B5FFAD')(intervention));
                } catch { }
            })();
            break;

        case 'eye':
            process.stdout.write('\x07'); // Sonic Ping for real-time focus
            console.log(chalk.hex('#45B7D1')('  ┌────────────────────────────────────────┐'));
            console.log(chalk.hex('#45B7D1')('  │ 👁  EYE BREAK: 3 seconds reached!     │'));
            console.log(chalk.hex('#45B7D1')('  │ Look away from the screen now.         │'));
            console.log(chalk.hex('#45B7D1')('  └────────────────────────────────────────┘'));
            break;

        case 'meditation':
            console.log(chalk.hex('#E040FB')('  ┌────────────────────────────────────────┐'));
            console.log(chalk.hex('#E040FB')('  │ 🧘 Morning Mindfulness Reminder       │'));
            console.log(chalk.hex('#E040FB')('  │ A great day starts with a clear mind.  │'));
            console.log(chalk.hex('#E040FB')('  │ [m] `mindctl meditate` to start.       │'));
            console.log(chalk.hex('#E040FB')('  └────────────────────────────────────────┘'));
            break;

        case 'break':
            console.log(chalk.hex('#FFD93D')('  ┌────────────────────────────────────────┐'));
            console.log(chalk.hex('#FFD93D')(`  │ ☕ ${elapsedMin} min without a break!       │`));
            console.log(chalk.hex('#FFD93D')('  │ Your focus is great, but your body     │'));
            console.log(chalk.hex('#FFD93D')('  │ needs movement.                        │'));
            console.log(chalk.hex('#FFD93D')('  │                                        │'));
            console.log(chalk.hex('#FFD93D')('  │ [s] `mindctl stretch` — desk stretches │'));
            console.log(chalk.hex('#FFD93D')('  │ [b] `mindctl breathe` — breathing      │'));
            console.log(chalk.hex('#FFD93D')('  │ [w] `mindctl walk` — take a walk       │'));
            console.log(chalk.hex('#FFD93D')('  └────────────────────────────────────────┘'));
            break;

        case 'long':
            console.log(chalk.hex('#FF8E53')('  ┌────────────────────────────────────────┐'));
            console.log(chalk.hex('#FF8E53')(`  │ ⚠️  ${formatDuration(elapsedMin)} non-stop!            │`));
            console.log(chalk.hex('#FF8E53')('  │                                        │'));
            console.log(chalk.hex('#FF8E53')('  │ Extended screen time correlates with    │'));
            console.log(chalk.hex('#FF8E53')('  │ 30% more errors and worse mood.        │'));
            console.log(chalk.hex('#FF8E53')('  │ Step away for at least 10 minutes.     │'));
            console.log(chalk.hex('#FF8E53')('  └────────────────────────────────────────┘'));
            break;

        case 'water':
            const water = getWaterToday();
            if (water < 8) {
                console.log(chalk.hex('#45B7D1')(`  💧 Hydration reminder! (${water}/8 glasses today)`));
                console.log(chalk.dim('     Run `mindctl water` to log'));
            }
            break;

        case 'posture':
            console.log(chalk.hex('#96CEB4')('  🧍 Posture check! Shoulders down, back straight.'));
            break;

        case 'latenight':
            console.log(chalk.hex('#7B68EE')('  ┌────────────────────────────────────────┐'));
            console.log(chalk.hex('#7B68EE')(`  │ 🌙 It's after 11 PM. Still coding?    │`));
            console.log(chalk.hex('#7B68EE')('  │                                        │'));
            console.log(chalk.hex('#7B68EE')('  │ Late-night coding → more bugs,         │'));
            console.log(chalk.hex('#7B68EE')('  │ worse mood tomorrow.                   │'));
            console.log(chalk.hex('#7B68EE')('  │                                        │'));
            console.log(chalk.hex('#7B68EE')('  │ Tomorrow-you will thank tonight-you    │'));
            console.log(chalk.hex('#7B68EE')('  │ for stopping now.                      │'));
            console.log(chalk.hex('#7B68EE')('  │                                        │'));
            console.log(chalk.hex('#7B68EE')('  │ [q] `mindctl breathe --type sleep`     │'));
            console.log(chalk.hex('#7B68EE')('  └────────────────────────────────────────┘'));
            break;

        case 'weekend':
            console.log(chalk.hex('#E040FB')('  📅 It\'s the weekend. Make sure this work is truly needed.'));
            console.log(chalk.dim('     Run `mindctl burnout` to check your patterns.'));
            break;
    }
}

function stopDaemon() {
    if (daemonInterval) {
        clearInterval(daemonInterval);
        daemonInterval = null;

        if (sessionId) {
            endScreenSession(sessionId, breakCount, 0);
        }

        const elapsed = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 60000) : 0;

        console.log('');
        console.log(chalk.hex('#4ECDC4')('  🛡️  Guardian stopped.'));
        console.log(chalk.dim(`  Session: ${formatDuration(elapsed)} • ${breakCount} breaks taken`));
        console.log('');
    } else {
        console.log(chalk.dim('  Daemon is not running.'));
    }
}

function daemonStatus() {
    console.log('');
    if (daemonInterval) {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 60000);
        console.log(chalk.hex('#4ECDC4').bold('  🛡️  Guardian: ACTIVE'));
        console.log(chalk.dim(`  Running for: ${formatDuration(elapsed)}`));
        console.log(chalk.dim(`  Breaks taken: ${breakCount}`));
    } else {
        console.log(chalk.dim('  🛡️  Guardian: INACTIVE'));
        console.log(chalk.dim('  Start with `mindctl daemon start`'));
    }

    const screenToday = getScreenTimeToday();
    console.log(chalk.dim(`  Screen time today: ${formatDuration(screenToday)}`));
    console.log('');
}

export default { daemonCommand };
