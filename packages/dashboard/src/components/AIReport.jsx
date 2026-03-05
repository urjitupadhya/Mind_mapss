import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin)

const demoInsights = {
  weekly: {
    metaphor: "A week of clear skies with some afternoon clouds",
    key_patterns: [
      "Morning sessions (9-11 AM) show your highest stability",
      "Error rates tend to spike around 3-4 PM (post-lunch dip)",
      "Your deepest flow states occur during morning deep work blocks"
    ],
    strongest_window: { start: 9, end: 12 },
    concerns: ["Late night sessions on Thursday may have impacted Friday's focus"],
    suggestions: [
      "Protect 9 AM - 12 PM for deep work - it's your peak window",
      "Schedule routine tasks for afternoon to work with your energy",
      "Consider earlier wrap-up on Thursdays for better Friday performance"
    ],
    closing: "Overall, a productive week with clear patterns emerging. You're building strong habits!"
  },
  recent: [
    {
      type: 'session',
      content: 'Your current session shows steady typing patterns with occasional variance. Consider taking a short break to maintain peak performance.',
      timestamp: Date.now() - 3600000
    },
    {
      type: 'forecast',
      content: 'Optimal deep work window approaching: 9 AM - 12 PM with predicted stability of 85%.',
      timestamp: Date.now() - 7200000
    },
    {
      type: 'nudge',
      content: "Taking a quick break might reset your debugging perspective.",
      timestamp: Date.now() - 1800000
    }
  ]
}

