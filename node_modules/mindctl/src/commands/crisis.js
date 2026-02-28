// ═══════════════════════════════════════════════════
// 🚨 mindctl crisis — Crisis Support & Safety
// Instant helplines, safety plan, grounding
// ═══════════════════════════════════════════════════

import inquirer from 'inquirer';
import chalk from 'chalk';
import { GRADIENTS, createInfoBox, createWarningBox } from '../ui/theme.js';
import { getSafetyPlan, saveSafetyPlan } from '../db.js';
import { getCrisisResources } from '../ai.js';
import { showHeader, renderAscii, WELLNESS_ART, DIVIDERS } from '../ui/ascii.js';

const HELPLINES = {
    global: [
        { name: 'Find A Helpline (Global)', number: 'findahelpline.com', url: 'https://findahelpline.com/' },
        { name: 'Crisis Text Line', number: 'Text HOME to 741741', region: 'US/UK/CA' },
    ],
    us: [
        { name: '988 Suicide & Crisis Lifeline', number: '988', note: 'Call or text' },
        { name: 'SAMHSA Helpline', number: '1-800-662-4357', note: 'Free, 24/7' },
        { name: 'Trevor Project (LGBTQ+)', number: '1-866-488-7386', note: 'Free, 24/7' },
        { name: 'Veterans Crisis Line', number: '988 press 1', note: 'Free, 24/7' },
    ],
    uk: [
        { name: 'Samaritans', number: '116 123', note: 'Free, 24/7' },
        { name: 'CALM (Men)', number: '0800 58 58 58', note: '5pm-midnight' },
        { name: 'Childline', number: '0800 1111', note: 'Under 19s' },
    ],
    india: [
        { name: 'Vandrevala Foundation', number: '1860-2662-345', note: '24/7' },
        { name: 'iCall', number: '9152987821', note: 'Mon-Sat 8am-10pm' },
        { name: 'AASRA', number: '91-22-27546669', note: '24/7' },
    ],
    australia: [
        { name: 'Lifeline', number: '13 11 14', note: '24/7' },
        { name: 'Beyond Blue', number: '1300 22 4636', note: '24/7' },
    ],
    canada: [
        { name: 'Crisis Services Canada', number: '1-833-456-4566', note: '24/7' },
        { name: 'Kids Help Phone', number: '1-800-668-6868', note: 'Under 20s' },
    ],
};

export async function crisisCommand(subcommand) {
    switch (subcommand) {
        case 'plan':
            return safetyPlanCommand();
        case 'ground':
            return quickGround();
        case 'breathe':
            return crisisBreathing();
        default:
            return showCrisisResources();
    }
}

async function showCrisisResources() {
    showHeader('crisis', '#FF6B6B');
    console.log('');
    console.log(renderAscii(WELLNESS_ART.heart, '#FF6B6B'));
    console.log('');
    console.log(chalk.hex('#FF6B6B').bold('  If you are in immediate danger, call emergency services (911/999/112)'));
    console.log('');

    // Display helplines by region
    for (const [region, lines] of Object.entries(HELPLINES)) {
        const regionLabel = {
            global: '🌍 Global', us: '🇺🇸 United States', uk: '🇬🇧 United Kingdom',
            india: '🇮🇳 India', australia: '🇦🇺 Australia', canada: '🇨🇦 Canada',
        }[region] || region;

        console.log(chalk.hex('#45B7D1').bold(`  ${regionLabel}`));
        lines.forEach(l => {
            console.log(`  ${chalk.bold(l.name)}: ${chalk.hex('#4ECDC4').bold(l.number)} ${l.note ? chalk.dim(`(${l.note})`) : ''}`);
        });
        console.log('');
    }

    console.log(chalk.hex('#4ECDC4')('  Quick actions:'));
    console.log(chalk.dim('  • mindctl crisis ground    — Immediate grounding exercise'));
    console.log(chalk.dim('  • mindctl crisis breathe   — Crisis breathing technique'));
    console.log(chalk.dim('  • mindctl crisis plan      — View/create your safety plan'));
    console.log(chalk.dim('  • mindctl breathe --type panic  — Anti-panic breathing'));
    console.log('');
    console.log(chalk.hex('#FFD93D')('  💙 You matter. This moment will pass. Help is available.'));
    console.log('');
}

