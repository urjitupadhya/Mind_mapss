import { motion } from 'framer-motion'

export default function CognitiveHeatmap({ data }) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const getColor = (stability) => {
    if (stability >= 80) return 'bg-emerald-500'
    if (stability >= 60) return 'bg-blue-500'
    if (stability >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getIntensity = (stability) => {
    const alpha = Math.max(0.2, Math.min(1, stability / 100))
    return alpha
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500">
        Loading heatmap data...
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Hour labels */}
        <div className="flex mb-2 ml-16">
          {hours.filter((_, i) => i % 3 === 0).map(hour => (
            <div 
              key={hour} 
              className="text-xs text-slate-500 flex-1 text-center"
              style={{ flex: '0 0 12.5%' }}
            >
              {hour}:00
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="space-y-1">
          {data.map((day, dayIndex) => (
            <motion.div 
              key={day.day}
              className="flex items-center gap-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: dayIndex * 0.05 }}
            >
              <div className="w-14 text-xs text-slate-400 font-medium">{day.day}</div>
              <div className="flex-1 flex gap-0.5">
                {day.hours.map((hourData, hourIndex) => (
                  <motion.div
                    key={hourIndex}
                    className={`h-6 rounded ${getColor(hourData.stability)}`}
                    style={{ 
                      flex: '0 0 4.17%',
                      opacity: getIntensity(hourData.stability)
                    }}
                    whileHover={{ scale: 1.2, zIndex: 10 }}
                    title={`${day.day} ${hourData.hour}:00 - Stability: ${Math.round(hourData.stability)}%`}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-4 mt-4 pt-4 border-t border-slate-700/50">
          <span className="text-xs text-slate-500">Low</span>
          <div className="flex gap-1">
            {[20, 40, 60, 80, 100].map(s => (
              <div 
                key={s}
                className={`w-4 h-4 rounded ${getColor(s)}`}
                style={{ opacity: getIntensity(s) }}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500">High</span>
        </div>
      </div>
    </div>
  )
}
