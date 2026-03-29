import {
  Activity,
  AlertTriangle,
  Droplet,
  Gauge,
  GaugeCircle,
  ShieldAlert,
  Thermometer,
  Waves,
} from 'lucide-react'

const icons = {
  heartRate: Activity,
  spo2: Droplet,
  ambientTemperature: Thermometer,
  humidity: Droplet,
  noiseLevel: Waves,
  airQualityPpm: GaugeCircle,
  vibrationLevel: ShieldAlert,
  tiltAngle: Gauge,
}

const colors = {
  heartRate: 'text-red-500',
  spo2: 'text-blue-500',
  ambientTemperature: 'text-orange-500',
  humidity: 'text-cyan-500',
  noiseLevel: 'text-violet-500',
  airQualityPpm: 'text-amber-500',
  vibrationLevel: 'text-rose-500',
  tiltAngle: 'text-emerald-500',
}

const bgColors = {
  heartRate: 'bg-red-50',
  spo2: 'bg-blue-50',
  ambientTemperature: 'bg-orange-50',
  humidity: 'bg-cyan-50',
  noiseLevel: 'bg-violet-50',
  airQualityPpm: 'bg-amber-50',
  vibrationLevel: 'bg-rose-50',
  tiltAngle: 'bg-emerald-50',
}

export const VitalSignCard = ({ type, value, unit, label, status = 'normal', sensor, isNightMode = false }) => {
  const Icon = icons[type] || Activity
  const statusColors = {
    normal: isNightMode ? 'text-emerald-300' : 'text-primary-green',
    danger: isNightMode ? 'text-red-200' : 'text-red-600',
  }
  const statusRing = {
    normal: isNightMode ? 'ring-emerald-700/50' : 'ring-emerald-200',
    danger: isNightMode ? 'ring-red-700/50' : 'ring-red-200',
  }
  const shellClass = isNightMode
    ? 'bg-slate-900/85 border-slate-700 text-slate-100'
    : `${bgColors[type] || 'bg-slate-50'} border-white/40 text-slate-900`
  const iconClass = isNightMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white/70 border-white/40'
  const mutedText = isNightMode ? 'text-slate-300' : 'text-gray-700'
  const sensorText = isNightMode ? 'text-slate-400' : 'text-gray-500'
  const valueText = isNightMode ? 'text-white' : 'text-gray-800'
  const unitText = isNightMode ? 'text-slate-300' : 'text-gray-600'
  const badgeClass = isNightMode ? 'bg-slate-800 border-slate-600' : 'bg-white/60 border-white/40'

  return (
    <div
      className={`${shellClass} rounded-2xl p-4 shadow-sm border backdrop-blur-xl ring-1 ${statusRing[status] || statusRing.normal} transition-all duration-500 hover:-translate-y-0.5 hover:shadow-lg`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shadow-sm border ${iconClass}`}>
            <Icon className={colors[type] || 'text-slate-500'} size={20} />
          </div>
          <div>
            <p className={`text-xs font-medium ${mutedText}`}>{label}</p>
            {sensor ? <p className={`text-[11px] ${sensorText}`}>{sensor}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {status === 'danger' ? <AlertTriangle size={14} className="text-red-600" /> : null}
          <span
            className={`text-xs font-semibold ${statusColors[status] || statusColors.normal} ${badgeClass} border px-2 py-1 rounded-full`}
          >
            {status.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="mt-2">
        <p className={`text-2xl font-bold tabular-nums transition-all duration-500 ${valueText}`}>
          {value}
          <span className={`text-sm font-normal ml-1 ${unitText}`}>{unit}</span>
        </p>
      </div>
    </div>
  )
}

