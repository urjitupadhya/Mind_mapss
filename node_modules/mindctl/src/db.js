// ═══════════════════════════════════════════════════
// 💾 mindctl — Database Layer (SQLite)
// Local-first, encrypted, privacy-focused storage
// ═══════════════════════════════════════════════════

import Database from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync } from 'fs';
import crypto from 'crypto';

const DATA_DIR = join(homedir(), '.mindctl');
const DB_PATH = join(DATA_DIR, 'mindctl.db');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(db) {
  db.exec(`
    -- Mood check-ins
    CREATE TABLE IF NOT EXISTS mood_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      mood TEXT NOT NULL,
      mood_score INTEGER NOT NULL CHECK(mood_score BETWEEN 1 AND 10),
      energy INTEGER CHECK(energy BETWEEN 1 AND 10),
      note TEXT,
      ai_insight TEXT,
      tags TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Journal entries (encrypted content)
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      type TEXT NOT NULL DEFAULT 'freeform',
      title TEXT,
      content TEXT NOT NULL,
      encrypted INTEGER DEFAULT 0,
      prompt TEXT,
      ai_analysis TEXT,
      mood_before INTEGER,
      mood_after INTEGER,
      tags TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- CBT Thought Records
    CREATE TABLE IF NOT EXISTS thought_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      situation TEXT NOT NULL,
      automatic_thought TEXT NOT NULL,
      emotion TEXT NOT NULL,
      emotion_intensity INTEGER CHECK(emotion_intensity BETWEEN 1 AND 10),
      cognitive_distortion TEXT,
      evidence_for TEXT,
      evidence_against TEXT,
      reframed_thought TEXT,
      new_emotion TEXT,
      new_intensity INTEGER CHECK(new_intensity BETWEEN 1 AND 10),
      ai_analysis TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Breathing/Meditation sessions
    CREATE TABLE IF NOT EXISTS wellness_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      type TEXT NOT NULL,
      subtype TEXT,
      duration_seconds INTEGER NOT NULL,
      completed INTEGER DEFAULT 1,
      mood_before INTEGER,
      mood_after INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Habits
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      frequency TEXT DEFAULT 'daily',
      target INTEGER DEFAULT 1,
      icon TEXT DEFAULT '✓',
      color TEXT DEFAULT '#4ECDC4',
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Habit completions
    CREATE TABLE IF NOT EXISTS habit_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (habit_id) REFERENCES habits(id),
      UNIQUE(habit_id, date)
    );

    -- Sleep logs
    CREATE TABLE IF NOT EXISTS sleep_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      bedtime TEXT,
      waketime TEXT,
      duration_hours REAL,
      quality INTEGER CHECK(quality BETWEEN 1 AND 10),
      notes TEXT,
      dreams TEXT,
      ai_analysis TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Screen time tracking
    CREATE TABLE IF NOT EXISTS screen_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration_minutes REAL,
      break_count INTEGER DEFAULT 0,
      app_switches INTEGER DEFAULT 0,
      typing_intensity REAL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Water intake
    CREATE TABLE IF NOT EXISTS water_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      glasses INTEGER DEFAULT 1,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Gamification
    CREATE TABLE IF NOT EXISTS gamification (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_xp INTEGER DEFAULT 0,
      user_level INTEGER DEFAULT 1,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_activity TEXT,
      companion_mood TEXT DEFAULT 'happy',
      companion_level INTEGER DEFAULT 1,
      companion_name TEXT DEFAULT 'Pixel',
      total_sessions INTEGER DEFAULT 0,
      total_breathing INTEGER DEFAULT 0,
      total_meditations INTEGER DEFAULT 0,
      total_journals INTEGER DEFAULT 0,
      total_checkins INTEGER DEFAULT 0,
      total_thought_records INTEGER DEFAULT 0,
      achievements TEXT DEFAULT '[]',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Quests (AI-generated wellness challenges)
    CREATE TABLE IF NOT EXISTS quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      target_count INTEGER DEFAULT 1,
      current_count INTEGER DEFAULT 0,
      reward_xp INTEGER DEFAULT 100,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- AI conversation history
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'therapy',
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Crisis safety plan
    CREATE TABLE IF NOT EXISTS safety_plan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      warning_signs TEXT,
      coping_strategies TEXT,
      reasons_to_live TEXT,
      people_to_contact TEXT,
      professional_contacts TEXT,
      safe_environment TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Daily summaries (AI-generated)
    CREATE TABLE IF NOT EXISTS daily_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      screen_time_minutes REAL,
      mood_avg REAL,
      exercises_count INTEGER,
      journal_count INTEGER,
      habits_completed INTEGER,
      water_glasses INTEGER,
      sleep_hours REAL,
      ai_narrative TEXT,
      wellness_score INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Burnout analysis results
    CREATE TABLE IF NOT EXISTS burnout_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_path TEXT,
      risk_score INTEGER,
      report_data TEXT,
      ai_analysis TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Initialize gamification if empty
    INSERT OR IGNORE INTO gamification (id) VALUES (1);
  `);
}

