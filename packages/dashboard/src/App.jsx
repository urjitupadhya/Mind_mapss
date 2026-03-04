import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import CognitiveHeatmap from './components/CognitiveHeatmap'
import ForecastTimeline from './components/ForecastTimeline'
import StabilityChart from './components/StabilityChart'
import AIReport from './components/AIReport'
import SessionStats from './components/SessionStats'
import ProductivityQuadrant from './components/ProductivityQuadrant'
import Onboarding from './components/Onboarding'
import Gamification from './components/Gamification'
import EnvironmentContext from './components/EnvironmentContext'

const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin)
const WS_BASE = API_BASE.replace(/^http/, 'ws')

const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options)
      if (response.ok) return response
    } catch (e) {
      if (i === retries - 1) throw e
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw new Error(`Failed after ${retries} attempts`)
}

const generateDemoData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const heatmapData = days.map(day => ({
    day,
    hours: hours.map(hour => {
      let stability = 70
      if (hour >= 9 && hour <= 11) stability = 85
      if (hour >= 14 && hour <= 16) stability = 75
      if (hour >= 20 && hour <= 22) stability = 60
      if (hour >= 23 || hour <= 5) stability = 45
      if (day === 'Sat' || day === 'Sun') stability -= 15

      return { hour, stability: Math.max(20, Math.min(100, stability + (Math.random() * 20 - 10))) }
    })
  }))

  const forecastData = hours.map(hour => ({
    hour,
    predicted_stability: Math.max(30, 70 + Math.sin((hour - 6) * Math.PI / 12) * 30 + Math.random() * 10),
    risk_score: Math.max(0, 50 - Math.sin((hour - 6) * Math.PI / 12) * 30 + Math.random() * 15),
    confidence: 0.7 + Math.random() * 0.2
  }))

  const weeklyData = days.map((day, i) => ({
    day,
    stability: 60 + Math.random() * 30,
    complexity: 2 + Math.random() * 6,
    sessions: Math.floor(3 + Math.random() * 5)
  }))

  const quadrantData = {
    highHigh: { count: 8, label: 'High Focus / High Energy' },
    highLow: { count: 4, label: 'High Focus / Low Energy' },
    lowHigh: { count: 3, label: 'Low Focus / High Energy' },
    lowLow: { count: 2, label: 'Low Focus / Low Energy' }
  }

  return { heatmapData, forecastData, weeklyData, quadrantData, bpiScore: 35 }
}

