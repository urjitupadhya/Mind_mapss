// ═══════════════════════════════════════════════════
// 📝 mindctl journal — AI-Powered Therapeutic Journaling
// Freeform, gratitude, dream, and prompted journaling
// ═══════════════════════════════════════════════════

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GRADIENTS, createSuccessBox, createInfoBox, fancyDivider } from '../ui/theme.js';
import { addJournalEntry, getJournalEntries, checkAchievements } from '../db.js';
import { analyzeJournal, checkForCrisisSignals, getCrisisResources } from '../ai.js';
import { renderCompanion, getCompanionReaction } from '../companion.js';
import { showHeader, renderAscii, WELLNESS_ART, DIVIDERS } from '../ui/ascii.js';

const PROMPTS = {
    reflection: [
        "What challenged you today, and what did you learn from it?",
        "Describe a moment today when you felt truly present.",
        "What would you tell your past self about what happened today?",
        "If today had a theme song, what would it be and why?",
        "What is something you did today that took courage?",
        "What conversation or interaction stuck with you today?",
        "What did you notice about yourself today that surprised you?",
        "If you could change one decision from today, would you? Why?",
    ],
    gratitude: [
        "Name 3 things you're grateful for right now.",
        "Who made a positive difference in your day and why?",
        "What small pleasure did you enjoy today?",
        "What ability or skill are you thankful to have?",
        "Describe a challenge that you're grateful for going through.",
        "What part of your daily routine do you appreciate most?",
        "Name someone who believes in you. What do they see?",
    ],
    growth: [
        "What's one thing you learned this week?",
        "Describe a mistake you made and what it taught you.",
        "What skill are you actively developing right now?",
        "How have you grown compared to 6 months ago?",
        "What feedback have you received that changed your perspective?",
        "What's a belief you held strongly but have since revised?",
    ],
    emotional: [
        "What emotion has been most present for you today?",
        "Describe a situation where you handled your emotions well recently.",
        "What feeling are you avoiding right now? Why?",
        "Write a letter to an emotion you've been struggling with.",
        "If your emotions had colors today, what palette would they form?",
        "What does your body feel right now? Scan from head to toe.",
    ],
    dream: [
        "Describe the last dream you remember in detail.",
        "What recurring themes appear in your dreams?",
        "Did any dream this week feel significant? Why?",
        "If your dream had a message for you, what would it be?",
    ],
};

export async function journalCommand(subcommand, options = {}) {
    switch (subcommand) {
        case 'write':
            return journalWrite(options);
        case 'prompt':
            return journalPrompt(options);
        case 'gratitude':
            return journalGratitude(options);
        case 'dream':
            return journalDream(options);
        case 'review':
        case 'history':
            return journalHistory(options);
        case 'analyze':
            return journalAnalyze(options);
        default:
            return journalWrite(options);
    }
}

async function journalWrite(options) {
    showHeader('journal', '#4ECDC4');
    console.log(chalk.dim('  Write freely. Your thoughts are encrypted locally.'));
    console.log('');

    const { title } = await inquirer.prompt([{
        type: 'input',
        name: 'title',
        message: chalk.hex('#4ECDC4')('Title (optional):'),
        default: `Entry — ${new Date().toLocaleDateString()}`,
    }]);

    const { content } = await inquirer.prompt([{
        type: 'editor',
        name: 'content',
        message: chalk.hex('#45B7D1')('Write your journal entry:'),
        waitForUseInput: true,
    }]);

    if (!content || content.trim().length < 5) {
        console.log(chalk.dim('  Entry too short. Nothing saved.'));
        return;
    }

    // Crisis check
    if (checkForCrisisSignals(content)) {
        console.log(chalk.hex('#FF6B6B').bold(getCrisisResources()));
    }

    // AI analysis
    const spinner = ora({ text: chalk.dim('AI analyzing your entry...'), color: 'cyan' }).start();
    let analysis = '';
    try {
        analysis = await analyzeJournal(content, 'freeform');
        spinner.succeed(chalk.dim('Analysis complete'));
    } catch {
        spinner.info(chalk.dim('Entry saved'));
    }

    addJournalEntry('freeform', title, content, null, null, null, [], analysis);

    console.log('');
    console.log(createSuccessBox([
        chalk.hex('#4ECDC4').bold('  ✓ Journal entry saved'),
        chalk.dim(`  📝 ${content.split('\n').length} lines, ${content.split(/\s+/).length} words`),
        '',
        analysis ? chalk.hex('#45B7D1')(`  🤖 ${analysis}`) : '',
    ].filter(Boolean).join('\n')));

    console.log(renderCompanion({ mood: 'excited', message: getCompanionReaction('journal').message }));

    const achievements = checkAchievements();
    if (achievements.length > 0) {
        achievements.forEach(a => console.log(chalk.hex('#FFD700')(`  ${a.label}`)));
    }
}

