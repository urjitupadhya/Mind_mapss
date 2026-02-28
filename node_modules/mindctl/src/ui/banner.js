// ═══════════════════════════════════════════════════
// 🎨 mindctl — ASCII Banner & Welcome Screen
// ═══════════════════════════════════════════════════

import chalk from 'chalk';
import gradient from 'gradient-string';
import { getGamification } from '../db.js';
import { renderCompanion } from '../companion.js';
import { GRADIENTS, fancyDivider, formatDuration } from './theme.js';
import { LOGOS, WELLNESS_ART, DIVIDERS, renderGradientAscii } from './ascii.js';

export function showBanner(compact = false) {
    if (compact) {
        console.log(GRADIENTS.mindctl(LOGOS.mini));
        return;
    }

    console.log('');
    console.log(GRADIENTS.aurora(LOGOS.full));
    console.log('');
    console.log(chalk.dim('  Your Terminal Wellness OS — AI-powered mental health toolkit'));
    console.log(chalk.hex('#6C63FF')(DIVIDERS.stars));
    console.log('');

    // Show brain art
    console.log(renderGradientAscii(LOGOS.brain, ['#6C63FF', '#E040FB', '#FF4081']));
    console.log('');

    // Show companion
    try {
        console.log(renderCompanion());
    } catch {
        console.log('');
    }
}

export function showQuickHelp() {
    console.log(chalk.hex('#FFD93D').bold('  ╔════════════════════════════════════════╗'));
    console.log(chalk.hex('#FFD93D').bold('  ║        ⚡ QUICK COMMANDS ⚡            ║'));
    console.log(chalk.hex('#FFD93D').bold('  ╚════════════════════════════════════════╝'));
    console.log('');

    const groups = [
        {
            title: '🧠 CORE WELLNESS',
            color: '#4ECDC4',
            commands: [
                ['check-in', '🎭', 'Log your mood with AI insights'],
                ['breathe', '🫁', 'Guided breathing exercises'],
                ['meditate', '🧘', 'Meditation timer & guided sessions'],
                ['talk', '💬', 'AI therapy conversation'],
            ],
        },
        {
            title: '🔬 COGNITIVE TOOLS',
            color: '#E040FB',
            commands: [
                ['think', '🧠', 'CBT thought records & reframing'],
                ['journal', '📝', 'Therapeutic journaling (5 types)'],
                ['burnout', '🔥', 'Git-powered burnout detection'],
                ['stats', '📊', 'Wellness analytics dashboard'],
                ['forecast', '🌤️', 'Predictive mood forecast'],
                ['insights', '🔗', 'Behavioral correlations'],
                ['report', '📋', 'AI weekly wellness report'],
            ],
        },
        {
            title: '⚡ PRODUCTIVITY & GROWTH',
            color: '#FFD93D',
            commands: [
                ['ai-review', '🤖', 'Deep Meta-AI analysis of data'],
                ['focus', '🔥', 'Immersive Zen focus & Pomodoro'],
                ['flow', '🧬', 'AI Flow State & focus profiling'],
                ['quest', '🏆', 'Active AI wellness quest'],
            ],
        },
        {
            title: '🏋️ HEALTHY HABITS',
            color: '#6BCB77',
            commands: [
                ['habit', '🏆', 'Track healthy habits with streaks'],
                ['sleep', '💤', 'Sleep tracking & AI coaching'],
                ['water', '💧', 'Log water intake'],
                ['stretch', '💪', 'Guided desk stretches'],
            ],
        },
        {
            title: '🛡️  SAFETY & SYSTEM',
            color: '#FF8E53',
            commands: [
                ['crisis', '🚨', 'Crisis resources & safety plan'],
                ['eyes', '👁', '20-20-20 eye break'],
                ['daemon', '🛡️', 'Background wellness guardian'],
                ['config', '⚙️', 'Settings & API configuration'],
            ],
        },
    ];

    groups.forEach(group => {
        console.log(chalk.hex(group.color).bold(`  ┌─ ${group.title} ${'─'.repeat(30 - group.title.length)}─┐`));
        group.commands.forEach(([cmd, icon, desc]) => {
            console.log(`  │ ${chalk.hex(group.color).bold(`mindctl ${cmd.padEnd(12)}`)} ${icon}  ${chalk.dim(desc)}`);
        });
        console.log(chalk.hex(group.color)(`  └${'─'.repeat(39)}┘`));
        console.log('');
    });

    console.log(chalk.dim('  Run `mindctl <command> --help` for more options'));
    console.log(chalk.dim('  Run `mindctl config setup` to configure AI (MegaLLM)'));
    console.log('');
    console.log(chalk.hex('#6C63FF')(DIVIDERS.zen));
    console.log(chalk.hex('#9B89B3').italic('  "The mental health crisis won\'t wait. Neither will we."'));
    console.log('');
}

export function showVersion() {
    console.log('');
    console.log(GRADIENTS.mindctl(LOGOS.mini));
    console.log('');
    console.log(chalk.dim('  🧠 Your Terminal Wellness OS'));
    console.log(chalk.dim('  v1.0.0 — Built for MINDCODE 2026 Hackathon'));
    console.log(chalk.dim('  github.com/mindcode/mindctl'));
    console.log('');
}

export default { showBanner, showQuickHelp, showVersion };
