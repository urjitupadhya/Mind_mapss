import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { initDatabase, getOrCreateUser, upsertHourlyAggregate, getHourlyAggregates, getForecasts, saveInsight, getRecentInsights, getUserStats, saveBPIMetrics, getBPIMetrics, getGamificationData } from './db/init.js';
import { processTelemetry } from './services/telemetry.js';
import { generateForecast } from './services/forecast.js';
import { generateMegaLLMInsight } from './services/megallm.js';
import { generateRecoverySuggestions } from './services/recovery.js';
import { calculateProductivityQuadrant, calculateWeeklyBPI } from './services/quadrant.js';

const fastify = Fastify({ logger: true });

const db = initDatabase();

await fastify.register(cors, { 
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
});

await fastify.register(websocket);

const wsClients = new Map();

fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: Date.now() };
});

fastify.post('/api/telemetry', async (request, reply) => {
  try {
    const body = request.body;

    const userId = getOrCreateUser(db, body.userId);

    const now = new Date();
    const hour = now.getHours();
    const date = now.toISOString().split('T')[0];

    upsertHourlyAggregate(db, userId, {
      hour,
      date,
      avgStability: body.aggregates.avg_stability,
      errorRate: body.aggregates.error_rate,
      complexityIndex: body.aggregates.complexity_index,
      typingCadenceVariance: body.aggregates.typing_cadence_variance,
      undoSpikes: body.aggregates.undo_spikes,
      fileSwitches: body.aggregates.file_switches,
      sessionCount: 1,
      totalDurationMinutes: Math.floor(body.aggregates.session_duration / 60)
    });

    if (body.aggregates.cognitive_score !== undefined) {
      saveBPIMetrics(db, userId, {
        date,
        hour,
        cognitiveScore: body.aggregates.cognitive_score,
        burnoutProbability: body.aggregates.burnout_probability || 0,
        flowState: body.aggregates.flow_state || 0,
        emaCognitiveScore: body.aggregates.ema_cognitive_score || body.aggregates.cognitive_score,
        emaStability: body.aggregates.ema_stability || body.aggregates.avg_stability,
        weightedBreakdown: body.weighted_breakdown ? JSON.stringify(body.weighted_breakdown) : null,
        normalizedMetrics: body.normalized_metrics ? JSON.stringify(body.normalized_metrics) : null
      });
    }

    broadcastToUser(userId, {
      type: 'realtime_update',
      data: {
        timestamp: Date.now(),
        cognitive_score: body.aggregates.cognitive_score || 75,
        burnout_probability: body.aggregates.burnout_probability || 25,
        flow_state: body.aggregates.flow_state || 50,
        ema_cognitive_score: body.aggregates.ema_cognitive_score || body.aggregates.cognitive_score || 75,
        ema_stability: body.aggregates.ema_stability || body.aggregates.avg_stability,
        hour,
        avg_stability: body.aggregates.avg_stability,
        error_rate: body.aggregates.error_rate,
        complexity_index: body.aggregates.complexity_index
      }
    });

    return { success: true, userId };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to process telemetry' });
  }
});

fastify.get('/api/aggregates/:userId', async (request, reply) => {
  const { userId } = request.params;
  const { days = '7' } = request.query;

  try {
    const aggregates = getHourlyAggregates(db, userId, parseInt(days));
    return { aggregates };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to fetch aggregates' });
  }
});

fastify.get('/api/forecasts/:userId', async (request, reply) => {
  const { userId } = request.params;
  const { date } = request.query;

  try {
    const forecasts = getForecasts(db, userId, date);
    return { forecasts };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to fetch forecasts' });
  }
});

fastify.post('/api/forecast/generate', async (request, reply) => {
  const body = request.body;

  try {
    const historicalData = getHourlyAggregates(db, body.userId, 14);
    const forecast = generateForecast(historicalData);
    return { forecast };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to generate forecast' });
  }
});

