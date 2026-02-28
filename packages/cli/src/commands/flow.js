// ═══════════════════════════════════════════════════
// 🧬 mindctl flow — Flow State Analysis
// AI-driven productivity & mental focus profiling
// ═══════════════════════════════════════════════════

import chalk from 'chalk';
import ora from 'ora';
import { callAI } from '../ai.js';
import { showHeader, DIVIDERS } from '../ui/ascii.js';
import { getRecentScreenSessions, getMoodToday } from '../db.js';
import { progressBar } from '../ui/theme.js';

export async function flowCommand() {
    showHeader('flow', '#45B7D1');
    console.log('');

    const spinner = ora({
        text: chalk.dim('  Analyzing your digital rhythms...'),
        color: 'cyan'
    }).start();

    const sessions = getRecentScreenSessions(5);
    const mood = getMoodToday();

    if (sessions.length === 0) {
        spinner.warn(chalk.yellow('  Not enough flow data yet.'));
        console.log('  ' + chalk.dim('The Background Guardian needs to track a few sessions first.'));
        console.log('  ' + chalk.dim('Start it with: `mindctl daemon start`'));
        return;
    }

    // Prepare data for AI
    const dataSummary = sessions.map(s => ({
        duration: s.duration_minutes,
        breaks: s.break_count,
        switches: s.app_switches,
        time: s.start_time
    }));

    let analysis = {
        state: 'Unknown',
        score: 50,
        description: 'Need more data to classify your flow state.',
        boosters: ['Try the focus command', 'Log your mood more often']
    };

    try {
        const response = await callAI([
            {
                role: 'system',
                content: `You are a Flow State Psychologist. Analyze the user's recent coding session patterns.
Return a JSON object with:
- "state": (e.g., "Deep Flow", "Chaotic Crunch", "Steady Rhythm", "Drifting", or "Stagnant")
- "score": (0-100 indicating focus quality)
- "description": (2 sentences explaining the classification)
- "boosters": (3 bullet points for improvement)
- "color": (Hex code for the state)

Behavioral Guide:
- High duration + Low switches = Deep Flow
- High switches + High breaks = Chaotic Crunch
- Low duration + High switches = Drifting`
            },
            {
                role: 'user',
                content: `Recent sessions: ${JSON.stringify(dataSummary)}. Current mood profile: ${JSON.stringify(mood)}`
            }
        ], { temperature: 0.5, maxTokens: 300, type: 'insights' });

        analysis = JSON.parse(response.replace(/```json|```/g, '').trim());
    } catch (e) {
        // Fallback
        analysis.state = 'Steady Rhythm';
        analysis.description = 'You are maintaining a consistent work pattern with moderate distractions.';
    }

    spinner.succeed(chalk.dim('Analysis complete'));
    console.log('');

    // Render Result
    const stateColor = analysis.color || '#45B7D1';
    console.log('  ' + chalk.hex(stateColor).bold('╔══════════════════════════════════════════════╗'));
    console.log('  ' + chalk.hex(stateColor)(`║  CURRENT STATE: ${analysis.state.padEnd(28)} ║`));
    console.log('  ' + chalk.hex(stateColor).bold('╠══════════════════════════════════════════════╣'));
    console.log('  ' + chalk.hex(stateColor)('║                                              ║'));

    // Score bar
    const bar = progressBar(analysis.score, 100, 20, stateColor);
    console.log(`  ${chalk.hex(stateColor)('║')}  Focus Score: [${bar}] ${analysis.score}%   ${chalk.hex(stateColor)('║')}`);

    console.log('  ' + chalk.hex(stateColor)('║                                              ║'));

    // Description (wrapped)
    const lines = wrapText(analysis.description, 40);
    lines.forEach(line => {
        console.log('  ' + chalk.hex(stateColor)(`║  ${line.padEnd(42)}  ║`));
    });

    console.log('  ' + chalk.hex(stateColor)('║                                              ║'));
    console.log('  ' + chalk.hex(stateColor).bold(`║  🚀 FLOW BOOSTERS:                           ║`));

    analysis.boosters.slice(0, 3).forEach(b => {
        console.log('  ' + chalk.hex(stateColor)(`║  ├─ ${b.slice(0, 38).padEnd(39)}  ║`));
    });

    console.log('  ' + chalk.hex(stateColor)('║                                              ║'));
    console.log('  ' + chalk.hex(stateColor).bold('╚══════════════════════════════════════════════╝'));
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

export default { flowCommand };