// ─── Mood Operations ──────────────────────────────
export function addMoodEntry(mood, moodScore, energy, note, tags, aiInsight) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO mood_entries (mood, mood_score, energy, note, tags, ai_insight)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(mood, moodScore, energy, note, JSON.stringify(tags || []), aiInsight);
  updateGamification('checkin');
  return result;
}

export function getMoodHistory(days = 30) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM mood_entries
    WHERE timestamp >= datetime('now', ?)
    ORDER BY timestamp DESC
  `).all(`-${days} days`);
}

export function getMoodToday() {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM mood_entries
    WHERE date(timestamp) = date('now')
    ORDER BY timestamp DESC
  `).all();
}

// ─── Journal Operations ───────────────────────────
export function addJournalEntry(type, title, content, prompt, moodBefore, moodAfter, tags, aiAnalysis) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO journal_entries (type, title, content, prompt, mood_before, mood_after, tags, ai_analysis)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(type, title, content, prompt, moodBefore, moodAfter, JSON.stringify(tags || []), aiAnalysis);
  updateGamification('journal');
  return result;
}

export function getJournalEntries(days = 30, type = null) {
  const db = getDb();
  if (type) {
    return db.prepare(`
      SELECT * FROM journal_entries
      WHERE timestamp >= datetime('now', ?) AND type = ?
      ORDER BY timestamp DESC
    `).all(`-${days} days`, type);
  }
  return db.prepare(`
    SELECT * FROM journal_entries
    WHERE timestamp >= datetime('now', ?)
    ORDER BY timestamp DESC
  `).all(`-${days} days`);
}

// ─── Thought Record Operations ────────────────────
export function addThoughtRecord(data) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO thought_records (situation, automatic_thought, emotion, emotion_intensity,
      cognitive_distortion, evidence_for, evidence_against, reframed_thought, new_emotion, new_intensity, ai_analysis)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.situation, data.automaticThought, data.emotion, data.emotionIntensity,
    data.cognitiveDistortion, data.evidenceFor, data.evidenceAgainst,
    data.reframedThought, data.newEmotion, data.newIntensity, data.aiAnalysis
  );
  updateGamification('thought_record');
  return result;
}

export function getThoughtRecords(days = 30) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM thought_records
    WHERE timestamp >= datetime('now', ?)
    ORDER BY timestamp DESC
  `).all(`-${days} days`);
}

// ─── Wellness Session Operations ──────────────────
export function addWellnessSession(type, subtype, durationSec, moodBefore, moodAfter, notes) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO wellness_sessions (type, subtype, duration_seconds, mood_before, mood_after, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(type, subtype, durationSec, moodBefore, moodAfter, notes);
  if (type === 'breathing') updateGamification('breathing');
  if (type === 'meditation') updateGamification('meditation');
  return result;
}

export function getWellnessSessions(days = 30) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM wellness_sessions
    WHERE timestamp >= datetime('now', ?)
    ORDER BY timestamp DESC
  `).all(`-${days} days`);
}

// ─── Habit Operations ─────────────────────────────
export function addHabit(name, description, frequency, icon, color) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO habits (name, description, frequency, icon, color)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, description || '', frequency || 'daily', icon || '✓', color || '#4ECDC4');
}

export function getHabits() {
  const db = getDb();
  return db.prepare('SELECT * FROM habits WHERE active = 1 ORDER BY created_at').all();
}

