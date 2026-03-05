import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function EnvironmentContext({ realtimeData }) {
  const [envData, setEnvData] = useState(null)
  const [recommendation, setRecommendation] = useState('')
  const [location, setLocation] = useState({
    timezone: '',
    hour: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
    lat: null,
    lon: null
  })

  useEffect(() => {
    const fetchEnvData = async () => {
      let lat = 40.71;
      let lon = -74.01;

      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        lat = position.coords.latitude;
        lon = position.coords.longitude;
        setLocation(prev => ({ ...prev, lat, lon }));
      } catch (e) {
        console.warn('Geolocation failed, falling back to default location.');
      }

      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;

        const [weatherRes, aqiRes] = await Promise.all([
          fetch(weatherUrl),
          fetch(aqiUrl)
        ]);

        let weather = {};
        if (weatherRes.ok) {
          const data = await weatherRes.json();
          weather = {
            temperature: data.current_weather?.temperature,
            condition: getCondition(data.current_weather?.temperature),
            windSpeed: data.current_weather?.windspeed
          };
        }

        let aqi = null;
        if (aqiRes.ok) {
          const aqiData = await aqiRes.json();
          aqi = aqiData.current?.us_aqi;
        }

        setEnvData({ ...weather, aqi });
      } catch (e) {
        setEnvData({ temperature: 22, condition: 'mild', aqi: 42 });
      }
    }

    const getCondition = (temp) => {
      if (!temp) return 'unknown'
      if (temp > 30) return 'hot'
      if (temp > 22) return 'warm'
      if (temp > 15) return 'mild'
      if (temp > 5) return 'cool'
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
    }

    if (envData?.aqi > 100) {
      factors.push('poor_air_quality')
      riskScore += 15
    }

    if (envData?.condition === 'hot' || envData?.condition === 'cold') {
      factors.push('extreme_weather')
      riskScore += 10
    }

    if (realtimeData?.burnout_probability > 50) {
      riskScore += 20
    }

    if (factors.includes('late_night') && realtimeData?.burnout_probability > 30) {
      setRecommendation("⚠️ Late night + strain = high burnout risk. Wrap up soon.")
    } else if (envData?.aqi > 150) {
      setRecommendation("🌫️ Poor air quality detected. Ensure proper ventilation.")
    } else if (hour >= 14 && hour <= 16) {
      setRecommendation("☕ Post-lunch dip zone. A short walk might reset your focus.")
    } else if (riskScore < 20) {
      setRecommendation("🟢 Ideal conditions for deep focus work!")
    } else {
      setRecommendation("🟡 Moderate strain conditions. Stay mindful of your energy.")
    }

    setLocation(prev => ({ ...prev, hour, dayOfWeek }))
  }, [realtimeData, envData])

  const hour = new Date().getHours()
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const timeLabel = hour < 6 ? 'Late Night' : hour < 9 ? 'Early Morning' : hour < 12 ? 'Morning' : hour < 14 ? 'Mid-day' : hour < 18 ? 'Afternoon' : hour < 21 ? 'Evening' : 'Night'

  const getRiskColor = (risk) => {
    if (risk < 30) return 'bg-emerald-500'
    if (risk < 50) return 'bg-blue-500'
    if (risk < 75) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const combinedRisk = (realtimeData?.burnout_probability || 25) * 0.6 +
    (hour >= 22 || hour < 6 ? 20 : 0) +
    (envData?.aqi > 100 ? 15 : 0) +
    (envData?.condition === 'hot' ? 10 : 0)

  return (
    <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 card-hover">
      <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2">🌍 Environment context</span>
        {envData?.aqi && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${envData.aqi < 50 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
            AQI: {envData.aqi}
          </span>
        )}
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-900/40 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Time of Day</p>
          <p className="text-sm font-semibold text-white">{timeLabel}</p>
        </div>
        <div className="bg-slate-900/40 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Observation</p>
          <p className="text-sm font-semibold text-white">{envData?.condition || 'Analyzing...'}</p>
        </div>
        <div className="bg-slate-900/40 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Temperature</p>
          <p className="text-sm font-semibold text-white">{envData?.temperature ? `${envData.temperature}°C` : '--'}</p>
        </div>
        <div className="bg-slate-900/40 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Regional Context</p>
          <p className="text-sm font-semibold text-white">{location.lat ? 'Localized' : 'Standard'}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-[10px] uppercase tracking-wider text-slate-500 mb-2">
          <span>Environmental Strain</span>
          <span className="font-bold text-slate-300">{Math.round(combinedRisk)}%</span>
        </div>
        <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${getRiskColor(combinedRisk)}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, combinedRisk)}%` }}
            transition={{ type: 'spring', stiffness: 50 }}
          />
        </div>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3">
        <p className="text-xs text-blue-200/80 leading-relaxed italic">"{recommendation}"</p>
      </div>
    </div>
  )
}
