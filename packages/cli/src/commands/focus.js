// ═══════════════════════════════════════════════════
// 🔥 mindctl focus — Zen Focus & Pomodoro
// Immersive focus environment with AI mantras
// ═══════════════════════════════════════════════════

import chalk from 'chalk';
import readline from 'readline';
import { callAI } from '../ai.js';
import { showHeader, FIREPLACE } from '../ui/ascii.js';
import { getMoodToday } from '../db.js';

export async function focusCommand(duration = 25) {
    // 1. Get AI Focus Mantra
    const mood = getMoodToday()[0]?.mood || 'neutral';

    console.clear();
    showHeader('focus', '#FF8E53');
    console.log('\n  ' + chalk.dim('Generating your Zen Focus intention...'));

    let mantra = "Focus on the present moment. One breath, one task.";
    try {
        mantra = await callAI([
            {
                role: 'system',
                content: 'You are a Zen focus guide. Generate a one-sentence focus intention/mantra for a developer based on their current mood. Keep it under 15 words. Peaceful and grounding.'
            },
            { role: 'user', content: `Current mood: ${mood}` }
        ], { temperature: 0.8, maxTokens: 50, type: 'general' });
    } catch (e) {
        // Fallback already set
    }

    console.clear();
    let timeLeft = duration * 60;
    const startTime = Date.now();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // Hide cursor
    process.stdout.write('\x1B[?25l');

    let frame = 0;
    const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = Math.max(0, timeLeft - elapsed);

        if (remaining === 0) {
            clearInterval(interval);
            finishFocus();
            return;
        }

        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        // Clear terminal display (return cursor to top left)
        process.stdout.write('\x1B[H');

        console.log('\n');
        console.log(chalk.hex('#FF8E53').bold('      🔥  Z E N   F O C U S   🔥      '));
        console.log('      ' + '─'.repeat(30));
        console.log('\n');

        // Fireplace animation
        const currentFrame = FIREPLACE[frame % FIREPLACE.length];
        currentFrame.forEach(line => {
            console.log('          ' + chalk.hex('#FF8E53')(line));
        });
        frame++;

        console.log('\n');
        console.log(chalk.bold('      TIME REMAINING: ') + chalk.hex('#4ECDC4').bold(timeStr));
        console.log('\n');
        console.log(chalk.hex('#45B7D1').italic(`      " ${mantra} "`));
        console.log('\n');
        console.log(chalk.dim('      Press Ctrl+C to end session early'));

    }, 200);

    // Handle Exit
    process.on('SIGINT', () => {
        clearInterval(interval);
        process.stdout.write('\x1B[?25h'); // Show cursor
        console.log('\n\n  ' + chalk.yellow('Focus session ended early.'));
        process.exit();
    });

    function finishFocus() {
        process.stdout.write('\x1B[?25h'); // Show cursor
        console.clear();
        console.log('\n');
        showHeader('focus', '#4ECDC4');
        console.log('\n  ' + chalk.hex('#4ECDC4').bold('✨ SESSION COMPLETE! ✨'));
        console.log('  ' + chalk.dim(`You stayed focused for ${duration} minutes.`));
        console.log('\n  ' + chalk.hex('#FFD93D')('Return to the world with peace. 🌊'));
        process.exit();
    }
}

export default { focusCommand };
