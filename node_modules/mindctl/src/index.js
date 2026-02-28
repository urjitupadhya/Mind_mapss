// ═══════════════════════════════════════════════════
// 🧠 mindctl — Main CLI Entry Point
// Your Terminal Wellness OS
// ═══════════════════════════════════════════════════

import { Command } from 'commander';
import { showBanner, showQuickHelp, showVersion } from './ui/banner.js';
import { checkinCommand, moodHistoryCommand } from './commands/checkin.js';
import { breatheCommand } from './commands/breathe.js';
import { journalCommand } from './commands/journal.js';
import { thinkCommand } from './commands/think.js';
import { talkCommand } from './commands/talk.js';
import { burnoutCommand } from './commands/burnout.js';
import { statsCommand } from './commands/stats.js';
import { meditateCommand } from './commands/meditate.js';
import { crisisCommand } from './commands/crisis.js';
import { sleepCommand } from './commands/sleep.js';
import { habitCommand } from './commands/habit.js';
import { waterCommand, eyesCommand, stretchCommand, postureCommand, walkCommand } from './commands/wellness.js';
import { configCommand } from './commands/config.js';
import { daemonCommand } from './commands/daemon.js';
import { forecastCommand } from './commands/forecast.js';
import { insightsCommand } from './commands/insights.js';
import { reportCommand } from './commands/report.js';
import { focusCommand } from './commands/focus.js';
import { flowCommand } from './commands/flow.js';
import { questCommand } from './commands/quest.js';
import { aiReviewCommand } from './commands/aiReview.js';

const program = new Command();

program
    .name('mindctl')
    .description('🧠 Your Terminal Wellness OS — AI-powered mental health toolkit for developers')
    .version('1.0.0')
    .action(() => {
        showBanner();
        showQuickHelp();
    });

// ─── Mood Check-in ────────────────────────────────
program
    .command('check-in')
    .alias('checkin')
    .alias('mood')
    .description('🎭 Smart mood check-in with AI insights')
    .action(() => checkinCommand());

program
    .command('mood-history')
    .description('🎭 View mood history')
    .option('-d, --days <n>', 'Number of days', '7')
    .action((opts) => moodHistoryCommand({ days: parseInt(opts.days) }));

// ─── Breathing ────────────────────────────────────
program
    .command('breathe')
    .alias('breath')
    .description('🫁 Guided breathing exercises')
    .option('-t, --type <type>', 'Technique: box, 478, calm, panic, energize, sleep')
    .option('-r, --rounds <n>', 'Number of rounds', '4')
    .action((opts) => breatheCommand(opts));

// ─── Journal ──────────────────────────────────────
const journalCmd = program
    .command('journal')
    .description('📝 Therapeutic journaling system');

journalCmd
    .command('write')
    .description('Write a freeform journal entry')
    .action(() => journalCommand('write'));

journalCmd
    .command('prompt')
    .description('Write with a therapeutic prompt')
    .action(() => journalCommand('prompt'));

journalCmd
    .command('gratitude')
    .description('Gratitude practice (3 things)')
    .action(() => journalCommand('gratitude'));

journalCmd
    .command('dream')
    .description('Dream journal with AI analysis')
    .action(() => journalCommand('dream'));

journalCmd
    .command('history')
    .alias('review')
    .description('Review past entries')
    .option('-d, --days <n>', 'Number of days', '14')
    .action((opts) => journalCommand('history', { days: parseInt(opts.days) }));

journalCmd
    .command('analyze')
    .description('AI pattern analysis of your journal')
    .action(() => journalCommand('analyze'));

journalCmd.action(() => journalCommand('write'));

// ─── CBT Think ────────────────────────────────────
const thinkCmd = program
    .command('think')
    .description('🧠 CBT thought records & cognitive reframing');

thinkCmd
    .command('record')
    .description('Full CBT thought record')
    .action(() => thinkCommand('record'));