async function journalPrompt(options) {
    console.log('');
    console.log(GRADIENTS.calm('  ─── Prompted Journal ───'));
    console.log('');

    const { category } = await inquirer.prompt([{
        type: 'list',
        name: 'category',
        message: chalk.hex('#4ECDC4')('Choose a prompt category:'),
        choices: [
            { name: '🪞  Reflection', value: 'reflection' },
            { name: '🙏  Gratitude', value: 'gratitude' },
            { name: '🌱  Growth', value: 'growth' },
            { name: '🎭  Emotional', value: 'emotional' },
        ],
    }]);

    const prompts = PROMPTS[category];
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];

    console.log('');
    console.log(chalk.hex('#FFD93D').bold(`  💡 "${prompt}"`));
    console.log('');

    const { content } = await inquirer.prompt([{
        type: 'editor',
        name: 'content',
        message: chalk.dim('Write your response:'),
    }]);

    if (!content || content.trim().length < 5) {
        console.log(chalk.dim('  Entry too short. Nothing saved.'));
        return;
    }

    const spinner = ora({ text: chalk.dim('AI reflecting on your entry...'), color: 'cyan' }).start();
    let analysis = '';
    try {
        analysis = await analyzeJournal(content, category);
        spinner.succeed(chalk.dim('Reflection complete'));
    } catch {
        spinner.info(chalk.dim('Entry saved'));
    }

    addJournalEntry(category, `${category} prompt`, content, prompt, null, null, [category], analysis);

    console.log('');
    console.log(createSuccessBox([
        chalk.hex('#4ECDC4').bold('  ✓ Prompted entry saved'),
        chalk.dim(`  Category: ${category}`),
        analysis ? `\n  🤖 ${chalk.hex('#45B7D1')(analysis)}` : '',
    ].filter(Boolean).join('\n')));
}

async function journalGratitude() {
    console.log('');
    console.log(GRADIENTS.sunset('  ─── Gratitude Practice ───'));
    console.log(chalk.dim('  Take a moment to notice the good.'));
    console.log('');

    const { thing1 } = await inquirer.prompt([{
        type: 'input',
        name: 'thing1',
        message: chalk.hex('#FFD93D')('🙏 I\'m grateful for (1/3):'),
    }]);

    const { thing2 } = await inquirer.prompt([{
        type: 'input',
        name: 'thing2',
        message: chalk.hex('#FFD93D')('🙏 I\'m grateful for (2/3):'),
    }]);

    const { thing3 } = await inquirer.prompt([{
        type: 'input',
        name: 'thing3',
        message: chalk.hex('#FFD93D')('🙏 I\'m grateful for (3/3):'),
    }]);

    const content = `1. ${thing1}\n2. ${thing2}\n3. ${thing3}`;

    addJournalEntry('gratitude', 'Gratitude Practice', content, 'Three things I\'m grateful for', null, null, ['gratitude'], '');

    console.log('');
    console.log(createSuccessBox([
        chalk.hex('#FFD93D').bold('  ✓ Gratitude practice saved'),
        '',
        chalk.hex('#4ECDC4')(`  1. ${thing1}`),
        chalk.hex('#4ECDC4')(`  2. ${thing2}`),
        chalk.hex('#4ECDC4')(`  3. ${thing3}`),
        '',
        chalk.dim('  "Gratitude turns what we have into enough."'),
    ].join('\n')));

    console.log(renderCompanion({ mood: 'happy', message: 'Your gratitude practice warms my heart! 🙏 +20 XP' }));
}