export function completeHabit(habitId, date) {
  const db = getDb();
  const today = date || new Date().toISOString().split('T')[0];
  return db.prepare(`
    INSERT OR REPLACE INTO habit_completions (habit_id, date, count)
    VALUES (?, ?, COALESCE((SELECT count + 1 FROM habit_completions WHERE habit_id = ? AND date = ?), 1))
  `).run(habitId, today, habitId, today);
}

export function getHabitCompletions(habitId, days = 30) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM habit_completions
    WHERE habit_id = ? AND date >= date('now', ?)
    ORDER BY date DESC
  `).all(habitId, `-${days} days`);
}

export function getHabitStreak(habitId) {
  const db = getDb();
  const completions = db.prepare(`
    SELECT date FROM habit_completions
    WHERE habit_id = ?
    ORDER BY date DESC
  `).all(habitId);

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < completions.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedDate = expected.toISOString().split('T')[0];
    if (completions[i]?.date === expectedDate) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ─── Sleep Operations ─────────────────────────────
export function addSleepLog(date, bedtime, waketime, durationHours, quality, notes, dreams) {
  const db = getDb();
  return db.prepare(`
    INSERT OR REPLACE INTO sleep_logs (date, bedtime, waketime, duration_hours, quality, notes, dreams)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(date, bedtime, waketime, durationHours, quality, notes, dreams);
}

export function getSleepHistory(days = 30) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM sleep_logs
    WHERE date >= date('now', ?)
    ORDER BY date DESC
  `).all(`-${days} days`);
}

// ─── Water Operations ─────────────────────────────
export function addWater(glasses = 1) {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  return db.prepare(`INSERT INTO water_log (date, glasses) VALUES (?, ?)`).run(today, glasses);
}

export function getWaterToday() {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const result = db.prepare(`SELECT SUM(glasses) as total FROM water_log WHERE date = ?`).get(today);
  return result?.total || 0;
}

// ─── Screen Time Operations ───────────────────────
export function startScreenSession() {
  const db = getDb();
  return db.prepare(`INSERT INTO screen_sessions (start_time) VALUES (datetime('now'))`).run();
}

export function endScreenSession(id, breakCount, appSwitches) {
  const db = getDb();
  return db.prepare(`
    UPDATE screen_sessions
    SET end_time = datetime('now'),
        duration_minutes = (julianday(datetime('now')) - julianday(start_time)) * 1440,
        break_count = ?,
        app_switches = ?
    WHERE id = ?
  `).run(breakCount || 0, appSwitches || 0, id);
}

export function getScreenTimeToday() {
  const db = getDb();
  const result = db.prepare(`
    SELECT SUM(duration_minutes) as total FROM screen_sessions
    WHERE date(start_time) = date('now')
  `).get();
  return result?.total || 0;
}

export function getRecentScreenSessions(limit = 10) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM screen_sessions
    ORDER BY start_time DESC
    LIMIT ?
  `).all(limit);
}

// ─── Gamification ─────────────────────────────────
export function getGamification() {
  const db = getDb();
  return db.prepare('SELECT * FROM gamification WHERE id = 1').get();
}

export function updateGamification(activityType) {
  const db = getDb();
  const xpMap = {
    checkin: 10,
    journal: 20,
    breathing: 15,
    meditation: 25,
    thought_record: 30,
    habit: 10,
    sleep: 10,
    water: 5,
  };

  const xp = xpMap[activityType] || 5;
  const field = {
    checkin: 'total_checkins',
    journal: 'total_journals',
    breathing: 'total_breathing',
    meditation: 'total_meditations',
    thought_record: 'total_thought_records',
  }[activityType] || null;

  let sql = `UPDATE gamification SET user_xp = user_xp + ?, total_sessions = total_sessions + 1, last_activity = datetime('now'), updated_at = datetime('now')`;

  if (field) {
    sql += `, ${field} = ${field} + 1`;
  }

  // Level up every 100 XP
  sql += `, user_level = CASE WHEN (user_xp + ?) >= user_level * 100 THEN user_level + 1 ELSE user_level END`;

  // Streak management
  sql += `, current_streak = CASE
    WHEN date(last_activity) = date('now', '-1 day') OR last_activity IS NULL THEN current_streak + 1
    WHEN date(last_activity) = date('now') THEN current_streak
    ELSE 1 END`;

  sql += `, longest_streak = CASE
    WHEN current_streak + 1 > longest_streak THEN current_streak + 1
    ELSE longest_streak END`;

  sql += ` WHERE id = 1`;

  db.prepare(sql).run(xp, xp);
}

