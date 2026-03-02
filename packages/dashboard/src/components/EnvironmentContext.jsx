import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function EnvironmentContext({ realtimeData }) {
  const [envData, setEnvData] = useState(null)
  const [recommendation, setRecommendation] = useState('')
  const [location, setLocation] = useState({ timezone: '', hour: new Date().getHours(), dayOfWeek: new Date().getDay() })

  useEffect(() => {
    const fetchEnvData = async () => {
      try {
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current_weather=true')
        if (response.ok) {
          const data = await response.json()
          setEnvData({
            temperature: data.current_weather?.temperature,
            condition: getCondition(data.current_weather?.temperature),
            windSpeed: data.current_weather?.windspeed
          })
        }
      } catch (e) {
        setEnvData({ temperature: 22, condition: 'mild' })
      }
    }

    const getCondition = (temp) => {
      if (!temp) return 'unknown'
      if (temp > 30) return 'hot'
      if (temp > 20) return 'warm'
      if (temp > 10) return 'mild'
      if (temp > 0) return 'cool'
      return 'cold'
    }

    fetchEnvData()
    const interval = setInterval(fetchEnvData, 600000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const hour = new Date().getHours()
    const dayOfWeek = new Date().getDay()
    const factors = []
    let riskScore = 0

    if (hour >= 22 || hour < 6) {
      factors.push('late_night')
      riskScore += 25
    } else if (hour >= 20 || hour < 8) {
      factors.push('evening')
      riskScore += 10
    }

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      factors.push('weekend')
      riskScore -= 10
    }

    if (envData?.condition === 'hot' || envData?.condition === 'cold') {
      factors.push('extreme_weather')
      riskScore += 10
    }

    if (realtimeData?.burnout_probability > 50) {
      factors.push('high_cognitive_load')
      riskScore += realtimeData.burnout_probability
    }

    if (factors.includes('late_night') && realtimeData?.burnout_probability > 30) {
      setRecommendation("⚠️ Late night + cognitive strain = high burnout risk. Consider stopping soon.")
    } else if (factors.includes('weekend')) {
      setRecommendation("🟢 Weekend coding - enjoy! Just balance work and rest.")
    } else if (hour >= 14 && hour <= 16) {
      setRecommendation("☕ Post-lunch dip zone. A short walk might help maintain focus.")
    } else if (riskScore < 20) {
      setRecommendation("🟢 Great conditions for deep focus work!")
    } else {
      setRecommendation("🟡 Moderate conditions. Stay mindful of your energy levels.")
    }

    setLocation(prev => ({ ...prev, hour, dayOfWeek }))
  }, [realtimeData, envData])

  const hour = new Date().getHours()
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const timeLabels = ['Early', 'Morning', 'Mid-day', 'Afternoon', 'Evening', 'Night', 'Late']
  const timeLabel = hour < 6 ? 'Late' : hour < 9 ? 'Early' : hour < 12 ? 'Morning' : hour < 14 ? 'Mid-day' : hour < 18 ? 'Afternoon' : hour < 21 ? 'Evening' : 'Night'

  const getRiskColor = (risk) => {
    if (risk < 20) return 'bg-emerald-500'
    if (risk < 40) return 'bg-blue-500'
    if (risk < 60) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const combinedRisk = (realtimeData?.burnout_probability || 25) + (hour >= 22 || hour < 6 ? 15 : 0) + (envData?.condition === 'hot' ? 10 : 0)

  return (
    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
      <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
        <span>🌍</span> Environment Context
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-slate-700/30 rounded-lg p-2 text-center">
          <p className="text-xs text-slate-500">Time</p>
          <p className="font-medium text-white">{timeLabel}</p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-2 text-center">
          <p className="text-xs text-slate-500">Day</p>
          <p className="font-medium text-white">{dayNames[location.dayOfWeek]}</p>
        </div>
        {envData && (
          <>
            <div className="bg-slate-700/30 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-500">Weather</p>
              <p className="font-medium text-white">{envData.condition}</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-500">Temp</p>
              <p className="font-medium text-white">{envData.temperature}°C</p>
            </div>
          </>
        )}
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Combined Risk</span>
          <span>{Math.round(combinedRisk)}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${getRiskColor(combinedRisk)}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, combinedRisk)}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-slate-400">{recommendation}</p>
    </div>
  )
}