const fetchRealData = async (userId) => {
  try {
    const [aggregatesRes, bpiRes, forecastRes] = await Promise.all([
      fetchWithRetry(`${API_BASE}/api/aggregates/${userId}?days=7`),
      fetchWithRetry(`${API_BASE}/api/bpi/${userId}?days=7`),
      fetchWithRetry(`${API_BASE}/api/forecasts/${userId}`)
    ])

    const aggregates = await aggregatesRes.json()
    const bpi = await bpiRes.json()
    const forecasts = await forecastRes.json()

    if (!aggregates.aggregates || aggregates.aggregates.length === 0) {
      return null
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const hours = Array.from({ length: 24 }, (_, i) => i)

    const heatmapData = days.map((day, dayIndex) => {
      const dayAggregates = aggregates.aggregates.filter(a => {
        const d = new Date(a.date)
        return d.getDay() === (dayIndex + 1) % 7
      })
      return {
        day,
        hours: hours.map(hour => {
          const hourData = dayAggregates.find(a => a.hour === hour)
          return {
            hour,
            stability: hourData?.avg_stability || 70
          }
        })
      }
    })

    const forecastData = forecasts.forecasts?.slice(0, 24).map(f => ({
      hour: f.hour,
      predicted_stability: f.predicted_stability,
      risk_score: f.risk_score,
      confidence: f.confidence
    })) || []

    const weeklyData = days.map((day, dayIndex) => {
      const dayAggregates = aggregates.aggregates.filter(a => {
        const d = new Date(a.date)
        return d.getDay() === (dayIndex + 1) % 7
      })
      const avgStability = dayAggregates.reduce((s, a) => s + (a.avg_stability || 0), 0) / (dayAggregates.length || 1)
      return {
        day,
        stability: avgStability || 70,
        complexity: 4 + Math.random() * 4,
        sessions: dayAggregates.length || 0
      }
    })

    return { heatmapData, forecastData, weeklyData, bpi: bpi.bpi }
  } catch (e) {
    console.log('Using demo data:', e.message)
    return null
  }
}

function App() {
  const [data, setData] = useState(null)
  const [userId] = useState(() => localStorage.getItem('mindlint_userId') || 'demo-user')
  const [currentStability, setCurrentStability] = useState(78)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [realtimeData, setRealtimeData] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [quadrantData, setQuadrantData] = useState(null)
  const [bpiscore, setBpiScore] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('mindlint_onboarding_complete') !== 'true'
  })
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const realData = await fetchRealData(userId)
      if (realData) {
        setData(realData)
        setIsDemoMode(false)
        if (realData.bpi && realData.bpi.length > 0) {
          const avgBPI = realData.bpi.reduce((sum, m) => sum + (m.burnout_probability || 0), 0) / realData.bpi.length
          setBpiScore(Math.round(avgBPI))
        }
      } else {
        const demo = generateDemoData()
        setData(demo)
        setQuadrantData(demo.quadrantData)
        setBpiScore(demo.bpiScore)
        setIsDemoMode(true)
      }
      setLoading(false)
    }
    loadData()
  }, [userId])

  useEffect(() => {
    if (isDemoMode) return

    let ws = null
    let reconnectTimeout = null

    const connectWebSocket = () => {
      try {
        const wsUrl = `${WS_BASE}/ws/${userId}`
        ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          setIsConnected(true)
          console.log('MindLint: WebSocket connected')
        }

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            if (message.type === 'realtime_update') {
              setRealtimeData(message.data)
              setCurrentStability(message.data.cognitive_score || message.data.ema_cognitive_score || 75)
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e)
          }
        }

        ws.onclose = () => {
          setIsConnected(false)
          reconnectTimeout = setTimeout(connectWebSocket, 3000)
        }

        ws.onerror = (error) => {
          console.log('WebSocket error, will retry...')
        }
      } catch (e) {
        console.log('WebSocket connection failed, using demo mode')
      }
    }

    connectWebSocket()

    return () => {
      if (ws) ws.close()
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [userId, isDemoMode])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStability(prev => {
        const target = realtimeData?.cognitive_score || realtimeData?.ema_cognitive_score || 75
        return Math.max(20, Math.min(100, prev + (target - prev) * 0.1 + (Math.random() * 6 - 3)))
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [realtimeData])

  const getStabilityColor = (stability) => {
    if (stability >= 80) return 'text-mindlint-calm'
    if (stability >= 60) return 'text-mindlint-stable'
    if (stability >= 40) return 'text-mindlint-moderate'
    return 'text-mindlint-critical'
  }

  const getStabilityLabel = (stability) => {
    if (stability >= 80) return 'Flow State'
    if (stability >= 60) return 'Stable'
    if (stability >= 40) return 'Moderate'
    return 'Strained'
  }

  return (
    <div className="min-h-screen gradient-mesh">
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">MindLint</h1>
              <p className="text-xs text-slate-400">Cognitive Weather System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 text-xs ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></div>
              {isConnected ? 'Live' : 'Demo'}
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Current Stability</p>
              <motion.p
                className={`text-2xl font-bold ${getStabilityColor(currentStability)}`}
                key={Math.round(currentStability)}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
              >
                {Math.round(currentStability)}%
              </motion.p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${currentStability >= 60 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
              }`}>
              {getStabilityLabel(currentStability)}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'forecast', label: 'Forecast', icon: '🌦' },
            { id: 'insights', label: 'AI Insights', icon: '🧠' },
            { id: 'quadrant', label: 'Quadrant', icon: '🎯' },
            { id: 'sessions', label: 'Sessions', icon: '📈' },
            { id: 'gamification', label: 'Achievements', icon: '🏆' },
            { id: 'environment', label: 'Environment', icon: '🌍' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400">Loading...</div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                <div className="lg:col-span-2 bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 card-hover">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>🧠</span> Weekly Cognitive Heatmap
                  </h2>
                  {data && <CognitiveHeatmap data={data.heatmapData} />}
                </div>

                <div className="space-y-6">
                  <SessionStats bpi={bpiscore} />
                  <ProductivityQuadrant data={quadrantData} />
                  <EnvironmentContext realtimeData={realtimeData} />
                  <AIReport compact />
                </div>
              </motion.div>
            )}

            {activeTab === 'forecast' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <ForecastTimeline data={data?.forecastData} />
              </motion.div>
            )}

            {activeTab === 'insights' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AIReport />
              </motion.div>
            )}

            {activeTab === 'quadrant' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto"
              >
                <ProductivityQuadrant data={quadrantData} />
              </motion.div>
            )}

            {activeTab === 'sessions' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <StabilityChart data={data?.weeklyData} />
              </motion.div>
            )}

            {activeTab === 'gamification' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Gamification userId={userId} />
              </motion.div>
            )}

            {activeTab === 'environment' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto"
              >
                <EnvironmentContext realtimeData={realtimeData} />
              </motion.div>
            )}
          </>
        )}
      </main>

      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}

      <footer className="border-t border-slate-700/50 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>🔒 Privacy-first: No raw code leaves your device. Only aggregated metrics are stored.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