async function safetyPlanCommand() {
    const existing = getSafetyPlan();

    console.log('');
    console.log(GRADIENTS.calm('  ─── Safety Plan ───'));
    console.log(chalk.dim('  A personal plan for difficult moments.'));
    console.log('');

    if (existing) {
        console.log(chalk.hex('#4ECDC4').bold('  Your Current Safety Plan:'));
        console.log('');
        if (existing.warning_signs) {
            console.log(chalk.bold('  ⚠️  Warning Signs'));
            console.log(chalk.dim(`  ${existing.warning_signs}`));
            console.log('');
        }
        if (existing.coping_strategies) {
            console.log(chalk.bold('  🛡️  Coping Strategies'));
            console.log(chalk.dim(`  ${existing.coping_strategies}`));
            console.log('');
        }
        if (existing.reasons_to_live) {
            console.log(chalk.bold('  💛  Reasons to Live'));
            console.log(chalk.dim(`  ${existing.reasons_to_live}`));
            console.log('');
        }
        if (existing.people_to_contact) {
            console.log(chalk.bold('  📞  People to Contact'));
            console.log(chalk.dim(`  ${existing.people_to_contact}`));
            console.log('');
        }
        if (existing.professional_contacts) {
            console.log(chalk.bold('  🏥  Professional Contacts'));
            console.log(chalk.dim(`  ${existing.professional_contacts}`));
            console.log('');
        }

        const { update } = await inquirer.prompt([{
            type: 'confirm',
            name: 'update',
            message: 'Would you like to update your safety plan?',
            default: false,
        }]);

        if (!update) return;
    }

    console.log(chalk.dim('  Fill in what feels right. You can skip any section.\n'));

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'warningSigns',
            message: chalk.hex('#FFD93D')('⚠️  Warning signs (thoughts, feelings, situations):'),
            default: existing?.warning_signs || '',
        },
        {
            type: 'input',
            name: 'copingStrategies',
            message: chalk.hex('#4ECDC4')('🛡️  Coping strategies (things that help):'),
            default: existing?.coping_strategies || '',
        },
        {
            type: 'input',
            name: 'reasonsToLive',
            message: chalk.hex('#FFD700')('💛  Reasons to keep going:'),
            default: existing?.reasons_to_live || '',
        },
        {
            type: 'input',
            name: 'peopleToContact',
            message: chalk.hex('#45B7D1')('📞  People I can reach out to:'),
            default: existing?.people_to_contact || '',
        },
        {
            type: 'input',
            name: 'professionalContacts',
            message: chalk.hex('#6C63FF')('🏥  Professional contacts (therapist, doctor):'),
            default: existing?.professional_contacts || '',
        },
        {
            type: 'input',
            name: 'safeEnvironment',
            message: chalk.hex('#96CEB4')('🏠  How to make my environment safe:'),
            default: existing?.safe_environment || '',
        },
    ]);

    saveSafetyPlan(answers);
    console.log('');
    console.log(chalk.hex('#4ECDC4').bold('  ✓ Safety plan saved securely.'));
    console.log(chalk.dim('  Access anytime with `mindctl crisis plan`'));
    console.log('');
}

async function quickGround() {
    console.log('');
    console.log(chalk.hex('#4ECDC4').bold('  🌍 Quick Grounding — 30 seconds'));
    console.log('');

    const steps = [
        { text: 'Press your feet firmly into the floor.', delay: 4000 },
        { text: 'Feel the weight of your body in your chair.', delay: 4000 },
        { text: 'Take a slow, deep breath in... 2... 3... 4...', delay: 5000 },
        { text: 'Now let it out slowly... 2... 3... 4... 5... 6...', delay: 7000 },
        { text: 'Look around. Name one thing you can see.', delay: 4000 },
        { text: 'Name one thing you can hear.', delay: 3000 },
        { text: 'You are here. You are safe. This moment will pass.', delay: 5000 },
    ];

    for (const step of steps) {
        console.log(chalk.hex('#4ECDC4')(`  → ${step.text}`));
        await new Promise(r => setTimeout(r, step.delay));
    }

    console.log('');
    console.log(chalk.hex('#4ECDC4').bold('  ✓ You did it. You\'re still here. That\'s strength. 💙'));
    console.log('');
}

async function crisisBreathing() {
    console.log('');
    console.log(chalk.hex('#4ECDC4').bold('  🫁 Crisis Breathing — Extended Exhale'));
    console.log(chalk.dim('  Short inhale → long exhale activates your calming system.'));
    console.log('');

    process.stdout.write('\x1B[?25l');

    for (let round = 0; round < 5; round++) {
        // Inhale 3s
        for (let i = 0; i < 30; i++) {
            const bar = '█'.repeat(Math.floor((i / 30) * 20)) + '░'.repeat(20 - Math.floor((i / 30) * 20));
            process.stdout.write(`\r  ${chalk.hex('#4ECDC4')('BREATHE IN')}  [${chalk.hex('#4ECDC4')(bar)}]  ${((30 - i) / 10).toFixed(1)}s `);
            await new Promise(r => setTimeout(r, 100));
        }

        // Exhale 6s
        for (let i = 0; i < 60; i++) {
            const bar = '█'.repeat(20 - Math.floor((i / 60) * 20)) + '░'.repeat(Math.floor((i / 60) * 20));
            process.stdout.write(`\r  ${chalk.hex('#6C63FF')('BREATHE OUT')} [${chalk.hex('#6C63FF')(bar)}]  ${((60 - i) / 10).toFixed(1)}s`);
            await new Promise(r => setTimeout(r, 100));
        }

        process.stdout.write(`\r  ${chalk.dim(`Round ${round + 1}/5 complete`)}                                    \n`);
    }

    process.stdout.write('\x1B[?25h');
    console.log('');
    console.log(chalk.hex('#4ECDC4').bold('  ✓ Well done. Your nervous system is calming. 💙'));
    console.log('');
}

export default { crisisCommand };