thinkCmd
    .command('reframe')
    .description('Quick negative thought reframing')
    .action(() => thinkCommand('reframe'));

thinkCmd
    .command('history')
    .description('View past thought records')
    .option('-d, --days <n>', 'Number of days', '30')
    .action((opts) => thinkCommand('history', { days: parseInt(opts.days) }));

thinkCmd.action(() => thinkCommand('record'));

// ─── AI Talk ──────────────────────────────────────
const talkCmd = program
    .command('talk')
    .alias('chat')
    .description('💬 AI therapy conversation');

talkCmd
    .command('open')
    .description('Open-ended therapy chat')
    .action(() => talkCommand('open'));

talkCmd
    .command('vent')
    .description('Safe venting space')
    .action(() => talkCommand('vent'));

talkCmd
    .command('socratic')
    .description('Socratic questioning mode')
    .action(() => talkCommand('socratic'));

talkCmd
    .command('wisdom')
    .description('Get an AI wisdom quote')
    .action(() => talkCommand('wisdom'));

talkCmd
    .command('challenge')
    .description('Get today\'s wellness challenge')
    .action(() => talkCommand('challenge'));

talkCmd.action(() => talkCommand('open'));

// ─── Burnout ──────────────────────────────────────
program
    .command('burnout')
    .description('🔥 Git-powered burnout risk analysis')
    .option('-r, --repo <path>', 'Repository path', '.')
    .action((opts) => burnoutCommand(opts));

// ─── Stats ────────────────────────────────────────
const statsCmd = program
    .command('stats')
    .alias('dashboard')
    .description('📊 Wellness analytics dashboard');

statsCmd
    .command('today')
    .description('Today\'s wellness snapshot')
    .action(() => statsCommand('today'));

statsCmd
    .command('week')
    .description('Weekly dashboard')
    .action(() => statsCommand('week'));

statsCmd
    .command('month')
    .description('Monthly overview with calendar')
    .action(() => statsCommand('month'));

statsCmd
    .command('report')
    .description('AI-generated weekly wellness report')
    .action(() => statsCommand('report'));

statsCmd.action(() => statsCommand('today'));

// ─── Meditation ───────────────────────────────────
const meditateCmd = program
    .command('meditate')
    .alias('meditation')
    .description('🧘 Meditation timer & guided sessions');

meditateCmd
    .command('timer')
    .description('Simple meditation timer with mandala')
    .action(() => meditateCommand('timer'));

meditateCmd
    .command('guided')
    .description('AI-generated guided meditation')
    .action(() => meditateCommand('guided'));

meditateCmd
    .command('ground')
    .alias('grounding')
    .description('5-4-3-2-1 grounding exercise')
    .action(() => meditateCommand('ground'));

meditateCmd.action(() => meditateCommand('timer'));

// ─── Crisis ───────────────────────────────────────
const crisisCmd = program
    .command('crisis')
    .alias('sos')
    .description('🚨 Crisis resources & safety plan');

crisisCmd
    .command('help')
    .description('View crisis helplines')
    .action(() => crisisCommand('help'));

crisisCmd
    .command('plan')
    .description('View/create safety plan')
    .action(() => crisisCommand('plan'));

crisisCmd
    .command('ground')
    .description('Quick 30-second grounding')
    .action(() => crisisCommand('ground'));

crisisCmd
    .command('breathe')
    .description('Crisis breathing technique')
    .action(() => crisisCommand('breathe'));

crisisCmd.action(() => crisisCommand('help'));

// ─── Sleep ────────────────────────────────────────
const sleepCmd = program
    .command('sleep')
    .description('💤 Sleep tracking & hygiene');

sleepCmd
    .command('log')
    .description('Log last night\'s sleep')
    .action(() => sleepCommand('log'));

sleepCmd
    .command('history')
    .description('Sleep history & trends')
    .option('-d, --days <n>', 'Number of days', '14')
    .action((opts) => sleepCommand('history', { days: parseInt(opts.days) }));