export function addAchievement(achievementId) {
  const db = getDb();
  const current = getGamification();
  const achievements = JSON.parse(current.achievements || '[]');
  if (!achievements.includes(achievementId)) {
    achievements.push(achievementId);
    db.prepare('UPDATE gamification SET achievements = ? WHERE id = 1').run(JSON.stringify(achievements));
    return true;
  }
  return false;
}

export function checkAchievements() {
  const g = getGamification();
  const newAchievements = [];

  const checks = [
    { id: 'first_breath', condition: g.total_breathing >= 1, label: '🏅 First Breath — Completed first breathing exercise' },
    { id: 'zen_starter', condition: g.total_meditations >= 1, label: '🏅 Zen Starter — First meditation session' },
    { id: 'thought_detective', condition: g.total_thought_records >= 1, label: '🏅 Thought Detective — First CBT thought record' },
    { id: 'journal_writer', condition: g.total_journals >= 1, label: '🏅 Journal Writer — First journal entry' },
    { id: 'week_warrior', condition: g.current_streak >= 7, label: '🏅 Week Warrior — 7-day streak' },
    { id: 'fortnight_fighter', condition: g.current_streak >= 14, label: '🏅 Fortnight Fighter — 14-day streak' },
    { id: 'month_master', condition: g.current_streak >= 30, label: '🏅 Month Master — 30-day streak' },
    { id: 'breathing_10', condition: g.total_breathing >= 10, label: '🏅 Deep Breather — 10 breathing sessions' },
    { id: 'meditation_10', condition: g.total_meditations >= 10, label: '🏅 Mindful 10 — 10 meditation sessions' },
    { id: 'journal_20', condition: g.total_journals >= 20, label: '🏅 Vulnerability — 20 journal entries' },
    { id: 'thought_10', condition: g.total_thought_records >= 10, label: '🏅 Cognitive Warrior — 10 thought records' },
    { id: 'level_5', condition: g.user_level >= 5, label: '🏅 Rising Star — Reached Level 5' },
    { id: 'level_10', condition: g.user_level >= 10, label: '🏅 Wellness Pro — Reached Level 10' },
    { id: 'level_25', condition: g.user_level >= 25, label: '🏅 Mental Health Champion — Reached Level 25' },
    { id: 'sessions_50', condition: g.total_sessions >= 50, label: '🏅 Dedicated — 50 total sessions' },
    { id: 'sessions_100', condition: g.total_sessions >= 100, label: '🏅 Centurion — 100 total sessions' },
  ];

  const existing = JSON.parse(g.achievements || '[]');
  for (const check of checks) {
    if (check.condition && !existing.includes(check.id)) {
      if (addAchievement(check.id)) {
        newAchievements.push(check);
      }
    }
  }

  return newAchievements;
}

// ─── AI Conversation History ──────────────────────
export function addConversation(sessionId, role, content, type) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO ai_conversations (session_id, role, content, type)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, role, content, type || 'therapy');
}