async function journalDream() {
    console.log('');
    console.log(GRADIENTS.aurora('  ─── Dream Journal ───'));
    console.log(chalk.dim('  Capture your dreams before they fade.'));
    console.log('');

    const prompt = PROMPTS.dream[Math.floor(Math.random() * PROMPTS.dream.length)];
    console.log(chalk.hex('#7B68EE').italic(`  💭 "${prompt}"`));
    console.log('');

    const { content } = await inquirer.prompt([{
        type: 'editor',
        name: 'content',
        message: chalk.dim('Describe your dream:'),
    }]);

    if (!content || content.trim().length < 5) {
        console.log(chalk.dim('  Entry too short. Nothing saved.'));
        return;
    }

    const spinner = ora({ text: chalk.dim('AI exploring dream themes...'), color: 'magenta' }).start();
    let analysis = '';
    try {
        analysis = await analyzeJournal(content, 'dream');
        spinner.succeed(chalk.dim('Dream analysis complete'));
    } catch {
        spinner.info(chalk.dim('Dream saved'));
    }

    addJournalEntry('dream', 'Dream Entry', content, prompt, null, null, ['dream'], analysis);

    console.log('');
    console.log(createSuccessBox([
        chalk.hex('#7B68EE').bold('  ✓ Dream entry saved'),
        analysis ? `\n  🔮 ${chalk.hex('#9B89B3')(analysis)}` : '',
    ].filter(Boolean).join('\n')));
}

async function journalHistory(options) {
    const days = options.days || 14;
    const entries = getJournalEntries(days);

    console.log('');
    console.log(GRADIENTS.calm(`  ─── Journal History (${days} days) ───`));
    console.log('');

    if (entries.length === 0) {
        console.log(chalk.dim('  No journal entries yet. Start with `mindctl journal write`'));
        return;
    }

    const typeIcons = {
        freeform: '📝',
        gratitude: '🙏',
        dream: '🔮',
        growth: '🌱',
        reflection: '🪞',
        emotional: '🎭',
    };

    entries.slice(0, 20).forEach(entry => {
        const icon = typeIcons[entry.type] || '📝';
        const date = entry.timestamp.split('T')[0] || entry.timestamp.split(' ')[0];
        const words = entry.content.split(/\s+/).length;
        const preview = entry.content.substring(0, 60).replace(/\n/g, ' ');

        console.log(`  ${icon} ${chalk.dim(date)} ${chalk.bold(entry.title || 'Untitled')} ${chalk.dim(`(${words} words)`)}`);
        console.log(chalk.dim(`     ${preview}${entry.content.length > 60 ? '...' : ''}`));
        console.log('');
    });

    console.log(chalk.dim(`  Total: ${entries.length} entries in last ${days} days`));
}

async function journalAnalyze() {
    const entries = getJournalEntries(30);

    if (entries.length < 3) {
        console.log(chalk.dim('  Need at least 3 journal entries for analysis. Keep writing!'));
        return;
    }

    const spinner = ora({ text: chalk.dim('AI analyzing journal patterns...'), color: 'cyan' }).start();

    const themes = entries.map(e => e.content.substring(0, 200)).join('\n---\n');
    let analysis = '';
    try {
        analysis = await analyzeJournal(themes, 'pattern-analysis');
        spinner.succeed(chalk.dim('Analysis complete'));
    } catch {
        spinner.info(chalk.dim('Analysis limited without AI'));
        analysis = `Found ${entries.length} entries across ${new Set(entries.map(e => e.type)).size} categories. Keep journaling to build richer patterns.`;
    }

    console.log('');
    console.log(createInfoBox('Journal Pattern Analysis', [
        chalk.dim(`  Entries analyzed: ${entries.length}`),
        chalk.dim(`  Time span: last 30 days`),
        '',
        chalk.hex('#45B7D1')(analysis),
    ].join('\n')));
}

export default { journalCommand };
