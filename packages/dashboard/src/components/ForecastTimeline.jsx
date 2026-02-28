import { motion } from 'framer-motion'

export default function ForecastTimeline({ data }) {
  const currentHour = new Date().getHours()
  
  const getRiskColor = (risk) => {
    if (risk < 30) return 'bg-emerald-500'
    if (risk < 50) return 'bg-blue-500'
    if (risk < 70) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const optimalStart = data.findIndex(d => d.risk_score < 35 && d.predicted_stability > 70)
  const optimalEnd = data.findLastIndex(d => d.risk_score < 35 && d.predicted_stability > 70)

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>🌦</span> 24-Hour Cognitive Forecast
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-slate-400">Optimal</span>
          <span className="w-3 h-3 rounded-full bg-amber-500 ml-2"></span>
          <span className="text-slate-400">Moderate</span>
          <span className="w-3 h-3 rounded-full bg-red-500 ml-2"></span>
          <span className="text-slate-400">High Risk</span>
        </div>
      </div>

      {/* Timeline bars */}
      <div className="relative h-32 mb-6">
        {/* Optimal window highlight */}
        {optimalStart !== -1 && optimalEnd !== -1 && (
          <div 
            className="absolute top-0 bottom-8 bg-emerald-500/20 rounded-lg border border-emerald-500/30"
            style={{
              left: `${(optimalStart / data.length) * 100}%`,
              width: `${((optimalEnd - optimalStart + 1) / data.length) * 100}%`
            }}
          >
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-emerald-400 whitespace-nowrap">
              Optimal Window
            </span>
          </div>
        )}

        {/* Risk bars */}
        <div className="absolute inset-0 flex items-end gap-1">
          {data.map((item, index) => (
            <motion.div
              key={index}
              className="flex-1 rounded-t-md relative"
              initial={{ height: 0 }}
              animate={{ height: `${item.risk_score}%` }}
              transition={{ delay: index * 0.02, duration: 0.3 }}
            >
              <div 
                className={`absolute inset-0 rounded-t-md ${getRiskColor(item.risk_score)}`}
                style={{ opacity: 0.7 + (item.confidence * 0.3) }}
              />
              {index === currentHour && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Hour labels */}
      <div className="flex justify-between text-xs text-slate-500">
        {data.filter((_, i) => i % 4 === 0).map((item, i) => (
          <span key={i}>{item.hour}:00</span>
        ))}
      </div>

      {/* Key insights */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700/50">
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase mb-1">Best Window</p>
          <p className="text-lg font-semibold text-emerald-400">
            {optimalStart !== -1 ? `${data[optimalStart].hour}:00 - ${data[optimalEnd].hour}:00` : 'N/A'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase mb-1">High Risk</p>
          <p className="text-lg font-semibold text-amber-400">
            {data.filter(d => d.risk_score > 50).length}h
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase mb-1">Avg Confidence</p>
          <p className="text-lg font-semibold text-blue-400">
            {Math.round(data.reduce((a, b) => a + b.confidence, 0) / data.length * 100)}%
          </p>
        </div>
      </div>
    </div>
  )
}
