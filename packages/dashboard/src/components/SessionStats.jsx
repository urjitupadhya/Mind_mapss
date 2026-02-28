import { motion } from 'framer-motion'

export default function SessionStats() {
  const stats = {
    todaySessions: 4,
    todayMinutes: 187,
    avgStability: 72,
    streakDays: 12,
    totalSessions: 156,
    totalHours: 234
  }

  const getStabilityLevel = (stability) => {
    if (stability >= 80) return { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500/20' }
    if (stability >= 60) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/20' }
    if (stability >= 40) return { label: 'Moderate', color: 'text-amber-400', bg: 'bg-amber-500/20' }
    return { label: 'Low', color: 'text-red-400', bg: 'bg-red-500/20' }
  }

  const stability = getStabilityLevel(stats.avgStability)

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>📊</span> Today's Stats
      </h2>

      {/* Main stat */}
      <div className={`text-center p-4 rounded-xl ${stability.bg} mb-4`}>
        <p className="text-sm text-slate-400">Average Stability</p>
        <motion.p 
          className={`text-4xl font-bold ${stability.color}`}
          key={stats.avgStability}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
        >
          {stats.avgStability}%
        </motion.p>
        <p className="text-sm text-slate-500 mt-1">{stability.label}</p>
      </div>

      {/* Grid stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-700/30 rounded-lg text-center">
          <p className="text-2xl font-bold text-white">{stats.todaySessions}</p>
          <p className="text-xs text-slate-400">Sessions</p>
        </div>
        <div className="p-3 bg-slate-700/30 rounded-lg text-center">
          <p className="text-2xl font-bold text-white">{stats.todayMinutes}</p>
          <p className="text-xs text-slate-400">Minutes</p>
        </div>
        <div className="p-3 bg-slate-700/30 rounded-lg text-center">
          <p className="text-2xl font-bold text-emerald-400">🔥 {stats.streakDays}</p>
          <p className="text-xs text-slate-400">Day Streak</p>
        </div>
        <div className="p-3 bg-slate-700/30 rounded-lg text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.totalSessions}</p>
          <p className="text-xs text-slate-400">Total Sessions</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>Weekly Progress</span>
          <span>{stats.totalHours}h tracked</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: '65%' }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
      </div>
    </div>
  )
}
