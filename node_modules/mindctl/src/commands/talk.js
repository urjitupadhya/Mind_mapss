// ═══════════════════════════════════════════════════
// 💬 mindctl talk — AI Therapy Conversation
// Safe, guided conversations using therapeutic techniques
// ═══════════════════════════════════════════════════

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import crypto from 'crypto';
import { GRADIENTS, createInfoBox, fancyDivider } from '../ui/theme.js';
import { addConversation, getConversationHistory } from '../db.js';
import { therapyChat, checkForCrisisSignals, getCrisisResources, getWisdom, getDailyChallenge } from '../ai.js';
import { typewriter } from '../ui/animations.js';
import { showHeader, renderAscii, WELLNESS_ART, DIVIDERS } from '../ui/ascii.js';

export async function talkCommand(subcommand, options = {}) {
    switch (subcommand) {
        case 'vent':
            return ventMode();
        case 'socratic':
            return socraticMode();
        case 'wisdom':
            return wisdomCommand();
        case 'challenge':
            return challengeCommand();
        default:
            return therapySession();
    }
}

async function therapySession() {
    const sessionId = crypto.randomUUID();
    const history = [];

    showHeader('talk', '#45B7D1');
    console.log('');
    console.log(chalk.dim('  A safe space to talk. I\'m here to listen and support.'));
    console.log(chalk.dim('  Using evidence-based therapeutic techniques.'));
    console.log(chalk.dim('  Type "exit" or "bye" to end the session.'));
    console.log(chalk.hex('#FF8E53').dim('  ⚠ I\'m not a replacement for professional therapy.'));
    console.log('');
    console.log(fancyDivider(50));
    console.log('');

    // Opening
    const openingMsg = "Hi there. I'm glad you're here. How are you doing today — really doing, not the polite answer?";
    console.log(chalk.hex('#4ECDC4')(`  🤖 ${openingMsg}`));
    console.log('');
    history.push({ role: 'assistant', content: openingMsg });
    addConversation(sessionId, 'assistant', openingMsg, 'therapy');

    // Chat loop
    let turnCount = 0;
    while (true) {
        const { userMessage } = await inquirer.prompt([{
            type: 'input',
            name: 'userMessage',
            message: chalk.hex('#6C63FF')('  You:'),
            validate: v => v.length > 0 || 'Say something...',
        }]);

        // Exit check
        if (['exit', 'bye', 'quit', 'done', 'end', 'goodbye'].includes(userMessage.toLowerCase().trim())) {
            console.log('');
            console.log(chalk.hex('#4ECDC4')('  🤖 Thank you for sharing with me today. Remember — reaching out'));
            console.log(chalk.hex('#4ECDC4')('     is strength, not weakness. Take care of yourself. 💙'));
            console.log('');
            addConversation(sessionId, 'user', userMessage, 'therapy');

            // Session summary
            console.log(chalk.dim(`  Session: ${turnCount} exchanges • ID: ${sessionId.slice(0, 8)}`));
            console.log('');
            break;
        }

        // Crisis check
        if (checkForCrisisSignals(userMessage)) {
            console.log('');
            console.log(chalk.hex('#FF6B6B').bold(getCrisisResources()));
            console.log('');
        }

        // Save user message
        history.push({ role: 'user', content: userMessage });
        addConversation(sessionId, 'user', userMessage, 'therapy');

        // Get AI response
        const spinner = ora({ text: '', color: 'cyan' }).start();

        try {
            const response = await therapyChat(userMessage, history);
            spinner.stop();

            console.log('');
            // Word-wrap the response
            const wrapped = wordWrap(response, 55);
            wrapped.forEach(line => {
                console.log(chalk.hex('#4ECDC4')(`  🤖 ${line}`));
            });
            console.log('');

            history.push({ role: 'assistant', content: response });
            addConversation(sessionId, 'assistant', response, 'therapy');
        } catch {
            spinner.stop();
            console.log(chalk.hex('#4ECDC4')('  🤖 I\'m having trouble connecting right now, but I\'m still listening.'));
            console.log(chalk.hex('#4ECDC4')('     What you\'re sharing matters. Please continue.'));
            console.log('');
        }

        turnCount++;
    }
}

