// ═══════════════════════════════════════════════════
// 🧠 mindctl think — CBT Thought Records
// Cognitive Behavioral Therapy tool with AI analysis
// ═══════════════════════════════════════════════════

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GRADIENTS, createSuccessBox, createInfoBox } from '../ui/theme.js';
import { addThoughtRecord, getThoughtRecords, checkAchievements } from '../db.js';
import { analyzeCBT, reframeThought, checkForCrisisSignals, getCrisisResources } from '../ai.js';
import { renderCompanion, getCompanionReaction } from '../companion.js';
import { showHeader, renderAscii, COMPLETION } from '../ui/ascii.js';

const COGNITIVE_DISTORTIONS = [
    { name: '🔮 Mind Reading — Assuming you know what others think', value: 'mind_reading' },
    { name: '🔮 Fortune Telling — Predicting the worst will happen', value: 'fortune_telling' },
    { name: '⚫ All-or-Nothing — Seeing only black or white', value: 'all_or_nothing' },
    { name: '🏔️ Catastrophizing — Blowing things out of proportion', value: 'catastrophizing' },
    { name: '🏷️ Labeling — Defining yourself by one event', value: 'labeling' },
    { name: '🔍 Mental Filter — Focusing only on negatives', value: 'mental_filter' },
    { name: '🚫 Disqualifying — Dismissing positive experiences', value: 'disqualifying' },
    { name: '📐 Should Statements — Rigid rules about behavior', value: 'should_statements' },
    { name: '👤 Personalization — Blaming yourself for everything', value: 'personalization' },
    { name: '📊 Overgeneralization — "Always" and "never" thinking', value: 'overgeneralization' },
    { name: '🎭 Emotional Reasoning — Feelings = facts', value: 'emotional_reasoning' },
    { name: '❓ Not sure / Let AI identify', value: 'unknown' },
];

const EMOTIONS = [
    'anxious', 'angry', 'sad', 'frustrated', 'embarrassed',
    'guilty', 'ashamed', 'hopeless', 'overwhelmed', 'scared',
    'jealous', 'inadequate', 'lonely', 'restless', 'numb',
];

export async function thinkCommand(subcommand, options = {}) {
    switch (subcommand) {
        case 'reframe':
            return reframeCommand();
        case 'history':
            return thoughtHistory(options);
        default:
            return fullThoughtRecord();
    }
}

async function fullThoughtRecord() {
    showHeader('think', '#E040FB');
    console.log(chalk.dim('  Let\'s examine this thought together.'));
    console.log('');

    // Step 1: Situation
    const { situation } = await inquirer.prompt([{
        type: 'input',
        name: 'situation',
        message: chalk.hex('#4ECDC4')('📍 What happened? (the situation):'),
        validate: v => v.length > 3 || 'Please describe the situation',
    }]);

    // Step 2: Automatic thought
    const { automaticThought } = await inquirer.prompt([{
        type: 'input',
        name: 'automaticThought',
        message: chalk.hex('#FF8E53')('💭 What thought popped into your head?'),
        validate: v => v.length > 3 || 'Please share the thought',
    }]);

    // Crisis check
    if (checkForCrisisSignals(automaticThought)) {
        console.log(chalk.hex('#FF6B6B').bold(getCrisisResources()));
    }

    // Step 3: Emotion
    const { emotion } = await inquirer.prompt([{
        type: 'list',
        name: 'emotion',
        message: chalk.hex('#E040FB')('🎭 What emotion did you feel?'),
        choices: EMOTIONS.map(e => ({ name: e.charAt(0).toUpperCase() + e.slice(1), value: e })),
        pageSize: 15,
    }]);

    // Step 4: Intensity
    const { emotionIntensity } = await inquirer.prompt([{
        type: 'list',
        name: 'emotionIntensity',
        message: chalk.hex('#FF6B6B')(`How intense was the ${emotion}?`),
        choices: Array.from({ length: 10 }, (_, i) => ({
            name: `${'█'.repeat(i + 1)}${'░'.repeat(9 - i)} ${i + 1}/10`,
            value: i + 1,
        })),
        default: 6,
    }]);

    // AI Analysis
    const spinner = ora({ text: chalk.dim('AI analyzing thought pattern...'), color: 'cyan' }).start();
    let aiAnalysis = '';
    try {
        aiAnalysis = await analyzeCBT({ situation, automaticThought, emotion, emotionIntensity });
        spinner.succeed(chalk.dim('Pattern identified'));
    } catch {
        spinner.info(chalk.dim('Continuing without AI'));
    }

    // Show AI analysis
    if (aiAnalysis) {
        console.log('');
        console.log(createInfoBox('🤖 AI Analysis', chalk.hex('#45B7D1')(aiAnalysis)));
    }

    // Step 5: Cognitive distortion
    const { cognitiveDistortion } = await inquirer.prompt([{
        type: 'list',
        name: 'cognitiveDistortion',
        message: chalk.hex('#FFD93D')('🔍 Which thinking pattern fits?'),
        choices: COGNITIVE_DISTORTIONS,
        pageSize: 12,
    }]);

    // Step 6: Evidence
    const { evidenceFor } = await inquirer.prompt([{
        type: 'input',
        name: 'evidenceFor',
        message: chalk.hex('#FF6B6B')('📋 Evidence SUPPORTING the thought:'),
        default: '',
    }]);

    const { evidenceAgainst } = await inquirer.prompt([{
        type: 'input',
        name: 'evidenceAgainst',
        message: chalk.hex('#4ECDC4')('📋 Evidence AGAINST the thought:'),
        default: '',
    }]);

    // Step 7: Reframe
    const { reframedThought } = await inquirer.prompt([{
        type: 'input',
        name: 'reframedThought',
        message: chalk.hex('#6BCB77')('💡 A more balanced thought would be:'),
        default: '',
    }]);

    // Step 8: New emotion
    const { newEmotion } = await inquirer.prompt([{
        type: 'list',
        name: 'newEmotion',
        message: chalk.hex('#4ECDC4')('How do you feel now?'),
        choices: [...EMOTIONS, 'hopeful', 'relieved', 'calmer', 'neutral'].map(e => ({
            name: e.charAt(0).toUpperCase() + e.slice(1), value: e,
        })),
    }]);

    const { newIntensity } = await inquirer.prompt([{
        type: 'list',
        name: 'newIntensity',
        message: chalk.hex('#4ECDC4')(`Intensity of ${newEmotion} now?`),
        choices: Array.from({ length: 10 }, (_, i) => ({
            name: `${'█'.repeat(i + 1)}${'░'.repeat(9 - i)} ${i + 1}/10`,
            value: i + 1,
        })),
        default: 4,
    }]);

    // Save
    addThoughtRecord({
        situation, automaticThought, emotion, emotionIntensity,
        cognitiveDistortion, evidenceFor, evidenceAgainst,
        reframedThought, newEmotion, newIntensity, aiAnalysis,
    });

    // Display summary
    const intensityDiff = emotionIntensity - newIntensity;
    console.log('');
    console.log(createSuccessBox([
        chalk.hex('#4ECDC4').bold('  ✓ Thought Record Complete'),
        '',
        chalk.dim(`  Situation: ${situation.substring(0, 50)}`),
        chalk.hex('#FF8E53')(`  Thought:   "${automaticThought.substring(0, 50)}"`),
        chalk.hex('#E040FB')(`  Pattern:   ${cognitiveDistortion.replace('_', ' ')}`),
        chalk.hex('#6BCB77')(`  Reframe:   "${reframedThought.substring(0, 50)}"`),
        '',
        chalk.dim(`  Emotion shift: ${emotion} ${emotionIntensity}/10 → ${newEmotion} ${newIntensity}/10`),
        intensityDiff > 0
            ? chalk.hex('#4ECDC4')(`  ↓ Intensity reduced by ${intensityDiff} points!`)
            : chalk.dim('  Processing takes time. Every record builds awareness.'),
    ].join('\n')));

    console.log(renderCompanion({ mood: 'excited', message: getCompanionReaction('thought_record').message }));

    const achievements = checkAchievements();
    if (achievements.length > 0) {
        achievements.forEach(a => console.log(chalk.hex('#FFD700')(`  ${a.label}`)));
    }
}

