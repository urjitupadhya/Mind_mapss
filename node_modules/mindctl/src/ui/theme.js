// ═══════════════════════════════════════════════════
// 🎨 mindctl — Terminal Theme & Styling Engine
// Beautiful gradients, colors, and mood-reactive themes
// ═══════════════════════════════════════════════════

import chalk from 'chalk';
import gradient from 'gradient-string';
import boxen from 'boxen';

// ─── Color Palettes ───────────────────────────────
export const PALETTES = {
    calm: ['#6C63FF', '#4ECDC4', '#45B7D1', '#96CEB4'],
    warm: ['#FF6B6B', '#FFA07A', '#FFD93D', '#6BCB77'],
    ocean: ['#0077B6', '#00B4D8', '#48CAE4', '#90E0EF'],
    sunset: ['#FF6B6B', '#FF8E53', '#FFD93D', '#FFA07A'],
    aurora: ['#6C63FF', '#E040FB', '#FF4081', '#FF6E40'],
    forest: ['#2D6A4F', '#40916C', '#52B788', '#74C69D'],
    night: ['#1A1A2E', '#16213E', '#0F3460', '#533483'],
    lavender: ['#7B68EE', '#9B89B3', '#C4B7CB', '#E8D5E3'],
    energy: ['#FFD700', '#FF6347', '#FF4500', '#DC143C'],
    zen: ['#E8D5B7', '#B8C9A3', '#8BA888', '#6B8F71'],
};

// ─── Gradients ────────────────────────────────────
export const GRADIENTS = {
    mindctl: gradient(['#6C63FF', '#E040FB', '#FF4081']),
    success: gradient(['#4ECDC4', '#44CF6C', '#6BCB77']),
    warning: gradient(['#FFD93D', '#FF8E53', '#FF6B6B']),
    info: gradient(['#45B7D1', '#4ECDC4', '#96CEB4']),
    calm: gradient(['#6C63FF', '#45B7D1', '#4ECDC4']),
    fire: gradient(['#FF6B6B', '#FF4500', '#DC143C']),
    ocean: gradient(['#0077B6', '#00B4D8', '#48CAE4']),
    aurora: gradient(['#6C63FF', '#E040FB', '#FF4081', '#FF6E40']),
    sunset: gradient(['#FF6B6B', '#FF8E53', '#FFD93D']),
    zen: gradient(['#E8D5B7', '#B8C9A3', '#6B8F71']),
};

// ─── Status Colors ────────────────────────────────
export const STATUS = {
    great: chalk.hex('#4ECDC4'),
    good: chalk.hex('#6BCB77'),
    okay: chalk.hex('#FFD93D'),
    low: chalk.hex('#FF8E53'),
    bad: chalk.hex('#FF6B6B'),
    critical: chalk.hex('#DC143C'),
};

// ─── Mood Colors ──────────────────────────────────
export const MOOD_COLORS = {
    amazing: { color: '#FFD700', emoji: '🌟', label: 'Amazing' },
    happy: { color: '#4ECDC4', emoji: '😊', label: 'Happy' },
    good: { color: '#6BCB77', emoji: '😌', label: 'Good' },
    okay: { color: '#45B7D1', emoji: '😐', label: 'Okay' },
    meh: { color: '#FFD93D', emoji: '😑', label: 'Meh' },
    low: { color: '#FF8E53', emoji: '😟', label: 'Low' },
    sad: { color: '#FF6B6B', emoji: '😢', label: 'Sad' },
    anxious: { color: '#E040FB', emoji: '😰', label: 'Anxious' },
    stressed: { color: '#FF4081', emoji: '😤', label: 'Stressed' },
    angry: { color: '#DC143C', emoji: '😡', label: 'Angry' },
    peaceful: { color: '#96CEB4', emoji: '🧘', label: 'Peaceful' },
    grateful: { color: '#FFD700', emoji: '🙏', label: 'Grateful' },
    tired: { color: '#7B68EE', emoji: '😴', label: 'Tired' },
    overwhelmed: { color: '#FF6E40', emoji: '🤯', label: 'Overwhelmed' },
    hopeful: { color: '#48CAE4', emoji: '✨', label: 'Hopeful' },
};

// ─── Icons ────────────────────────────────────────
export const ICONS = {
    heart: '♥',
    star: '★',
    check: '✓',
    cross: '✗',
    arrow: '→',
    bullet: '•',
    dash: '─',
    dot: '·',
    wave: '〜',
    sparkle: '✦',
    diamond: '◆',
    circle: '●',
    ring: '○',
    sun: '☀',
    moon: '☾',
    cloud: '☁',
    rain: '☂',
    lightning: '⚡',
    fire: '🔥',
    plant: '🌱',
    tree: '🌳',
    flower: '🌸',
    brain: '🧠',
    breath: '🫁',
    meditation: '🧘',
    journal: '📝',
    chart: '📊',
    shield: '🛡️',
    lock: '🔒',
    key: '🔑',
    trophy: '🏆',
    badge: '🏅',
    streak: '🔥',
    companion: '🐱',
    sleep: '💤',
    water: '💧',
    eye: '👁',
    muscle: '💪',
};

