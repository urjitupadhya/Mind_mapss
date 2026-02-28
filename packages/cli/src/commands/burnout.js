// ═══════════════════════════════════════════════════
// 🔥 mindctl burnout — Git-Powered Burnout Detection
// Analyze commit patterns for burnout risk indicators
// ═══════════════════════════════════════════════════

import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import { GRADIENTS, createInfoBox, createWarningBox, progressBar, sparkline, fancyDivider } from '../ui/theme.js';
import { saveBurnoutReport } from '../db.js';
import { analyzeBurnout } from '../ai.js';
import { showHeader, renderAscii, DIVIDERS } from '../ui/ascii.js';

export async function burnoutCommand(options = {}) {
    const repoPath = options.repo || '.';

    showHeader('burnout', '#FF8E53');
    console.log(chalk.dim('  Analyzing git history for burnout indicators...'));
    console.log('');

    const spinner = ora({ text: chalk.dim('Reading git history...'), color: 'yellow' }).start();

    let gitData;
    try {
        gitData = analyzeGitRepo(repoPath);
        spinner.succeed(chalk.dim(`Analyzed ${gitData.totalCommits} commits`));
    } catch (err) {
        spinner.fail(chalk.hex('#FF6B6B')('Could not analyze git repo'));
        console.log(chalk.dim(`  Error: ${err.message}`));
        console.log(chalk.dim('  Make sure you\'re in a git repository or pass --repo <path>'));
        return;
    }

    // Calculate burnout risk score
    const riskScore = calculateBurnoutRisk(gitData);

    // AI Analysis
    const spinner2 = ora({ text: chalk.dim('AI analyzing patterns...'), color: 'cyan' }).start();
    let aiAnalysis = '';
    try {
        aiAnalysis = await analyzeBurnout(gitData);
        spinner2.succeed(chalk.dim('Analysis complete'));
    } catch {
        spinner2.info(chalk.dim('Showing data analysis'));
    }

    // Display results
    displayBurnoutReport(gitData, riskScore, aiAnalysis);

    // Save report
    saveBurnoutReport(repoPath, riskScore.total, gitData, aiAnalysis);
}