async function reframeCommand() {
    console.log('');
    console.log(GRADIENTS.calm('  ─── Quick Reframe ───'));
    console.log(chalk.dim('  Paste a negative thought → get a balanced perspective'));
    console.log('');

    const { thought } = await inquirer.prompt([{
        type: 'input',
        name: 'thought',
        message: chalk.hex('#FF8E53')('💭 The negative thought:'),
        validate: v => v.length > 3 || 'Please share the thought',
    }]);

    const spinner = ora({ text: chalk.dim('AI reframing...'), color: 'cyan' }).start();

    try {
        const reframe = await reframeThought(thought);
        spinner.succeed(chalk.dim('Reframed'));

        console.log('');
        console.log(createInfoBox('Cognitive Reframe', [
            chalk.hex('#FF8E53')(`  ✗ "${thought}"`),
            '',
            chalk.hex('#4ECDC4')(`  ✓ ${reframe}`),
        ].join('\n')));
    } catch {
        spinner.fail(chalk.dim('Could not reframe right now'));
        console.log(chalk.dim('  Try asking yourself: "What would I tell a friend in this situation?"'));
    }
}

async function thoughtHistory(options) {
    const days = options.days || 30;
    const records = getThoughtRecords(days);

    console.log('');
    console.log(GRADIENTS.calm(`  ─── Thought Records (${days} days) ───`));
    console.log('');

    if (records.length === 0) {
        console.log(chalk.dim('  No thought records yet. Start with `mindctl think`'));
        return;
    }

    // Distortion frequency
    const distortions = {};
    records.forEach(r => {
        const d = r.cognitive_distortion || 'unknown';
        distortions[d] = (distortions[d] || 0) + 1;
    });

    console.log(chalk.bold('  Most common thought patterns:'));
    Object.entries(distortions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([d, count]) => {
            const bar = '█'.repeat(Math.min(count * 3, 20));
            console.log(`  ${chalk.hex('#E040FB')(bar)} ${d.replace('_', ' ')} (${count}x)`);
        });

    console.log('');

    // Intensity improvements
    const improvements = records.filter(r => r.new_intensity && r.emotion_intensity);
    if (improvements.length > 0) {
        const avgImprovement = improvements.reduce((s, r) => s + (r.emotion_intensity - r.new_intensity), 0) / improvements.length;
        console.log(chalk.hex('#4ECDC4')(`  Average intensity reduction: ${avgImprovement.toFixed(1)} points`));
    }

    console.log(chalk.dim(`  Total records: ${records.length}`));
}

export default { thinkCommand };