fastify.get('/api/insights/:userId', async (request, reply) => {
  const { userId } = request.params;
  const { limit = '10', type } = request.query;

  try {
    const insights = getRecentInsights(db, userId, parseInt(limit));
    return { insights: type ? insights.filter(i => i.insight_type === type) : insights };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to fetch insights' });
  }
});

fastify.post('/api/insights/generate', async (request, reply) => {
  const body = request.body;

  try {
    const insight = await generateMegaLLMInsight(body.insightType, body.context);
    
    saveInsight(db, body.userId, {
      insightType: body.insightType,
      content: insight.message,
      dataPayload: insight.data
    });

    return { insight };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to generate insight' });
  }
});

fastify.get('/api/stats/:userId', async (request, reply) => {
  const { userId } = request.params;

  try {
    const stats = getUserStats(db, userId);
    return { stats };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to fetch stats' });
  }
});

fastify.get('/api/bpi/:userId', async (request, reply) => {
  const { userId } = request.params;
  const { days = '7' } = request.query;

  try {
    const bpiMetrics = getBPIMetrics(db, userId, parseInt(days || '7'));
    return { bpi: bpiMetrics };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to fetch BPI metrics' });
  }
});

fastify.get('/api/quadrant/:userId', async (request, reply) => {
  const { userId } = request.params;

  try {
    const bpiMetrics = getBPIMetrics(db, userId, 7);
    const quadrant = calculateProductivityQuadrant(bpiMetrics);
    return { quadrant };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to calculate quadrant' });
  }
});

fastify.post('/api/recovery/generate', async (request, reply) => {
  const body = request.body;

  try {
    const recovery = await generateRecoverySuggestions(body);
    return { recovery };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to generate recovery suggestions' });
  }
});

fastify.get('/api/gamification/:userId', async (request, reply) => {
  const { userId } = request.params;

  try {
    const gamificationData = getGamificationData(db, userId);
    const stats = getUserStats(db, userId);
    const recentAggregates = getHourlyAggregates(db, userId, 30);
    
    const totalHours = Math.round((stats.totalTime || 0) / 3600);
    const daysTracked = new Set(recentAggregates.map((a) => a.date)).size;
    const lateSessions = recentAggregates.filter((a) => a.hour >= 22 || a.hour < 6).length;
    const earlySessions = recentAggregates.filter((a) => a.hour >= 5 && a.hour < 8).length;

    const gamificationStats = {
      totalSessions: stats.totalSessions || 0,
      currentStreak: gamificationData.find((g) => g.streak_type === 'focus')?.current_streak || 0,
      longestStreak: gamificationData.find((g) => g.streak_type === 'focus')?.longest_streak || 0,
      totalHours,
      earlySessions,
      lateSessions,
      peakFlow: 85,
      lowStreakMinutes: 180,
      longestSession: stats.avgSessionLength || 0,
      daysTracked,
      focusStreak: gamificationData.find((g) => g.streak_type === 'focus')?.current_streak || 0,
      recoveryStreak: gamificationData.find((g) => g.streak_type === 'recovery')?.current_streak || 0,
      cleanCodeDays: Math.floor((daysTracked || 0) * 0.6)
    };

    const badges = [];
    if (gamificationStats.totalSessions >= 1) badges.push('first_session');
    if (gamificationStats.currentStreak >= 3) badges.push('streak_3');
    if (gamificationStats.currentStreak >= 7) badges.push('streak_7');
    if (gamificationStats.currentStreak >= 30) badges.push('streak_30');
    if (gamificationStats.earlySessions > 0) badges.push('early_bird');
    if (gamificationStats.lateSessions > 0) badges.push('night_owl');
    if (gamificationStats.peakFlow >= 80) badges.push('flow_state');
    if (gamificationStats.lowStreakMinutes >= 120) badges.push('low_strain');
    if (gamificationStats.longestSession >= 180) badges.push('deep_work');
    if (gamificationStats.daysTracked >= 14) badges.push('consistent');

    return { stats: gamificationStats, badges };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to fetch gamification data' });
  }
});