export function getConversationHistory(sessionId) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM ai_conversations
    WHERE session_id = ?
    ORDER BY timestamp ASC
  `).all(sessionId);
}

// ─── Quest Operations ─────────────────────────────
export function getActiveQuest() {
  const db = getDb();
  return db.prepare("SELECT * FROM quests WHERE status = 'active' ORDER BY created_at DESC LIMIT 1").get();
}

export function createQuest(q) {
  const db = getDb();
  // Close any previous active quests first
  db.prepare("UPDATE quests SET status = 'failed' WHERE status = 'active'").run();
  return db.prepare(`
        INSERT INTO quests (title, description, type, target_count, reward_xp, expires_at)
        VALUES (?, ?, ?, ?, ?, datetime('now', '+7 days'))
    `).run(q.title ?? 'Untitled Quest', q.description, q.type, q.target_count || 1, q.reward_xp || 100);
}

export function updateQuestProgress(id, count = 1) {
  const db = getDb();
  db.prepare("UPDATE quests SET current_count = current_count + ? WHERE id = ? AND status = 'active'").run(count, id);

  // Check for completion
  const q = db.prepare("SELECT * FROM quests WHERE id = ?").get(id);
  if (q && q.current_count >= q.target_count && q.status === 'active') {
    db.prepare("UPDATE quests SET status = 'completed' WHERE id = ?").run(id);
    const xp = q.reward_xp || 100;
    updateGamification(xp);
    return { completed: true, xp };
  }
  return { completed: false };
}

// ─── Safety Plan Operations ───────────────────────
export function getSafetyPlan() {
  const db = getDb();
  return db.prepare('SELECT * FROM safety_plan ORDER BY id DESC LIMIT 1').get();
}

export function saveSafetyPlan(plan) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO safety_plan (warning_signs, coping_strategies, reasons_to_live,
      people_to_contact, professional_contacts, safe_environment)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    plan.warningSigns, plan.copingStrategies, plan.reasonsToLive,
    plan.peopleToContact, plan.professionalContacts, plan.safeEnvironment
  );
}

// ─── Daily Summary ────────────────────────────────
export function saveDailySummary(data) {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  return db.prepare(`
    INSERT OR REPLACE INTO daily_summaries (date, screen_time_minutes, mood_avg, exercises_count,
      journal_count, habits_completed, water_glasses, sleep_hours, ai_narrative, wellness_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(today, data.screenTime, data.moodAvg, data.exercises, data.journals,
    data.habits, data.water, data.sleep, data.aiNarrative, data.wellnessScore);
}

export function getDailySummaries(days = 30) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM daily_summaries
    WHERE date >= date('now', ?)
    ORDER BY date DESC
  `).all(`-${days} days`);
}

// ─── Burnout Reports ──────────────────────────────
export function saveBurnoutReport(repoPath, riskScore, reportData, aiAnalysis) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO burnout_reports (repo_path, risk_score, report_data, ai_analysis)
    VALUES (?, ?, ?, ?)
  `).run(repoPath, riskScore, JSON.stringify(reportData), aiAnalysis);
}

// ─── Stats Aggregation ────────────────────────────
export function getOverallStats() {
  const db = getDb();
  const g = getGamification();
  const moodAvg = db.prepare(`
    SELECT AVG(mood_score) as avg FROM mood_entries
    WHERE timestamp >= datetime('now', '-7 days')
  `).get();

  const todayMoods = getMoodToday();
  const sessionCount = db.prepare('SELECT COUNT(*) as count FROM wellness_sessions').get();
  const journalCount = db.prepare('SELECT COUNT(*) as count FROM journal_entries').get();
  const waterToday = getWaterToday();
  const screenToday = getScreenTimeToday();
  const sleepLast = db.prepare('SELECT * FROM sleep_logs ORDER BY date DESC LIMIT 1').get();

  return {
    gamification: g,
    moodAvgWeek: moodAvg?.avg || 0,
    todayMoods,
    totalSessions: sessionCount?.count || 0,
    totalJournals: journalCount?.count || 0,
    waterToday,
    screenTimeToday: screenToday,
    lastSleep: sleepLast,
  };
}

// ─── Encryption Helpers ───────────────────────────
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text, password) {
  const key = crypto.scryptSync(password, 'mindctl-salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
}

export function decrypt(encrypted, password) {
  const [ivHex, tagHex, data] = encrypted.split(':');
  const key = crypto.scryptSync(password, 'mindctl-salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

export default {
  getDb, closeDb,
  addMoodEntry, getMoodHistory, getMoodToday,
  addJournalEntry, getJournalEntries,
  addThoughtRecord, getThoughtRecords,
  addWellnessSession, getWellnessSessions,
  addHabit, getHabits, completeHabit, getHabitCompletions, getHabitStreak,
  addSleepLog, getSleepHistory,
  addWater, getWaterToday,
  startScreenSession, endScreenSession, getScreenTimeToday, getRecentScreenSessions,
  getGamification, updateGamification, addAchievement, checkAchievements,
  getActiveQuest, createQuest, updateQuestProgress,
  addConversation, getConversationHistory,
  getSafetyPlan, saveSafetyPlan,
  saveDailySummary, getDailySummaries,
  saveBurnoutReport, getOverallStats,
  encrypt, decrypt,
};
