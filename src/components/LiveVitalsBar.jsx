import { Heart, Thermometer, CloudRain } from 'lucide-react'
import { useBluetooth } from '../hooks/useBluetooth'

export const LiveVitalsBar = () => {
  const { vitalSigns, isConnected } = useBluetooth()

  const items = [
    {
      icon: Heart,
      value: vitalSigns.heartRate ? Math.round(vitalSigns.heartRate) : '--',
      unit: 'bpm',
      label: 'IR HR',
      color: 'text-red-600',
    },
    {
      icon: Thermometer,
      value: vitalSigns.ambientTemperature ? vitalSigns.ambientTemperature.toFixed(1) : '--',
      unit: 'deg C',
      label: 'Temp',
      color: 'text-orange-600',
    },
  ]

  if (isConnected && vitalSigns.humidity) {
    items.push({
      icon: CloudRain,
      value: Math.round(vitalSigns.humidity),
      unit: '%',
      label: 'Humidity',
      color: 'text-teal-600',
    })
  }

  return (
    <div className="mx-auto mb-2 max-w-6xl rounded-2xl border border-white/50 bg-white/85 px-3 shadow-[0_-14px_32px_-24px_rgba(15,23,42,0.45)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
            }`}
          ></span>
          <p className="truncate font-medium text-gray-600">
            {isConnected ? 'Live sensor data' : 'Waiting for device connection'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {isConnected &&
            items.map(({ icon: Icon, value, unit, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 font-semibold text-gray-900"
              >
                <Icon size={14} className={color} />
                <span>
                  {value}
                  <span className="ml-0.5 text-[10px] text-gray-500">{unit}</span>
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
