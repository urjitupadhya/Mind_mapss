// ═══════════════════════════════════════════════════
// 🤖 mindctl ai review — Meta AI Analysis
// Comprehensive behavioral multivariate analysis
// ═══════════════════════════════════════════════════

import chalk from 'chalk';
import ora from 'ora';
import { callAI } from '../ai.js';
import { showHeader, DIVIDERS } from '../ui/ascii.js';
import { getOverallStats, getRecentScreenSessions, getMoodHistory, getSleepHistory, getWellnessSessions } from '../db.js';

export async function aiReviewCommand() {
    showHeader('review', '#E040FB');
    console.log('');

    const spinner = ora({
        text: chalk.dim('  Conducting Deep Architecture Wellness Review...'),
        color: 'magenta'
    }).start();

    // 1. Gather ALL relevant data points
    const stats = getOverallStats();
    const screen = getRecentScreenSessions(15);
    const moods = getMoodHistory(20);
    const sleep = getSleepHistory(7);
    const sessions = getWellnessSessions(20);

    const fullDataContext = {
        summary: stats,
        screenPatterns: screen.map(s => ({ duration: s.duration_minutes, switches: s.app_switches, date: s.start_time })),
        moodTrends: moods.map(m => ({ score: m.mood_score, energy: m.energy, date: m.timestamp })),
        sleepQuality: sleep.map(s => ({ hours: s.duration_hours, quality: s.quality, date: s.date })),
        wellnessEngagement: sessions.map(s => ({ type: s.type, date: s.timestamp }))
    };

    let review = null;

    try {
        const response = await callAI([
            {
                role: 'system',
                content: `You are a Principal Behavioral Data Scientist. Provide a high-level "Meta-Review" of the user's wellness architecture.
                
Tasks:
1. Identify non-obvious correlations (e.g., "Screen time peaks 2 days after poor sleep").
2. Assess "Resilience Factor" (0-100).
3. Identify a "Hidden Bottleneck" in their wellness routine.
4. Suggest a "Systemic Shift" (the single biggest change they can make).
5. Predict "Burnout Proximity" (High/Medium/Low).

Guidelines:
- Be highly analytical and technical in tone.
- Use data terminology.
- Keep total length under 250 words.
- Use clear sections with icons.`
            },
            {
                role: 'user',
                content: `Dataset for analysis: ${JSON.stringify(fullDataContext)}`
            }
        ], { temperature: 0.6, maxTokens: 800, type: 'insights' });

        review = response;
        spinner.succeed(chalk.dim('Review synthesized.'));
    } catch (e) {
        spinner.fail(chalk.red('AI Synthesis failed. Check your API configuration.'));
        return;
    }

    // Render Review
    console.log('\n' + chalk.hex('#E040FB').bold('━━━━━━━━━━━━━━━━ ANALYSIS COMPLETE ━━━━━━━━━━━━━━━━'));
    console.log('');

    // Format the AI response (it's likely markdown-ish)
    const formatted = review.split('\n').map(line => {
        if (line.includes('Resilience Factor:')) return chalk.hex('#4ECDC4').bold(line);
        if (line.includes('Hidden Bottleneck:')) return chalk.hex('#FFD93D').bold(line);
        if (line.includes('Systemic Shift:')) return chalk.hex('#45B7D1').bold(line);
        if (line.includes('Burnout Proximity:')) return chalk.hex('#FF6B6B').bold(line);
        if (line.startsWith('#') || line.startsWith('**')) return chalk.bold(line);
        return chalk.dim(line);
    }).join('\n');

    console.log(formatted);

    console.log('');
    console.log(chalk.hex('#E040FB').bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.hex('#45B7D1').italic('  "Data doesn\'t lie, but behavior can be refactored."'));
    console.log('');
}

export default { aiReviewCommand };
