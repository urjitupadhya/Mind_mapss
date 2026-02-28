// ═══════════════════════════════════════════════════
// 🏆 mindctl quest — AI Weekly Challenges
// Turning wellness into a quest with AI-driven rewards
// ═══════════════════════════════════════════════════

import chalk from 'chalk';
import ora from 'ora';
import { callAI } from '../ai.js';
import { showHeader, DIVIDERS } from '../ui/ascii.js';
import { getActiveQuest, createQuest, getOverallStats } from '../db.js';
import { progressBar } from '../ui/theme.js';

export async function questCommand() {
    showHeader('quest', '#FFD93D');
    console.log('');

    const activeQuest = getActiveQuest();

    if (activeQuest) {
        renderQuest(activeQuest);
        return;
    }

    // No active quest, generate one with AI
    const spinner = ora({
        text: chalk.dim('  Consulting the Oracle for your next quest...'),
        color: 'yellow'
    }).start();

    const stats = getOverallStats();

    let nextQuest = {
        title: 'Morning Mindfulness',
        description: 'Complete 3 breathing sessions this week.',
        type: 'meditation',
        target_count: 3,
        reward_xp: 150
    };

    try {
        const response = await callAI([
            {
                role: 'system',
                content: `You are a Gamification Master. Generate a weekly "Wellness Quest" for a developer.
Return JSON:
- "title": (Creative fantasy-style name, e.g., "The Hydration Hero", "Zen Archer")
- "description": (One sentence explanation: "Complete X actions of Y type")
- "type": (e.g., "meditation", "code-break", "water", "journal")
- "target_count": (Integer 3-10)
- "reward_xp": (Integer 100-500)

Strategy:
- If mood is low: Focus on "journal" or "talk".
- If screen time is high: Focus on "code-break" or "meditation".
- If dehydration: Focus on "water".`
            },
            {
                role: 'user',
                content: `User Data: ${JSON.stringify(stats)}`
            }
        ], { temperature: 0.8, maxTokens: 200, type: 'general' });

        nextQuest = JSON.parse(response.replace(/```json|```/g, '').trim());
    } catch (e) {
        // Fallback already set
    }

    createQuest(nextQuest);
    spinner.succeed(chalk.dim('Quest unlocked!'));

    const newQuest = getActiveQuest();
    renderQuest(newQuest);
}

function renderQuest(q) {
    const expires = new Date(q.expires_at).toLocaleDateString();

    console.log('  ' + chalk.hex('#FFD93D').bold('╔══════════════════════════════════════════════╗'));
    console.log('  ' + chalk.hex('#FFD93D')(`║  ACTIVE QUEST: ${q.title.padEnd(29)} ║`));
    console.log('  ' + chalk.hex('#FFD93D').bold('╠══════════════════════════════════════════════╣'));
    console.log('  ' + chalk.hex('#FFD93D')('║                                              ║'));

    const lines = wrapText(q.description, 40);
    lines.forEach(line => {
        console.log('  ' + chalk.hex('#FFD93D')(`║  ${line.padEnd(42)}  ║`));
    });

    console.log('  ' + chalk.hex('#FFD93D')('║                                              ║'));

    // Progress bar
    const progress = Math.min(1, q.current_count / q.target_count);
    const bar = progressBar(q.current_count, q.target_count, 20, '#4ECDC4');
    console.log(`  ${chalk.hex('#FFD93D')('║')}  Progress: [${bar}] ${q.current_count}/${q.target_count}  ${chalk.hex('#FFD93D')('║')}`);

    console.log('  ' + chalk.hex('#FFD93D')('║                                              ║'));
    console.log('  ' + chalk.hex('#FFD93D')(`║  REWARD: ${chalk.bold(`${q.reward_xp} XP`)}`.padEnd(52) + '║'));
    console.log('  ' + chalk.hex('#FFD93D')(`║  EXPIRES: ${expires.padEnd(31)}  ║`));
    console.log('  ' + chalk.hex('#FFD93D')('║                                              ║'));
    console.log('  ' + chalk.hex('#FFD93D').bold('╚══════════════════════════════════════════════╝'));
    console.log('');
}

function wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
        if ((current + ' ' + word).trim().length > maxWidth) {
            lines.push(current.trim());
            current = word;
        } else {
            current = (current + ' ' + word).trim();
        }
    }
    if (current.trim()) lines.push(current.trim());
    return lines;
}

export default { questCommand };