export default function AIReport({ compact = false }) {
  const [insights, setInsights] = useState(demoInsights.recent)
  const [weeklyReport, setWeeklyReport] = useState(demoInsights.weekly)
  const [loading, setLoading] = useState(true)
  const [userId] = useState(() => localStorage.getItem('mindlint_userId') || 'demo-user')

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/insights/${userId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.insights && data.insights.length > 0) {
            const mappedInsights = data.insights.map(i => ({
              type: i.insight_type,
              content: i.content,
              timestamp: i.created_at
            }))
            setInsights(mappedInsights)

            // Try to find a weekly report in the insights
            const weekly = data.insights.find(i => i.insight_type === 'weekly')
            if (weekly && weekly.data_payload) {
              setWeeklyReport(JSON.parse(weekly.data_payload))
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch AI insights:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [userId])

  const getIcon = (type) => {
    switch (type) {
      case 'session': return '🧠'
      case 'forecast': return '🌦'
      case 'nudge': return '💡'
      case 'weekly': return '📊'
      default: return '✨'
    }
  }

  const generateFreshInsight = async (type) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/insights/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          insightType: type,
          context: type === 'weekly' ? { dailyData: [] } : { hour: new Date().getHours(), avg_stability: 75, error_rate: 0.05, complexity_index: 5, session_duration: 60 }
        })
      })
      if (response.ok) {
        const data = await response.json()
        // Refresh insights list
        const listRes = await fetch(`${API_BASE}/api/insights/${userId}`)
        if (listRes.ok) {
          const listData = await listRes.json()
          const mapped = listData.insights.map(i => ({
            type: i.insight_type,
            content: i.content,
            timestamp: i.created_at
          }))
          setInsights(mapped)

          if (type === 'weekly') {
            const weekly = listData.insights.find(i => i.insight_type === 'weekly')
            if (weekly && weekly.data_payload) {
              setWeeklyReport(JSON.parse(weekly.data_payload))
            }
          }
        }
      }
    } catch (e) {
      console.error('Generation failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (compact) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 card-hover">
        <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">🧠 AI Insights</span>
          <button
            onClick={() => generateFreshInsight('nudge')}
            className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/30 transition-colors"
          >
            REFRESH
          </button>
        </h2>

        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-xl border border-emerald-500/20">
            <div className="flex items-start gap-3">
              <span className="text-2xl">☀️</span>
              <div>
                <p className="text-sm font-medium text-emerald-400">This Week's Theme</p>
                <p className="text-sm text-slate-300 mt-1">{weeklyReport.metaphor}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Recent</p>
            <AnimatePresence>
              {insights.slice(0, 2).map((insight, i) => (
                <motion.div
                  key={i}
                  className="p-3 bg-slate-700/30 rounded-lg"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-start gap-2">
                    <span>{getIcon(insight.type)}</span>
                    <p className="text-sm text-slate-300 flex-1">{insight.content}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{formatTime(insight.timestamp)}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Weekly Report */}
      <motion.div
        className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-8 border border-slate-700/50 shadow-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute top-0 right-0 p-4">
          <button
            onClick={() => generateFreshInsight('weekly')}
            disabled={loading}
            className="text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/30 transition-all disabled:opacity-50"
          >
            {loading ? 'ANALYZING...' : 'REFRESH REPORT'}
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <span className="p-2 bg-emerald-500/20 rounded-lg">📊</span> Weekly Cognitive Report
            </h2>
            <p className="text-slate-400 italic text-lg px-2 border-l-2 border-emerald-500/50">
              "{weeklyReport.metaphor}"
            </p>
          </div>
          {weeklyReport.strongest_window && (
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 text-center min-w-[160px]">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Peak AI flow</p>
              <p className="text-2xl font-black text-emerald-400">
                {weeklyReport.strongest_window.start}:00 - {weeklyReport.strongest_window.end}:00
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Key Patterns */}
          <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-700/30">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Key Patterns
            </h3>
            <ul className="space-y-3">
              {weeklyReport.key_patterns.map((pattern, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-3 text-slate-300 group"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <span className="text-blue-500 mt-1 transition-transform group-hover:translate-x-1">→</span>
                  <span className="text-sm leading-relaxed">{pattern}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Suggestions */}
          <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-700/30">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Strategy Suggestions
            </h3>
            <ul className="space-y-3">
              {weeklyReport.suggestions.map((suggestion, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-3 text-slate-300 group"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                >
                  <span className="text-emerald-500 mt-0.5 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">💡</span>
                  <span className="text-sm leading-relaxed">{suggestion}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* Concerns */}
        {weeklyReport.concerns && weeklyReport.concerns.length > 0 && (
          <motion.div
            className="mt-8 p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="text-xl">⚠️</span>
            <p className="text-sm text-amber-200/80">{weeklyReport.concerns[0]}</p>
          </motion.div>
        )}

        {/* Closing */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
          <p className="text-slate-400 text-sm font-medium italic">"{weeklyReport.closing}"</p>
          <div className="flex gap-1">
            {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-slate-700"></div>)}
          </div>
        </div>
      </motion.div>

      {/* Recent Insights */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold mb-6 flex items-center justify-between">
          <span>Recent AI Activity</span>
          <div className="flex gap-2">
            <button
              onClick={() => generateFreshInsight('nudge')}
              className="text-[10px] font-bold bg-slate-700 text-slate-400 px-3 py-1 rounded hover:text-white transition-colors"
            >
              TRIGGER NUDGE
            </button>
          </div>
          {loading && <span className="text-xs text-slate-500 animate-pulse">Refreshing...</span>}
        </h3>
        <div className="space-y-3">
          <AnimatePresence>
            {insights.map((insight, i) => (
              <motion.div
                key={`${insight.timestamp}-${i}`}
                className="p-4 bg-slate-900/40 hover:bg-slate-900/60 transition-colors rounded-xl flex items-start gap-4 border border-slate-700/30"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
              >
                <span className="text-2xl p-2 bg-slate-800 rounded-lg">{getIcon(insight.type)}</span>
                <div className="flex-1">
                  <p className="text-slate-200 text-sm leading-relaxed">{insight.content}</p>
                  <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    <span>{formatTime(insight.timestamp)}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    <span>AI Model Alpha</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