sleepCmd
    .command('tips')
    .description('Evidence-based sleep tips')
    .action(() => sleepCommand('tips'));

sleepCmd.action(() => sleepCommand('log'));

// ─── Habits ───────────────────────────────────────
const habitCmd = program
    .command('habit')
    .alias('habits')
    .description('🏆 Habit tracking with streaks');

habitCmd
    .command('add')
    .description('Create a new habit')
    .action(() => habitCommand('add'));

habitCmd
    .command('check')
    .alias('done')
    .description('Check off today\'s habits')
    .action(() => habitCommand('check'));

habitCmd
    .command('list')
    .alias('status')
    .description('View all habits & streaks')
    .action(() => habitCommand('list'));

habitCmd
    .command('suggest')
    .description('AI-suggested healthy habit')
    .action(() => habitCommand('suggest'));

habitCmd.action(() => habitCommand('list'));

// ─── Physical Wellness ────────────────────────────
program
    .command('water')
    .description('💧 Log water intake')
    .action(() => waterCommand());

program
    .command('eyes')
    .alias('eye')
    .description('👁 20-20-20 eye break')
    .action(() => eyesCommand());

program
    .command('stretch')
    .description('💪 Guided desk stretches')
    .action(() => stretchCommand());

program
    .command('posture')
    .description('🧍 Posture check reminder')
    .action(() => postureCommand());

program
    .command('walk')
    .description('🚶 Walk timer')
    .action(() => walkCommand());

// ─── Daemon ───────────────────────────────────────
const daemonCmd = program
    .command('daemon')
    .alias('guardian')
    .description('🛡️ Background wellness guardian');

daemonCmd
    .command('start')
    .description('Start the background guardian')
    .action(() => daemonCommand('start'));

daemonCmd
    .command('stop')
    .description('Stop the guardian')
    .action(() => daemonCommand('stop'));

daemonCmd
    .command('status')
    .description('Check guardian status')
    .action(() => daemonCommand('status'));

daemonCmd.action(() => daemonCommand('start'));

// ─── Config ───────────────────────────────────────
const configCmd = program
    .command('config')
    .description('⚙️ Settings & configuration');

configCmd
    .command('setup')
    .description('Configure MegaLLM API')
    .action(() => configCommand('setup'));

configCmd
    .command('show')
    .alias('status')
    .description('Show current configuration')
    .action(() => configCommand('show'));

configCmd
    .command('companion')
    .description('Customize your companion')
    .action(() => configCommand('companion'));

configCmd.action(() => configCommand('show'));

// ─── Forecast ─────────────────────────────────────
program
    .command('forecast')
    .alias('predict')
    .description('🌤️ Predictive mood forecast for tomorrow')
    .action(() => forecastCommand());

// ─── Insights ─────────────────────────────────────
program
    .command('insights')
    .alias('correlations')
    .description('🔗 Behavioral correlation analysis')
    .action(() => insightsCommand());

// ─── Report ───────────────────────────────────────
program
    .command('report')
    .alias('weekly')
    .description('📋 AI-generated weekly wellness report')
    .action(() => reportCommand());

// ─── Productivity & Quests ────────────────────────
program
    .command('focus')
    .description('🔥 Immersive Zen focus session & Pomodoro')
    .argument('[minutes]', 'Session duration in minutes', '25')
    .action((mins) => focusCommand(parseInt(mins)));

program
    .command('flow')
    .description('🧬 AI Flow State analysis & focus profiling')
    .action(() => flowCommand());

program
    .command('quest')
    .alias('quests')
    .description('🏆 Active AI wellness quest & progress')
    .action(() => questCommand());

// ─── AI Meta Analysis ─────────────────────────────
program
    .command('ai-review')
    .alias('analyze')
    .description('🤖 AI-driven architectural meta-review of your data')
    .action(() => aiReviewCommand());

// ─── Parse & Run ──────────────────────────────────
program.parse();
