// ═══════════════════════════════════════════════════
// ⚙️ mindctl config — Configuration Management
// API keys, preferences, data management
// ═══════════════════════════════════════════════════

import inquirer from 'inquirer';
import chalk from 'chalk';
import { GRADIENTS, createSuccessBox, createInfoBox } from '../ui/theme.js';
import { setApiConfig, getApiConfig } from '../ai.js';
import { getGamification } from '../db.js';
import { renderCompanion } from '../companion.js';

export async function configCommand(subcommand) {
    switch (subcommand) {
        case 'set':
        case 'setup':
            return setupConfig();
        case 'show':
        case 'status':
            return showConfig();
        case 'companion':
            return configCompanion();
        default:
            return showConfig();
    }
}

async function setupConfig() {
    console.log('');
    console.log(GRADIENTS.calm('  ─── mindctl Configuration ───'));
    console.log('');

    const currentConfig = getApiConfig();

    const { apiUrl } = await inquirer.prompt([{
        type: 'input',
        name: 'apiUrl',
        message: chalk.hex('#4ECDC4')('MegaLLM API URL:'),
        default: currentConfig.apiUrl !== '(not set)' ? 'keep current' : 'https://api.megallm.com/v1/chat',
    }]);

    const { apiKey } = await inquirer.prompt([{
        type: 'password',
        name: 'apiKey',
        message: chalk.hex('#4ECDC4')('MegaLLM API Key:'),
        mask: '•',
    }]);

    const { model } = await inquirer.prompt([{
        type: 'input',
        name: 'model',
        message: chalk.hex('#4ECDC4')('Model name:'),
        default: 'megallm-2.5',
    }]);

    if (apiUrl !== 'keep current') setApiConfig(apiUrl, null, null);
    if (apiKey) setApiConfig(null, apiKey, null);
    if (model) setApiConfig(null, null, model);

    console.log('');
    console.log(createSuccessBox([
        chalk.hex('#4ECDC4').bold('  ✓ Configuration saved!'),
        '',
        chalk.dim('  AI features are now enabled.'),
        chalk.dim('  Try `mindctl talk` to chat with your AI companion.'),
    ].join('\n')));
    console.log('');
}

async function showConfig() {
    const config = getApiConfig();
    const gamification = getGamification();

    console.log('');
    console.log(GRADIENTS.calm('  ─── mindctl Status ───'));
    console.log('');

    console.log(chalk.bold('  🤖 AI Configuration'));
    console.log(`  API URL:  ${chalk.dim(config.apiUrl)}`);
    console.log(`  API Key:  ${chalk.dim(config.apiKey)}`);
    console.log(`  Model:    ${chalk.dim(config.model)}`);
    console.log('');

    console.log(chalk.bold('  🏆 Gamification'));
    console.log(`  Level:     ${chalk.hex('#FFD93D').bold(gamification.user_level)}`);
    console.log(`  XP:        ${gamification.user_xp}`);
    console.log(`  Streak:    ${gamification.current_streak} days 🔥`);
    console.log(`  Sessions:  ${gamification.total_sessions}`);
    console.log('');

    const achievements = JSON.parse(gamification.achievements || '[]');
    if (achievements.length > 0) {
        console.log(chalk.bold('  🏅 Achievements'));
        achievements.forEach(a => console.log(`  • ${a}`));
        console.log('');
    }

    console.log(chalk.bold('  📂 Data'));
    console.log(chalk.dim('  Location: ~/.mindctl/mindctl.db'));
    console.log(chalk.dim('  Export:   mindctl data export'));
    console.log(chalk.dim('  Delete:   mindctl data purge'));
    console.log('');
}

async function configCompanion() {
    console.log('');
    console.log(GRADIENTS.calm('  ─── Companion Settings ───'));

    console.log(renderCompanion());

    const { name } = await inquirer.prompt([{
        type: 'input',
        name: 'name',
        message: chalk.hex('#4ECDC4')('Rename your companion:'),
        default: 'Pixel',
    }]);

    // Update companion name in DB
    const { getDb } = await import('../db.js');
    const db = getDb();
    db.prepare('UPDATE gamification SET companion_name = ? WHERE id = 1').run(name);

    console.log('');
    console.log(chalk.hex('#4ECDC4').bold(`  ✓ Companion renamed to ${name}!`));
    console.log(renderCompanion());
}

export default { configCommand };
