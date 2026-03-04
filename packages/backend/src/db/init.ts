import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { dirname, join, isAbsolute, basename } from 'path';
import fs from 'fs';

// Resolve database path: if relative or just a filename, place it in /app/data/
function resolveDbPath(): string {
  const envPath = process.env.DB_PATH;
  const dataDir = '/app/data';

  if (!envPath) return join(dataDir, 'mindlint.db');
  if (isAbsolute(envPath)) return envPath;

  // Relative path like ./mindlint.db → put in /app/data/
  return join(dataDir, basename(envPath));
}

const dbPath = resolveDbPath();

export function initDatabase() {
  console.log('🔍 Starting database with path:', dbPath);

  const dir = dirname(dbPath);
  if (!fs.existsSync(dir)) {
    console.log('📁 Creating directory:', dir);
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      settings TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      duration_seconds INTEGER,
      project_path TEXT,
      language TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS hourly_aggregates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      hour INTEGER NOT NULL,
      date TEXT NOT NULL,
      avg_stability REAL,
      error_rate REAL,
      complexity_index REAL,
      typing_cadence_variance REAL,
      undo_spikes INTEGER,
      file_switches INTEGER,
      session_count INTEGER,
      total_duration_minutes INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, hour, date)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL UNIQUE,
      avg_daily_stability REAL,
      total_session_time INTEGER,
      error_rate_trend TEXT,
      complexity_trend TEXT,
      peak_flow_hour INTEGER,
      strain_spike_hours TEXT,
      recovery_time_avg INTEGER,
      late_night_sessions INTEGER,
      commit_bursts INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS forecasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      hour INTEGER NOT NULL,
      date TEXT NOT NULL,
      predicted_stability REAL,
      risk_score REAL,
      confidence REAL,
      contributing_factors TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      insight_type TEXT NOT NULL,
      content TEXT NOT NULL,
      data_payload TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ws_connections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      connected_at INTEGER NOT NULL,
      last_ping INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS bpi_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      hour INTEGER NOT NULL,
      cognitive_score REAL,
      burnout_probability REAL,
      flow_state REAL,
      ema_cognitive_score REAL,
      ema_stability REAL,
      weighted_breakdown TEXT,
      normalized_metrics TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      coding_start_hour INTEGER DEFAULT 9,
      coding_end_hour INTEGER DEFAULT 18,
      sleep_start_hour INTEGER DEFAULT 22,
      sleep_end_hour INTEGER DEFAULT 6,
      baseline_stability REAL,
      baseline_calibration_start INTEGER,
      onboarding_completed INTEGER DEFAULT 0,
      gamification_enabled INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS gamification (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      streak_type TEXT NOT NULL,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_updated INTEGER,
      badges TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
    CREATE INDEX IF NOT EXISTS idx_hourly_aggregates_user_date ON hourly_aggregates(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_forecasts_user_date ON forecasts(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_insights_user_created ON insights(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_bpi_user_date ON bpi_metrics(user_id, date);
  `);

  console.log('✅ Database initialized:', dbPath);
  return db;
}

// User management functions
export function getOrCreateUser(db, userId) {
  const existingUser = userId
    ? db.prepare('SELECT id FROM users WHERE id = ?').get(userId)
    : null;

  if (existingUser) {
    return existingUser.id;
  }

  const newUserId = userId || uuidv4();
  db.prepare('INSERT INTO users (id, created_at) VALUES (?, ?)').run(newUserId, Date.now());
  return newUserId;
}

// Session management
export function createSession(db, userId, data) {
  const sessionId = uuidv4();
  const startedAt = Date.now();

  db.prepare(`
    INSERT INTO sessions (id, user_id, started_at, project_path, language)
    VALUES (?, ?, ?, ?, ?)
  `).run(sessionId, userId, startedAt, data.projectPath || null, data.language || null);

  return { id: sessionId, startedAt };
}

export function endSession(db, sessionId) {
  const endedAt = Date.now();
  const session = db.prepare('SELECT started_at FROM sessions WHERE id = ?').get(sessionId);

  if (session) {
    const durationSeconds = Math.floor((endedAt - session.started_at) / 1000);
    db.prepare('UPDATE sessions SET ended_at = ?, duration_seconds = ? WHERE id = ?')
      .run(endedAt, durationSeconds, sessionId);
  }
}

// Hourly aggregate functions
export function upsertHourlyAggregate(db, userId, data) {
  db.prepare(`
    INSERT INTO hourly_aggregates 
    (user_id, hour, date, avg_stability, error_rate, complexity_index, typing_cadence_variance, 
     undo_spikes, file_switches, session_count, total_duration_minutes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, hour, date) DO UPDATE SET
      avg_stability = excluded.avg_stability,
      error_rate = excluded.error_rate,
      complexity_index = excluded.complexity_index,
      typing_cadence_variance = excluded.typing_cadence_variance,
      undo_spikes = excluded.undo_spikes,
      file_switches = excluded.file_switches,
      session_count = excluded.session_count,
      total_duration_minutes = excluded.total_duration_minutes
  `).run(
    data.userId || userId,
    data.hour,
    data.date,
    data.avgStability,
    data.errorRate,
    data.complexityIndex,
    data.typingCadenceVariance,
    data.undoSpikes,
    data.fileSwitches,
    data.sessionCount,
    data.totalDurationMinutes,
    Date.now()
  );
}

export function getHourlyAggregates(db, userId, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceDate = since.toISOString().split('T')[0];

  return db.prepare(`
    SELECT * FROM hourly_aggregates 
    WHERE user_id = ? AND date >= ?
    ORDER BY date, hour
  `).all(userId, sinceDate);
}

// Forecast functions
export function saveForecast(db, userId, data) {
  db.prepare(`
    INSERT INTO forecasts 
    (user_id, hour, date, predicted_stability, risk_score, confidence, contributing_factors, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    data.hour,
    data.date,
    data.predictedStability,
    data.riskScore,
    data.confidence,
    JSON.stringify(data.contributingFactors),
    Date.now()
  );
}

export function getForecasts(db, userId, date) {
  const query = date
    ? 'SELECT * FROM forecasts WHERE user_id = ? AND date = ? ORDER BY hour'
    : 'SELECT * FROM forecasts WHERE user_id = ? ORDER BY date, hour LIMIT 24';

  const params = date ? [userId, date] : [userId];
  return db.prepare(query).all(...params);
}

// Insights functions
export function saveInsight(db, userId, data) {
  db.prepare(`
    INSERT INTO insights (user_id, insight_type, content, data_payload, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    userId,
    data.insightType,
    data.content,
    data.dataPayload ? JSON.stringify(data.dataPayload) : null,
    Date.now()
  );
}

export function getRecentInsights(db, userId, limit = 10) {
  return db.prepare(`
    SELECT * FROM insights 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `).all(userId, limit);
}

// Analytics helpers
export function getUserStats(db, userId) {
  const sessions = db.prepare(`
    SELECT COUNT(*) as total_sessions, 
           SUM(duration_seconds) as total_time,
           AVG(duration_seconds) as avg_session_length
    FROM sessions 
    WHERE user_id = ? AND ended_at IS NOT NULL
  `).get(userId);

  const recentAggregates = db.prepare(`
    SELECT AVG(avg_stability) as avg_stability,
           AVG(error_rate) as avg_error_rate,
           SUM(total_duration_minutes) as total_minutes
    FROM hourly_aggregates 
    WHERE user_id = ? AND date >= date('now', '-7 days')
  `).get(userId);

  return {
    totalSessions: sessions?.total_sessions || 0,
    totalTime: sessions?.total_time || 0,
    avgSessionLength: sessions?.avg_session_length || 0,
    avgStability: recentAggregates?.avg_stability || 0,
    avgErrorRate: recentAggregates?.avg_error_rate || 0,
    totalMinutes: recentAggregates?.total_minutes || 0
  };
}

export function saveBPIMetrics(db, userId, data) {
  db.prepare(`
    INSERT INTO bpi_metrics 
    (user_id, date, hour, cognitive_score, burnout_probability, flow_state, ema_cognitive_score, ema_stability, weighted_breakdown, normalized_metrics, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    data.date,
    data.hour,
    data.cognitiveScore,
    data.burnoutProbability,
    data.flowState,
    data.emaCognitiveScore,
    data.emaStability,
    data.weightedBreakdown || null,
    data.normalizedMetrics || null,
    Date.now()
  );
}

export function getBPIMetrics(db, userId, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceDate = since.toISOString().split('T')[0];

  return db.prepare(`
    SELECT * FROM bpi_metrics 
    WHERE user_id = ? AND date >= ?
    ORDER BY date, hour
  `).all(userId, sinceDate);
}

export function getWeeklyBPI(db, userId) {
  return db.prepare(`
    SELECT 
      date,
      AVG(cognitive_score) as avg_cognitive_score,
      AVG(burnout_probability) as avg_burnout_probability,
      AVG(flow_state) as avg_flow_state,
      MAX(burnout_probability) as max_burnout_probability,
      COUNT(*) as sample_count
    FROM bpi_metrics 
    WHERE user_id = ? AND date >= date('now', '-7 days')
    GROUP BY date
    ORDER BY date
  `).all(userId);
}

export function saveUserPreferences(db, userId, prefs) {
  const existing = db.prepare('SELECT user_id FROM user_preferences WHERE user_id = ?').get(userId);

  if (existing) {
    const updates = [];
    const values = [];

    if (prefs.codingStartHour !== undefined) {
      updates.push('coding_start_hour = ?');
      values.push(prefs.codingStartHour);
    }
    if (prefs.codingEndHour !== undefined) {
      updates.push('coding_end_hour = ?');
      values.push(prefs.codingEndHour);
    }
    if (prefs.sleepStartHour !== undefined) {
      updates.push('sleep_start_hour = ?');
      values.push(prefs.sleepStartHour);
    }
    if (prefs.sleepEndHour !== undefined) {
      updates.push('sleep_end_hour = ?');
      values.push(prefs.sleepEndHour);
    }

    if (updates.length > 0) {
      values.push(userId);
      db.prepare(`UPDATE user_preferences SET ${updates.join(', ')} WHERE user_id = ?`).run(...values);
    }
  } else {
    db.prepare(`
      INSERT INTO user_preferences (user_id, coding_start_hour, coding_end_hour, sleep_start_hour, sleep_end_hour)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      userId,
      prefs.codingStartHour || 9,
      prefs.codingEndHour || 18,
      prefs.sleepStartHour || 22,
      prefs.sleepEndHour || 6
    );
  }
}

export function getUserPreferences(db, userId) {
  return db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId);
}

export function completeOnboarding(db, userId) {
  const existing = db.prepare('SELECT user_id FROM user_preferences WHERE user_id = ?').get(userId);

  if (existing) {
    db.prepare('UPDATE user_preferences SET onboarding_completed = 1 WHERE user_id = ?').run(userId);
  } else {
    db.prepare(`
      INSERT INTO user_preferences (user_id, onboarding_completed, baseline_calibration_start)
      VALUES (?, 1, ?)
    `).run(userId, Date.now());
  }
}

export function updateGamification(db, userId, data) {
  const existing = db.prepare(`
    SELECT * FROM gamification WHERE user_id = ? AND streak_type = ?
  `).get(userId, data.streakType);

  if (existing) {
    const current = existing;
    let newStreak = data.increment ? current.current_streak + 1 : 0;

    if (newStreak > current.longest_streak) {
      current.longest_streak = newStreak;
    }

    db.prepare(`
      UPDATE gamification SET current_streak = ?, longest_streak = ?, last_updated = ? 
      WHERE user_id = ? AND streak_type = ?
    `).run(newStreak, current.longest_streak, Date.now(), userId, data.streakType);
  } else {
    db.prepare(`
      INSERT INTO gamification (user_id, streak_type, current_streak, longest_streak, last_updated)
      VALUES (?, ?, 1, 1, ?)
    `).run(userId, data.streakType, Date.now());
  }
}

export function getGamificationData(db, userId) {
  return db.prepare('SELECT * FROM gamification WHERE user_id = ?').all(userId);
}
