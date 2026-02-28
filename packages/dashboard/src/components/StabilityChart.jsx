import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { motion } from 'framer-motion'

export default function StabilityChart({ data }) {
  const chartData = data.map((d, i) => ({
    day: d.day,
    stability: Math.round(d.stability),
    complexity: Math.round(d.complexity * 10) / 10,
    sessions: d.sessions
  }))

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
      <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <span>📈</span> Stability vs Complexity Trend
      </h2>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="stabilityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="complexityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="day" 
              stroke="#64748b" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={12}
              tickLine={false}
              yAxisId="left"
            />
            <YAxis 
              orientation="right" 
              stroke="#64748b" 
              fontSize={12}
              tickLine={false}
              yAxisId="right"
              domain={[0, 10]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="stability"
              stroke="#10B981"
              fill="url(#stabilityGradient)"
              strokeWidth={2}
              name="Stability"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="complexity"
              stroke="#F59E0B"
              fill="url(#complexityGradient)"
              strokeWidth={2}
              name="Complexity"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-sm text-slate-400">Stability (0-100)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-sm text-slate-400">Complexity (1-10)</span>
        </div>
      </div>
    </div>
  )
}