// ─── Box Styles ───────────────────────────────────
export function createBox(content, options = {}) {
    return boxen(content, {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        borderStyle: 'round',
        borderColor: '#6C63FF',
        ...options,
    });
}

export function createInfoBox(title, content) {
    const header = GRADIENTS.info(` ${title} `);
    return boxen(`${header}\n\n${content}`, {
        padding: 1,
        margin: { top: 0, bottom: 1, left: 0, right: 0 },
        borderStyle: 'round',
        borderColor: '#45B7D1',
    });
}

export function createSuccessBox(content) {
    return boxen(content, {
        padding: 1,
        borderStyle: 'round',
        borderColor: '#4ECDC4',
    });
}

export function createWarningBox(content) {
    return boxen(content, {
        padding: 1,
        borderStyle: 'round',
        borderColor: '#FFD93D',
    });
}

export function createErrorBox(content) {
    return boxen(content, {
        padding: 1,
        borderStyle: 'round',
        borderColor: '#FF6B6B',
    });
}

// ─── Progress Bars ────────────────────────────────
export function progressBar(value, max = 100, width = 20, filledColor = '#4ECDC4', emptyColor = '#333') {
    const pct = Math.min(Math.max(value / max, 0), 1);
    const filled = Math.round(pct * width);
    const empty = width - filled;
    const bar = chalk.hex(filledColor)('█'.repeat(filled)) + chalk.hex(emptyColor)('░'.repeat(empty));
    return bar;
}

export function moodBar(value, width = 20) {
    let color;
    if (value >= 80) color = '#4ECDC4';
    else if (value >= 60) color = '#6BCB77';
    else if (value >= 40) color = '#FFD93D';
    else if (value >= 20) color = '#FF8E53';
    else color = '#FF6B6B';
    return progressBar(value, 100, width, color);
}

// ─── Sparkline Charts ─────────────────────────────
export function sparkline(data, options = {}) {
    const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    const min = options.min ?? Math.min(...data);
    const max = options.max ?? Math.max(...data);
    const range = max - min || 1;

    return data.map(val => {
        const idx = Math.round(((val - min) / range) * (chars.length - 1));
        const char = chars[Math.max(0, Math.min(idx, chars.length - 1))];

        let color;
        const pct = (val - min) / range;
        if (pct >= 0.75) color = '#4ECDC4';
        else if (pct >= 0.5) color = '#6BCB77';
        else if (pct >= 0.25) color = '#FFD93D';
        else color = '#FF6B6B';

        return chalk.hex(color)(char);
    }).join('');
}

// ─── Dividers ─────────────────────────────────────
export function divider(width = 50, char = '─', color = '#444') {
    return chalk.hex(color)(char.repeat(width));
}

export function fancyDivider(width = 50) {
    return GRADIENTS.calm('─'.repeat(width));
}

// ─── Time Formatting ──────────────────────────────
export function formatDuration(minutes) {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatTime(date) {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

// ─── Score Display ────────────────────────────────
export function scoreDisplay(score, label = 'Score') {
    let color, emoji;
    if (score >= 80) { color = '#4ECDC4'; emoji = '🌟'; }
    else if (score >= 60) { color = '#6BCB77'; emoji = '✅'; }
    else if (score >= 40) { color = '#FFD93D'; emoji = '⚠️'; }
    else if (score >= 20) { color = '#FF8E53'; emoji = '🔶'; }
    else { color = '#FF6B6B'; emoji = '🔴'; }

    return `${emoji} ${chalk.hex(color).bold(score)}${chalk.dim('/100')} ${chalk.dim(label)}`;
}

// ─── Calendar Heatmap ─────────────────────────────
export function calendarHeatmap(data, weeks = 4) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const intensityChars = [' ', '░', '▒', '▓', '█'];
    const colors = ['#1a1a2e', '#2d5016', '#3d8b37', '#4ECDC4', '#FFD700'];

    let output = '    ';
    for (let w = 0; w < weeks; w++) {
        output += chalk.dim(` W${w + 1} `);
    }
    output += '\n';

    for (let d = 0; d < 7; d++) {
        output += chalk.dim(days[d] + ' ');
        for (let w = 0; w < weeks; w++) {
            const idx = w * 7 + d;
            const val = data[idx] ?? 0;
            const level = Math.min(Math.floor(val / 25), 4);
            output += chalk.hex(colors[level])(intensityChars[level] + intensityChars[level]) + ' ';
        }
        output += '\n';
    }

    return output;
}

export default {
    PALETTES, GRADIENTS, STATUS, MOOD_COLORS, ICONS,
    createBox, createInfoBox, createSuccessBox, createWarningBox, createErrorBox,
    progressBar, moodBar, sparkline, divider, fancyDivider,
    formatDuration, formatTime, formatDate, scoreDisplay, calendarHeatmap,
};
