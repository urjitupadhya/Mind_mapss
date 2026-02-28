import { motion } from 'framer-motion'

export default function ProductivityQuadrant({ data }) {
  const quadrant = data || {
    quadrant: 'flow',
    label: 'Flow State',
    description: 'You\'re in the zone! High productivity with manageable strain levels.',
    recommendation: 'Great time for deep work. Consider a short break to maintain this state.',
    color: '#22c55e',
    productivity: 72,
    strain: 28
  }

  const getQuadrantPosition = () => {
    const x = quadrant.productivity
    const y = quadrant.strain
    return {
      x: `${x}%`,
      y: `${100 - y}%`
    }
  }

  const getQuadrantLabel = () => {
    const pos = getQuadrantPosition()
    if (quadrant.productivity >= 60 && quadrant.strain < 40) return 'Flow'
    if (quadrant.productivity >= 60 && quadrant.strain >= 40) return 'Overdrive'
    if (quadrant.productivity < 60 && quadrant.strain >= 40) return 'Burnout Risk'
    return 'Recovery'
  }

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>🎯</span> Productivity Quadrant
      </h2>

      {/* Quadrant Chart */}
      <div className="relative w-full aspect-square max-w-xs mx-auto mb-4">
        {/* Background quadrants */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 rounded-xl overflow-hidden">
          <div className="bg-emerald-500/20 border-r border-b border-slate-600/50 p-2">
            <span className="text-xs text-emerald-400 font-medium">Flow</span>
          </div>
          <div className="bg-orange-500/20 border-b border-slate-600/50 p-2">
            <span className="text-xs text-orange-400 font-medium">Overdrive</span>
          </div>
          <div className="bg-red-500/20 border-r border-slate-600/50 p-2">
            <span className="text-xs text-red-400 font-medium">Burnout</span>
          </div>
          <div className="bg-blue-500/20 p-2">
            <span className="text-xs text-blue-400 font-medium">Recovery</span>
          </div>
        </div>

        {/* Axis lines */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-px bg-slate-500/30"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-full w-px bg-slate-500/30"></div>
        </div>

        {/* Labels */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-slate-500">
          Productivity →
        </div>
        <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-slate-500">
          Strain →
        </div>

        {/* Current position dot */}
        <motion.div 
          className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
          style={{ 
            backgroundColor: quadrant.color,
            left: `calc(${getQuadrantPosition().x} - 12px)`,
            top: `calc(${getQuadrantPosition().y} - 12px)`
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <div className="w-2 h-2 bg-white rounded-full" />
        </motion.div>
      </div>

      {/* Current State */}
      <div className="text-center mb-4">
        <motion.div 
          className="inline-block px-4 py-2 rounded-full text-sm font-medium"
          style={{ backgroundColor: `${quadrant.color}20`, color: quadrant.color }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {quadrant.label}
        </motion.div>
        <p className="text-sm text-slate-400 mt-2">{quadrant.description}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-700/30 rounded-lg text-center">
          <p className="text-2xl font-bold text-white">{quadrant.productivity}%</p>
          <p className="text-xs text-slate-400">Productivity</p>
        </div>
        <div className="p-3 bg-slate-700/30 rounded-lg text-center">
          <p className="text-2xl font-bold text-white">{quadrant.strain}%</p>
          <p className="text-xs text-slate-400">Strain</p>
        </div>
      </div>

      {/* Recommendation */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-xs text-blue-400 font-medium mb-1">💡 Recommendation</p>
        <p className="text-sm text-slate-300">{quadrant.recommendation}</p>
      </div>
    </div>
  )
}
