import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'

export const AlertBanner = ({ type = 'warning', message, onDismiss, darkMode = false }) => {
  const [dismissed, setDismissed] = useState(false)

  const colors = darkMode
    ? {
        warning: 'bg-amber-950/70 border-amber-500/40 text-amber-100',
        danger: 'bg-red-950/70 border-red-500/40 text-red-100',
        info: 'bg-sky-950/70 border-sky-500/40 text-sky-100',
        success: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-100',
      }
    : {
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        danger: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        success: 'bg-green-50 border-green-200 text-green-800',
      }

  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    if (onDismiss) onDismiss()
  }

  return (
    <div className={`${colors[type]} border-l-4 rounded-r-lg p-4 mb-4 flex items-start gap-3`}>
      <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium">{message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className={`flex-shrink-0 ${darkMode ? 'text-white/50 hover:text-white/80' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <X size={18} />
      </button>
    </div>
  )
}

