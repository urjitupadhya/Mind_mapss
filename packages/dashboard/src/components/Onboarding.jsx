import { useState } from 'react'
import { motion } from 'framer-motion'

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [preferences, setPreferences] = useState({
    codingStartHour: 9,
    codingEndHour: 18,
    sleepStartHour: 22,
    sleepEndHour: 6,
    workType: 'mixed',
    baselineCalibration: true
  })

  const steps = [
    {
      title: 'Welcome to MindLint',
      description: 'Your personal cognitive weather system for coding wellness.',
      content: (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🧠</div>
          <p className="text-slate-300 mb-4">
            MindLint tracks your cognitive patterns while you code to help you work smarter, not harder.
          </p>
          <p className="text-sm text-slate-500">
            All data stays local. We only store aggregated metrics - never your code.
          </p>
        </div>
      )
    },
    {
      title: 'Your Coding Hours',
      description: 'When do you typically code?',
      content: (
        <div className="py-4 space-y-6">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Start Hour</label>
            <select 
              value={preferences.codingStartHour}
              onChange={(e) => setPreferences({...preferences, codingStartHour: parseInt(e.target.value)})}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
            >
              {Array.from({length: 24}, (_, i) => (
                <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">End Hour</label>
            <select 
              value={preferences.codingEndHour}
              onChange={(e) => setPreferences({...preferences, codingEndHour: parseInt(e.target.value)})}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
            >
              {Array.from({length: 24}, (_, i) => (
                <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
        </div>
      )
    },
    {
      title: 'Sleep Window',
      description: 'When do you typically sleep?',
      content: (
        <div className="py-4 space-y-6">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Bedtime</label>
            <select 
              value={preferences.sleepStartHour}
              onChange={(e) => setPreferences({...preferences, sleepStartHour: parseInt(e.target.value)})}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
            >
              {Array.from({length: 24}, (_, i) => (
                <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Wake Time</label>
            <select 
              value={preferences.sleepEndHour}
              onChange={(e) => setPreferences({...preferences, sleepEndHour: parseInt(e.target.value)})}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
            >
              {Array.from({length: 24}, (_, i) => (
                <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
        </div>
      )
    },
    {
      title: 'Work Type',
      description: 'What kind of coding do you do most?',
      content: (
        <div className="py-4 grid grid-cols-2 gap-4">
          {[
            { id: 'frontend', label: 'Frontend', emoji: '🎨' },
            { id: 'backend', label: 'Backend', emoji: '⚙️' },
            { id: 'dsa', label: 'DSA/Algorithms', emoji: '🧮' },
            { id: 'mixed', label: 'Mixed', emoji: '🔀' }
          ].map(type => (
            <button
              key={type.id}
              onClick={() => setPreferences({...preferences, workType: type.id})}
              className={`p-6 rounded-xl border-2 transition-all ${
                preferences.workType === type.id 
                  ? 'border-blue-500 bg-blue-500/20' 
                  : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
              }`}
            >
              <span className="text-3xl block mb-2">{type.emoji}</span>
              <span className="text-white font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      )
    },
    {
      title: 'Calibration Period',
      description: 'MindLint will learn your baseline patterns over 3 days.',
      content: (
        <div className="py-6 text-center">
          <div className="text-5xl mb-4">📈</div>
          <p className="text-slate-300 mb-4">
            During the calibration period, we'll gather baseline data to personalize your cognitive score.
          </p>
          <div className="bg-slate-700/50 rounded-lg p-4 text-left max-w-sm mx-auto">
            <h4 className="text-white font-medium mb-2">What we track:</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Typing patterns and consistency</li>
              <li>• Error frequency</li>
              <li>• File switching behavior</li>
              <li>• Session duration</li>
            </ul>
          </div>
        </div>
      )
    }
  ]

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      localStorage.setItem('mindlint_onboarding_complete', 'true')
      localStorage.setItem('mindlint_preferences', JSON.stringify(preferences))
      onComplete(preferences)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/95 flex items-center justify-center z-50">
      <motion.div 
        className="max-w-lg w-full mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-slate-700">
            <motion.div 
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="p-8">
            <div className="text-sm text-slate-500 mb-2">Step {step + 1} of {steps.length}</div>
            <h2 className="text-2xl font-bold text-white mb-2">{steps[step].title}</h2>
            <p className="text-slate-400 mb-6">{steps[step].description}</p>

            {steps[step].content}
          </div>

          <div className="px-8 pb-8 flex gap-4">
            {step > 0 && (
              <button 
                onClick={handleBack}
                className="px-6 py-3 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
              >
                Back
              </button>
            )}
            <button 
              onClick={handleNext}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-medium hover:opacity-90 transition-all"
            >
              {step === steps.length - 1 ? 'Get Started' : 'Continue'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