fastify.get('/ws/:userId', { websocket: true }, (socket, request) => {
  const { userId } = request.params;
  
  wsClients.set(userId, socket);
  
  socket.on('close', () => {
    wsClients.delete(userId);
  });

  socket.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'ping') {
        socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
      if (data.type === 'subscribe') {
        socket.send(JSON.stringify({ type: 'subscribed', channel: data.channel, timestamp: Date.now() }));
      }
    } catch (e) {
    }
  });

  socket.send(JSON.stringify({ type: 'connected', userId, timestamp: Date.now() }));
});

fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: Date.now(), version: '1.0.0' };
});

fastify.post('/api/sessions', async (request, reply) => {
  const body = request.body;
  try {
    const userId = getOrCreateUser(db, body.userId);
    const { createSession } = await import('./db/init.js');
    const session = createSession(db, userId, {
      projectPath: body.projectPath,
      language: body.language
    });
    return { session };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to create session' });
  }
});

fastify.put('/api/sessions/:sessionId', async (request, reply) => {
  const { sessionId } = request.params;
  try {
    const { endSession } = await import('./db/init.js');
    endSession(db, sessionId);
    return { success: true };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to end session' });
  }
});

fastify.get('/api/sessions/:userId', async (request, reply) => {
  const { userId } = request.params;
  const { limit = '20' } = request.query;
  try {
    const sessions = db.prepare(`
      SELECT * FROM sessions 
      WHERE user_id = ? 
      ORDER BY started_at DESC 
      LIMIT ?
    `).all(userId, parseInt(limit));
    return { sessions };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to fetch sessions' });
  }
});

fastify.get('/api/weekly-bpi/:userId', async (request, reply) => {
  const { userId } = request.params;
  try {
    const { getWeeklyBPI } = await import('./db/init.js');
    const weeklyBPI = getWeeklyBPI(db, userId);
    return { weeklyBPI };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to fetch weekly BPI' });
  }
});

fastify.post('/api/preferences', async (request, reply) => {
  const body = request.body;
  try {
    const userId = getOrCreateUser(db, body.userId);
    const { saveUserPreferences } = await import('./db/init.js');
    saveUserPreferences(db, userId, {
      codingStartHour: body.codingStartHour,
      codingEndHour: body.codingEndHour,
      sleepStartHour: body.sleepStartHour,
      sleepEndHour: body.sleepEndHour
    });
    return { success: true };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to save preferences' });
  }
});

fastify.get('/api/preferences/:userId', async (request, reply) => {
  const { userId } = request.params;
  try {
    const { getUserPreferences } = await import('./db/init.js');
    const prefs = getUserPreferences(db, userId);
    return { preferences: prefs };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to fetch preferences' });
  }
});

fastify.post('/api/onboarding/complete', async (request, reply) => {
  const body = request.body;
  try {
    const userId = getOrCreateUser(db, body.userId);
    const { completeOnboarding } = await import('./db/init.js');
    completeOnboarding(db, userId);
    return { success: true };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to complete onboarding' });
  }
});

fastify.get('/api/daily-summary/:userId', async (request, reply) => {
  const { userId } = request.params;
  const { date } = request.query;
  try {
    const summary = db.prepare(`
      SELECT * FROM daily_summaries 
      WHERE user_id = ? AND date = ?
    `).get(userId, date || new Date().toISOString().split('T')[0]);
    return { summary };
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: 'Failed to fetch daily summary' });
  }
});

function broadcastToUser(userId, message) {
  const client = wsClients.get(userId);
  if (client && client.readyState === 1) {
    client.send(JSON.stringify(message));
  }
}

function broadcastToAll(message) {
  for (const client of wsClients.values()) {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  }
}

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 MindLint API running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export { fastify, broadcastToUser, broadcastToAll };
