import { motion } from 'framer-motion'

// Demo AI-generated insights
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
  const getIcon = (type) => {
    switch (type) {
      case 'session': return '🧠'
      case 'forecast': return '🌦'
      case 'nudge': return '💡'
      case 'weekly': return '📊'
      default: return '✨'
    }
  }

  const formatTime = (timestamp) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (compact) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🧠</span> AI Insights
        </h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-xl border border-emerald-500/20">
            <div className="flex items-start gap-3">
              <span className="text-2xl">☀️</span>
              <div>
                <p className="text-sm font-medium text-emerald-400">This Week's Theme</p>
                <p className="text-sm text-slate-300 mt-1">{demoInsights.weekly.metaphor}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Recent</p>
            {demoInsights.recent.slice(0, 2).map((insight, i) => (
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
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Weekly Report */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-8 border border-slate-700/50">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">📊 Weekly Cognitive Report</h2>
            <p className="text-slate-400">{demoInsights.weekly.metaphor}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Peak Window</p>
            <p className="text-xl font-bold text-emerald-400">
              {demoInsights.weekly.strongest_window.start}:00 - {demoInsights.weekly.strongest_window.end}:00
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Key Patterns */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Key Patterns</h3>
            <ul className="space-y-2">
              {demoInsights.weekly.key_patterns.map((pattern, i) => (
                <motion.li 
                  key={i}
                  className="flex items-start gap-2 text-slate-300"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <span className="text-blue-400 mt-1">→</span>
                  {pattern}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Suggestions */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Suggestions</h3>
            <ul className="space-y-2">
              {demoInsights.weekly.suggestions.map((suggestion, i) => (
                <motion.li 
                  key={i}
                  className="flex items-start gap-2 text-slate-300"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                >
                  <span className="text-emerald-400 mt-1">💡</span>
                  {suggestion}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* Concerns */}
        {demoInsights.weekly.concerns && (
          <motion.div 
            className="mt-6 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-sm text-amber-400">⚠️ {demoInsights.weekly.concerns[0]}</p>
          </motion.div>
        )}

        {/* Closing */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <p className="text-lg text-slate-300 italic">"{demoInsights.weekly.closing}"</p>
        </div>
      </div>

      {/* Recent Insights */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold mb-4">Recent AI Insights</h3>
        <div className="space-y-3">
          {demoInsights.recent.map((insight, i) => (
            <motion.div
              key={i}
              className="p-4 bg-slate-700/30 rounded-xl flex items-start gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <span className="text-2xl">{getIcon(insight.type)}</span>
              <div className="flex-1">
                <p className="text-slate-200">{insight.content}</p>
                <p className="text-xs text-slate-500 mt-2">{formatTime(insight.timestamp)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
