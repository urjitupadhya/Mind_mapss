import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const BADGES = [
  { id: 'first_session', name: 'First Steps', description: 'Complete your first tracked session', emoji: '🌟', condition: (stats) => stats.totalSessions >= 1 },
  { id: 'streak_3', name: 'On a Roll', description: '3-day coding streak', emoji: '🔥', condition: (stats) => stats.currentStreak >= 3 },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day coding streak', emoji: '⚡', condition: (stats) => stats.currentStreak >= 7 },
  { id: 'streak_30', name: 'Monthly Master', description: '30-day coding streak', emoji: '👑', condition: (stats) => stats.currentStreak >= 30 },
  { id: 'early_bird', name: 'Early Bird', description: 'Code before 7 AM', emoji: '🐦', condition: (stats) => stats.earlySessions > 0 },
  { id: 'night_owl', name: 'Night Owl', description: 'Code after 10 PM', emoji: '🦉', condition: (stats) => stats.lateSessions > 0 },
  { id: 'flow_state', name: 'Flow Master', description: 'Achieve 80%+ flow state', emoji: '🌊', condition: (stats) => stats.peakFlow >= 80 },
  { id: 'low_strain', name: 'Zen Coder', description: 'Maintain low strain for 2+ hours', emoji: '🧘', condition: (stats) => stats.lowStreakMinutes >= 120 },
  { id: 'deep_work', name: 'Deep Work', description: '3+ hour focused session', emoji: '🎯', condition: (stats) => stats.longestSession >= 180 },
  { id: 'consistent', name: 'Consistency King', description: 'Code every day for 14 days', emoji: '📅', condition: (stats) => stats.daysTracked >= 14 }
]

export default function Gamification({ userId }) {
  const [stats, setStats] = useState({
    totalSessions: 12,
    currentStreak: 5,
    longestStreak: 12,
    totalHours: 45,
    earlySessions: 3,
    lateSessions: 7,
    peakFlow: 85,
    lowStreakMinutes: 180,
    longestSession: 210,
    daysTracked: 15,
    focusStreak: 3,
    recoveryStreak: 2,
    cleanCodeDays: 8
  })

  const [unlockedBadges, setUnlockedBadges] = useState(['first_session', 'streak_3', 'early_bird'])
  const [recentAchievements, setRecentAchievements] = useState([])

  useEffect(() => {
    const fetchGamification = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/gamification/${userId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.stats) setStats(data.stats)
          if (data.badges) setUnlockedBadges(data.badges)
        }
      } catch (e) {
        // Use demo data
      }
    }
    fetchGamification()
  }, [userId])

  useEffect(() => {
    const unlocked = BADGES.filter(b => b.condition(stats)).map(b => b.id)
    const newBadges = unlocked.filter(id => !unlockedBadges.includes(id))
    if (newBadges.length > 0) {
      setRecentAchievements(newBadges)
      setTimeout(() => setRecentAchievements([]), 5000)
    }
  }, [stats])

  return (
    <div className="space-y-6">
      {/* Recent Achievements Toast */}
      {recentAchievements.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4 rounded-xl shadow-lg z-50"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="font-bold">Achievement Unlocked!</p>
              <p className="text-sm">{BADGES.find(b => b.id === recentAchievements[0])?.name}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-3xl font-bold text-orange-400">🔥 {stats.currentStreak}</p>
          <p className="text-sm text-slate-400">Day Streak</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-3xl font-bold text-emerald-400">⏱ {stats.totalHours}h</p>
          <p className="text-sm text-slate-400">Total Tracked</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-3xl font-bold text-blue-400">🎯 {stats.focusStreak}</p>
          <p className="text-sm text-slate-400">Focus Streak</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-3xl font-bold text-purple-400">🛡️ {stats.recoveryStreak}</p>
          <p className="text-sm text-slate-400">Recovery Streak</p>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🏆</span> Achievements ({unlockedBadges.length}/{BADGES.length})
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {BADGES.map(badge => {
            const unlocked = unlockedBadges.includes(badge.id)
            return (
              <motion.div
                key={badge.id}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  unlocked 
                    ? 'border-yellow-500/50 bg-yellow-500/10' 
                    : 'border-slate-600 bg-slate-700/30 opacity-50'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-3xl block mb-2">{badge.emoji}</span>
                <p className={`font-medium text-sm ${unlocked ? 'text-yellow-400' : 'text-slate-500'}`}>
                  {badge.name}
                </p>
                <p className="text-xs text-slate-500 mt-1">{badge.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Streak Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-500/30">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🔥</span>
            <div>
              <p className="text-2xl font-bold text-orange-400">{stats.currentStreak} days</p>
              <p className="text-sm text-slate-400">Current Streak</p>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Longest: {stats.longestStreak} days</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl p-6 border border-emerald-500/30">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🧘</span>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{stats.recoveryStreak} days</p>
              <p className="text-sm text-slate-400">Recovery Streak</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">Taking healthy breaks!</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">✅</span>
            <div>
              <p className="text-2xl font-bold text-purple-400">{stats.cleanCodeDays} days</p>
              <p className="text-sm text-slate-400">Low Strain Days</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">Keep the strain low!</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="font-semibold mb-4">Next Milestones</h3>
        <div className="space-y-4">
          {[
            { name: 'Week Warrior (7-day streak)', current: stats.currentStreak, target: 7, emoji: '⚡' },
            { name: 'Monthly Master (30-day streak)', current: stats.currentStreak, target: 30, emoji: '👑' },
            { name: 'Deep Work (3hr session)', current: stats.longestSession / 60, target: 3, emoji: '🎯' }
          ].map(milestone => (
            <div key={milestone.name} className="flex items-center gap-4">
              <span className="text-xl">{milestone.emoji}</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">{milestone.name}</span>
                  <span className="text-slate-500">{Math.round(milestone.current)}/{milestone.target}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (milestone.current / milestone.target) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