function analyzeGitRepo(repoPath) {
    const cwd = repoPath === '.' ? process.cwd() : repoPath;

    // Get commits from last 30 days
    let log;
    try {
        log = execSync(
            'git log --format="%H|%ai|%s" --since="30 days ago" --no-merges',
            { cwd, encoding: 'utf8', timeout: 10000 }
        ).trim();
    } catch {
        throw new Error('Not a git repository or no commits found');
    }

    if (!log) throw new Error('No commits in the last 30 days');

    const commits = log.split('\n').filter(Boolean).map(line => {
        const [hash, dateStr, ...msgParts] = line.split('|');
        const date = new Date(dateStr);
        return {
            hash: hash.substring(0, 7),
            date,
            hour: date.getHours(),
            day: date.getDay(),
            dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
            dateStr: date.toISOString().split('T')[0],
            message: msgParts.join('|'),
            msgLength: msgParts.join('|').length,
        };
    });

    // Analysis
    const byHour = new Array(24).fill(0);
    const byDay = new Array(7).fill(0);
    const byDate = {};
    let lateNightCount = 0;
    let weekendCount = 0;
    let shortMsgCount = 0;
    const totalMsgLength = commits.reduce((s, c) => s + c.msgLength, 0);

    commits.forEach(c => {
        byHour[c.hour]++;
        byDay[c.day]++;
        byDate[c.dateStr] = (byDate[c.dateStr] || 0) + 1;

        if (c.hour >= 22 || c.hour < 5) lateNightCount++;
        if (c.day === 0 || c.day === 6) weekendCount++;
        if (c.msgLength < 15) shortMsgCount++;
    });

    // Detect patterns
    const dailyCounts = Object.values(byDate);
    const avgPerDay = dailyCounts.reduce((s, v) => s + v, 0) / (dailyCounts.length || 1);
    const maxInDay = Math.max(...dailyCounts, 0);
    const boomBust = detectBoomBust(dailyCounts);

    // Recent week distribution
    const recentWeek = commits
        .filter(c => c.date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .length;

    return {
        totalCommits: commits.length,
        commits,
        byHour,
        byDay,
        byDate,
        lateNightCount,
        lateNightPct: ((lateNightCount / commits.length) * 100).toFixed(1),
        weekendCount,
        weekendPct: ((weekendCount / commits.length) * 100).toFixed(1),
        shortMsgCount,
        shortMsgPct: ((shortMsgCount / commits.length) * 100).toFixed(1),
        avgMsgLength: Math.round(totalMsgLength / (commits.length || 1)),
        avgPerDay: avgPerDay.toFixed(1),
        maxInDay,
        boomBust,
        recentWeekCommits: recentWeek,
        daysActive: Object.keys(byDate).length,
    };
}

function detectBoomBust(dailyCounts) {
    if (dailyCounts.length < 5) return { detected: false };

    let patterns = 0;
    for (let i = 2; i < dailyCounts.length; i++) {
        const prev = dailyCounts[i - 2];
        const mid = dailyCounts[i - 1];
        const curr = dailyCounts[i];
        // Boom-bust: high → high → crash (or crash → boom)
        if (mid > avgVal(dailyCounts) * 1.5 && curr < avgVal(dailyCounts) * 0.5) patterns++;
        if (prev > avgVal(dailyCounts) * 1.5 && curr < avgVal(dailyCounts) * 0.5) patterns++;
    }

    return { detected: patterns >= 2, count: patterns };
}

function avgVal(arr) {
    return arr.reduce((s, v) => s + v, 0) / (arr.length || 1);
}

function calculateBurnoutRisk(data) {
    let score = 0;
    const flags = [];

    // Late night work (max 25 points)
    const lateNightPct = parseFloat(data.lateNightPct);
    if (lateNightPct > 50) { score += 25; flags.push('🚩 >50% of commits after 10PM'); }
    else if (lateNightPct > 30) { score += 18; flags.push('⚠️  >30% of commits after 10PM'); }
    else if (lateNightPct > 15) { score += 10; flags.push('📝 Some late-night coding'); }

    // Weekend work (max 20 points)
    const weekendPct = parseFloat(data.weekendPct);
    if (weekendPct > 40) { score += 20; flags.push('🚩 >40% of commits on weekends'); }
    else if (weekendPct > 20) { score += 12; flags.push('⚠️  Regular weekend work'); }
    else if (weekendPct > 10) { score += 5; flags.push('📝 Occasional weekend commits'); }

    // Commit message degradation (max 15 points)
    if (data.avgMsgLength < 10) { score += 15; flags.push('🚩 Very short commit messages (avg <10 chars)'); }
    else if (data.avgMsgLength < 20) { score += 8; flags.push('⚠️  Short commit messages'); }

    // Boom-bust cycles (max 20 points)
    if (data.boomBust.detected) { score += 20; flags.push('🚩 Boom-bust work cycles detected'); }

    // Intensity spikes (max 10 points)
    if (data.maxInDay > 15) { score += 10; flags.push('🚩 Extreme commit day (>15 in one day)'); }
    else if (data.maxInDay > 10) { score += 5; flags.push('⚠️  High-intensity days detected'); }

    // Consistency (max 10 points) — lack of rest days
    const activeDayRatio = data.daysActive / 30;
    if (activeDayRatio > 0.9) { score += 10; flags.push('🚩 Coding almost every day (no rest days)'); }
    else if (activeDayRatio > 0.75) { score += 5; flags.push('⚠️  Few rest days'); }

    return {
        total: Math.min(score, 100),
        flags,
        level: score >= 70 ? 'HIGH' : score >= 40 ? 'MODERATE' : score >= 20 ? 'LOW' : 'HEALTHY',
    };
}

function displayBurnoutReport(data, risk, aiAnalysis) {
    console.log('');

    // Risk level header
    let levelColor, levelEmoji;
    switch (risk.level) {
        case 'HIGH': levelColor = '#FF6B6B'; levelEmoji = '🔴'; break;
        case 'MODERATE': levelColor = '#FF8E53'; levelEmoji = '🟠'; break;
        case 'LOW': levelColor = '#FFD93D'; levelEmoji = '🟡'; break;
        default: levelColor = '#4ECDC4'; levelEmoji = '🟢'; break;
    }

    console.log(createInfoBox(`Burnout Risk Report`, [
        '',
        `  ${levelEmoji} Risk Level: ${chalk.hex(levelColor).bold(`${risk.level} (${risk.total}/100)`)}`,
        `  ${progressBar(risk.total, 100, 30, levelColor)}`,
        '',
        chalk.bold('  📊 Commit Patterns (30 days)'),
        `  Total commits:      ${chalk.bold(data.totalCommits)}`,
        `  Days active:        ${data.daysActive}/30`,
        `  Avg per day:        ${data.avgPerDay}`,
        `  Max in one day:     ${data.maxInDay}`,
        '',
        chalk.bold('  ⏰ Time Distribution'),
        `  Late night (10PM-5AM): ${chalk.hex(parseFloat(data.lateNightPct) > 30 ? '#FF6B6B' : '#4ECDC4')(data.lateNightPct + '%')}`,
        `  Weekend commits:       ${chalk.hex(parseFloat(data.weekendPct) > 30 ? '#FF6B6B' : '#4ECDC4')(data.weekendPct + '%')}`,
        '',
        chalk.bold('  📝 Message Quality'),
        `  Avg message length: ${data.avgMsgLength} chars`,
        `  Short messages:     ${data.shortMsgPct}%`,
        '',
    ].join('\n')));

    // Hourly distribution
    console.log(chalk.bold('  ⏰ Commit Hours'));
    const maxHour = Math.max(...data.byHour);
    for (let h = 0; h < 24; h++) {
        if (data.byHour[h] > 0) {
            const bar = progressBar(data.byHour[h], maxHour, 20,
                (h >= 22 || h < 5) ? '#FF6B6B' : (h >= 9 && h <= 17) ? '#4ECDC4' : '#FFD93D');
            console.log(`  ${String(h).padStart(2, '0')}:00 ${bar} ${data.byHour[h]}`);
        }
    }
    console.log('');

    // Daily sparkline
    const last14 = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        last14.push(data.byDate[dateStr] || 0);
    }
    console.log(`  14-day activity: ${sparkline(last14)}`);
    console.log('');

    // Red flags
    if (risk.flags.length > 0) {
        console.log(chalk.bold('  🚩 Risk Factors'));
        risk.flags.forEach(f => console.log(`  ${f}`));
        console.log('');
    }

    // AI Analysis
    if (aiAnalysis) {
        console.log(fancyDivider(50));
        console.log('');
        console.log(chalk.hex('#45B7D1').bold('  🤖 AI Burnout Analysis'));
        console.log('');
        const lines = aiAnalysis.split('\n');
        lines.forEach(l => console.log(chalk.hex('#45B7D1')(`  ${l}`)));
        console.log('');
    }
}

export default { burnoutCommand };
