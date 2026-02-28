// ═══════════════════════════════════════════════════
// 🐱 mindctl — Pixel, Your Terminal Companion
// An ASCII pet that reacts to your wellness journey
// ═══════════════════════════════════════════════════

import chalk from 'chalk';
import { getGamification } from './db.js';
import { COMPANION_ART } from './ui/ascii.js';

// ─── Companion Stages ─────────────────────────────
const STAGES = {
    egg: {
        name: 'Egg',
        minLevel: 1,
        emoji: '🥚',
        art: COMPANION_ART.egg,
    },
    kitten: {
        name: 'Kitten',
        minLevel: 5,
        emoji: '🐱',
        art: COMPANION_ART.kitten,
    },
    cat: {
        name: 'Cat',
        minLevel: 15,
        emoji: '😸',
        art: COMPANION_ART.cat,
    },
    lion: {
        name: 'Lion',
        minLevel: 30,
        emoji: '🦁',
        art: COMPANION_ART.lion,
    },
    dragon: {
        name: 'Dragon',
        minLevel: 50,
        emoji: '🐉',
        art: COMPANION_ART.dragon,
    },
};

// ─── Get Current Stage ────────────────────────────
function getCurrentStage(level) {
    if (level >= 50) return STAGES.dragon;
    if (level >= 30) return STAGES.lion;
    if (level >= 15) return STAGES.cat;
    if (level >= 5) return STAGES.kitten;
    return STAGES.egg;
}

// ─── Determine Mood ───────────────────────────────
function determineMood(gamification) {
    const lastActivity = gamification.last_activity;
    if (!lastActivity) return 'neutral';

    const hoursSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);

    if (hoursSinceActivity > 48) return 'sad';
    if (hoursSinceActivity > 24) return 'worried';
    if (gamification.current_streak >= 7) return 'excited';
    if (gamification.current_streak >= 3) return 'happy';
    return 'neutral';
}

// ─── Messages ─────────────────────────────────────
const MESSAGES = {
    happy: [
        "Great to see you! You're on a roll! 🌟",
        "Your wellness journey is looking amazing!",
        "Love seeing you take care of yourself! ♥",
        "You're doing incredible. Keep going!",
        "Every check-in counts. Proud of you!",
    ],
    neutral: [
        "Hey there! Ready for some self-care?",
        "Welcome back. What shall we work on today?",
        "Good to see you. Let's do something nice for your mind.",
        "Hey! Your terminal companion is here for you.",
    ],
    sad: [
        "I've missed you... it's been a while 💙",
        "Hey, I'm still here for you. No judgment.",
        "Welcome back. Even showing up is progress.",
        "It's okay to have breaks. I'm glad you're here now.",
    ],
    worried: [
        "Hey! Haven't seen you in a bit. How are you doing?",
        "I was wondering about you. Everything okay?",
        "Welcome back. Want to do a quick check-in?",
    ],
    excited: [
        "AMAZING STREAK! You're unstoppable! 🔥🔥🔥",
        "Look at you go! Wellness warrior mode: ON! ★",
        "Your consistency is inspiring! Keep it up! 🏆",
        "What a streak! You should be proud! ✨",
    ],
};

// ─── Get Random Message ───────────────────────────
function getRandomMessage(mood) {
    const msgs = MESSAGES[mood] || MESSAGES.neutral;
    return msgs[Math.floor(Math.random() * msgs.length)];
}

// ─── Render Companion ─────────────────────────────
export function renderCompanion(options = {}) {
    let gamification;
    try {
        gamification = getGamification();
    } catch {
        gamification = {
            user_level: 1,
            user_xp: 0,
            current_streak: 0,
            companion_name: 'Pixel',
            last_activity: null,
        };
    }

    const level = gamification.user_level || 1;
    const stage = getCurrentStage(level);
    const mood = options.mood || determineMood(gamification);
    const art = stage.art[mood] || stage.art.happy || stage.art.neutral || Object.values(stage.art)[0];
    const name = gamification.companion_name || 'Pixel';
    const message = options.message || getRandomMessage(mood);

    const xpForNext = level * 100;
    const xpProgress = gamification.user_xp % 100;
    const xpBar = '█'.repeat(Math.floor(xpProgress / 5)) + '░'.repeat(20 - Math.floor(xpProgress / 5));

    const color = getMoodColor(mood);

    const lines = [
        '',
        ...art.map(l => chalk.hex(color)(l)),
        '',
        chalk.hex(color).bold(`  ${stage.emoji} ${name}`) + chalk.dim(` (${stage.name})`),
        chalk.dim(`  Lv ${level} • ${gamification.user_xp} XP`),
        chalk.dim(`  [${chalk.hex('#4ECDC4')(xpBar)}]`),
        gamification.current_streak > 0
            ? chalk.hex('#FFD93D')(`  🔥 ${gamification.current_streak} day streak`)
            : '',
        '',
        chalk.hex(color)(`  "${message}"`),
        '',
    ].filter(Boolean);

    return lines.join('\n');
}

// ─── Companion Reactions ──────────────────────────
export function getCompanionReaction(event) {
    const reactions = {
        checkin: {
            art: 'excited',
            message: "Thanks for checking in! I love knowing how you're feeling! +10 XP ✨",
        },
        breathing: {
            art: 'happy',
            message: "Ahh... that was nice. I breathed with you! +15 XP 🫁",
        },
        meditation: {
            art: 'happy',
            message: "So peaceful... I feel calmer too! +25 XP 🧘",
        },
        journal: {
            art: 'excited',
            message: "I love that you're writing. You grew emotionally today! +20 XP 📝",
        },
        thought_record: {
            art: 'excited',
            message: "Wow, great cognitive work! Your mind is getting sharper! +30 XP 🧠",
        },
        streak_milestone: {
            art: 'excited',
            message: "STREAK MILESTONE! You're absolutely crushing it! 🏆",
        },
        level_up: {
            art: 'excited',
            message: "LEVEL UP! You've evolved! New powers unlocked! ⚡",
        },
        long_absence: {
            art: 'sad',
            message: "I've missed you... but there's no judgment here. Welcome back 💙",
        },
        crisis: {
            art: 'worried',
            message: "I'm here for you. You're not alone. Let me get you some resources 💙",
        },
    };

    return reactions[event] || { art: 'neutral', message: 'Hey there!' };
}

function getMoodColor(mood) {
    const colors = {
        happy: '#4ECDC4',
        neutral: '#45B7D1',
        sad: '#7B68EE',
        worried: '#FF8E53',
        excited: '#FFD700',
        sleeping: '#6C63FF',
    };
    return colors[mood] || '#4ECDC4';
}

// ─── Evolution Check ──────────────────────────────
export function checkEvolution() {
    const gamification = getGamification();
    const level = gamification.user_level;
    const currentStage = getCurrentStage(level);
    const prevStage = getCurrentStage(level - 1);

    if (currentStage.name !== prevStage.name && level > 1) {
        return {
            evolved: true,
            from: prevStage,
            to: currentStage,
            level,
        };
    }
    return { evolved: false };
}

export default { renderCompanion, getCompanionReaction, checkEvolution };