async function ventMode() {
    const sessionId = crypto.randomUUID();
    console.log('');
    console.log(GRADIENTS.fire('  ─── Safe Venting Space ───'));
    console.log('');
    console.log(chalk.dim('  Let it out. No judgment. I\'m just here to hold space.'));
    console.log(chalk.dim('  Type as much as you need. Type "done" when finished.'));
    console.log('');

    const messages = [];

    while (true) {
        const { msg } = await inquirer.prompt([{
            type: 'input',
            name: 'msg',
            message: chalk.hex('#FF6B6B')('  💨'),
        }]);

        if (msg.toLowerCase().trim() === 'done') break;

        if (checkForCrisisSignals(msg)) {
            console.log(chalk.hex('#FF6B6B').bold(getCrisisResources()));
        }

        messages.push(msg);
        addConversation(sessionId, 'user', msg, 'vent');
    }

    if (messages.length > 0) {
        console.log('');
        const spinner = ora({ text: chalk.dim('AI reflecting on what you shared...'), color: 'cyan' }).start();

        try {
            const fullVent = messages.join('\n');
            const response = await therapyChat(
                `The user just vented the following. Please validate their feelings, acknowledge their experience, and offer one gentle reflection. Don't try to fix everything:\n\n${fullVent}`,
                []
            );
            spinner.stop();

            console.log('');
            console.log(chalk.hex('#4ECDC4')(`  🤖 ${response}`));
        } catch {
            spinner.stop();
            console.log(chalk.hex('#4ECDC4')('  🤖 Thank you for letting that out. Getting it out of your head'));
            console.log(chalk.hex('#4ECDC4')('     and into words is itself a form of processing.'));
        }
        console.log('');
        console.log(chalk.dim(`  Released ${messages.length} thoughts. That takes courage. 💙`));
    }
}

async function socraticMode() {
    const sessionId = crypto.randomUUID();
    console.log('');
    console.log(GRADIENTS.info('  ─── Socratic Questioning ───'));
    console.log('');
    console.log(chalk.dim('  I\'ll ask questions to help you think through a problem.'));
    console.log(chalk.dim('  No advice — just questions that illuminate.'));
    console.log('');

    const { topic } = await inquirer.prompt([{
        type: 'input',
        name: 'topic',
        message: chalk.hex('#4ECDC4')('What would you like to think through?'),
    }]);

    const history = [];
    const systemOverride = `You are a Socratic questioner. Your ONLY tool is questions.
Given the user's topic, ask ONE thoughtful question at a time that helps them examine their assumptions,
explore alternatives, or deepen their understanding. Never give advice or opinions.
Start by understanding their perspective, then gently probe deeper.`;

    const initialQ = await therapyChat(
        `The user wants to think through: "${topic}". Ask your first Socratic question.`,
        [{ role: 'system', content: systemOverride }]
    );

    console.log('');
    console.log(chalk.hex('#45B7D1')(`  🔍 ${initialQ}`));
    console.log('');
    history.push({ role: 'assistant', content: initialQ });

    let rounds = 0;
    while (rounds < 8) {
        const { answer } = await inquirer.prompt([{
            type: 'input',
            name: 'answer',
            message: chalk.hex('#6C63FF')('  Your reflection:'),
        }]);

        if (['done', 'exit', 'stop'].includes(answer.toLowerCase().trim())) break;

        history.push({ role: 'user', content: answer });

        const spinner = ora({ text: '', color: 'cyan' }).start();
        const nextQ = await therapyChat(answer, [
            { role: 'system', content: systemOverride },
            ...history,
        ]);
        spinner.stop();

        console.log('');
        console.log(chalk.hex('#45B7D1')(`  🔍 ${nextQ}`));
        console.log('');

        history.push({ role: 'assistant', content: nextQ });
        rounds++;
    }

    console.log(chalk.dim('  Great exploration. Sometimes the right questions matter more than answers.'));
    console.log('');
}

async function wisdomCommand() {
    console.log('');
    const spinner = ora({ text: chalk.dim('Finding wisdom...'), color: 'yellow' }).start();

    try {
        const wisdom = await getWisdom();
        spinner.stop();
        console.log('');
        console.log(chalk.hex('#FFD93D').bold(`  ✦ ${wisdom}`));
    } catch {
        spinner.stop();
        console.log('');
        console.log(chalk.hex('#FFD93D').bold('  ✦ "The only way out is through." — Robert Frost'));
    }
    console.log('');
}

async function challengeCommand() {
    console.log('');
    const spinner = ora({ text: chalk.dim('Generating today\'s challenge...'), color: 'cyan' }).start();

    try {
        const challenge = await getDailyChallenge();
        spinner.stop();
        console.log('');
        console.log(createInfoBox('🎯 Today\'s Wellness Challenge', chalk.hex('#4ECDC4')(challenge)));
    } catch {
        spinner.stop();
        console.log('');
        console.log(createInfoBox('🎯 Today\'s Challenge',
            chalk.hex('#4ECDC4')('Take 3 minutes to write down 3 things you\'re grateful for right now.')));
    }
    console.log('');
}

// Helper
function wordWrap(text, width) {
    const words = text.split(' ');
    const lines = [];
    let current = '';

    words.forEach(word => {
        if ((current + ' ' + word).trim().length > width) {
            lines.push(current.trim());
            current = word;
        } else {
            current += ' ' + word;
        }
    });
    if (current.trim()) lines.push(current.trim());
    return lines;
}

export default { talkCommand };
