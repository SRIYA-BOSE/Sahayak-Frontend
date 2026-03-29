import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBluetooth } from '../hooks/useBluetooth'
import { useWeather } from '../hooks/useWeather'
import { useTranslation } from '../hooks/useTranslation'
import { VitalSignCard } from '../components/VitalSignCard'
import { AlertBanner } from '../components/AlertBanner'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { BottomNavigation } from '../components/BottomNavigation'
import { evaluateVitals, getVitalStatus, VITAL_STANDARDS } from '../lib/vitalStandards'
import { useAlarmSound } from '../hooks/useAlarmSound'
import {
  Activity,
  AlertTriangle,
  Book,
  Briefcase,
  CheckCircle,
  Cloud,
  Cpu,
  Droplets,
  FileText,
  Mic,
  Moon,
  Phone,
  Radio,
  Shield,
  Sun,
  TrendingUp,
  Usb,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react'

export const Dashboard = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const {
    vitalSigns,
    isConnected,
    serialMonitorLines,
    vitalSignsHistory,
    hasReceivedLiveData,
    hardwareEnabled,
  } =
    useBluetooth()
  const alarm = useAlarmSound()
  const [location, setLocation] = useState({ lat: null, lon: null })
  const { weather, workSafetyRecommendations } = useWeather(location.lat, location.lon)
  const [alerts, setAlerts] = useState([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') return 'day'
    return window.localStorage.getItem('dashboard-theme-mode') || 'day'
  })

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })
        },
        (error) => console.error('Geolocation error:', error)
      )
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('dashboard-theme-mode', themeMode)
  }, [themeMode])

  const evaluated = useMemo(() => evaluateVitals(vitalSigns), [vitalSigns])
  const isNightMode = themeMode === 'night'
  const decimalPlacesByKey = {
    heartRate: 0,
    ambientTemperature: 1,
    humidity: 0,
    noiseLevel: 1,
    airQualityPpm: 0,
    vibrationLevel: 2,
    tiltAngle: 1,
  }

  const formatVitalDisplay = (key, rawValue) => {
    const value = Number(rawValue)
    if (!Number.isFinite(value)) return '--'
    const decimals = decimalPlacesByKey[key] ?? 0
    return decimals === 0 ? Math.round(value) : value.toFixed(decimals)
  }

  const sensorCards = [
    { key: 'heartRate', value: formatVitalDisplay('heartRate', vitalSigns.heartRate) },
    {
      key: 'ambientTemperature',
      value: formatVitalDisplay('ambientTemperature', vitalSigns.ambientTemperature),
    },
    { key: 'humidity', value: formatVitalDisplay('humidity', vitalSigns.humidity) },
    { key: 'noiseLevel', value: formatVitalDisplay('noiseLevel', vitalSigns.noiseLevel) },
    { key: 'airQualityPpm', value: formatVitalDisplay('airQualityPpm', vitalSigns.airQualityPpm) },
    {
      key: 'vibrationLevel',
      value: formatVitalDisplay('vibrationLevel', vitalSigns.vibrationLevel),
    },
    { key: 'tiltAngle', value: formatVitalDisplay('tiltAngle', vitalSigns.tiltAngle) },
  ]

  const highlightedVitals = [
    {
      label: 'Live IR Heart Rate',
      value: formatVitalDisplay('heartRate', vitalSigns.heartRate),
      unit: 'bpm',
      source: 'MAX30102 IR sensor / live derived',
    },
    {
      label: 'Tilt Angle',
      value: formatVitalDisplay('tiltAngle', vitalSigns.tiltAngle),
      unit: 'deg',
      source: 'MPU6050',
    },
  ]
  const activeSensorCount = sensorCards.filter(({ key }) => Number(vitalSigns?.[key]) > 0).length
  const dangerKeys = Object.keys(VITAL_STANDARDS).filter((key) =>
    getVitalStatus(key, vitalSigns?.[key]).outOfRange
  )
  const safetyScore = Math.max(
    0,
    Math.round((1 - dangerKeys.length / Math.max(1, Object.keys(VITAL_STANDARDS).length)) * 100)
  )
  const recentHeartRateValues = vitalSignsHistory
    .map((entry) => Number(entry.heartRate))
    .filter((value) => Number.isFinite(value) && value > 0)
    .slice(0, 8)
  const heartRateTrend = recentHeartRateValues.length
    ? Math.round(
        recentHeartRateValues.reduce((total, value) => total + value, 0) /
          recentHeartRateValues.length
      )
    : 0
  const liveDataStatus = !isConnected
    ? {
        label: 'Offline',
        detail: 'Connect the Arduino board to start live monitoring.',
        tone: 'slate',
      }
    : !hasReceivedLiveData
      ? {
          label: 'Warming up',
          detail: 'Connection is ready. Waiting for the first live packet.',
          tone: 'amber',
        }
      : {
          label: 'Streaming',
          detail: 'Sensor packets are arriving and the dashboard is updating live.',
          tone: 'emerald',
        }
  const pulseStatus = (() => {
    const irValue = Number(vitalSigns.irValue)
    const heartRateValue = Number(vitalSigns.heartRate)

    if (!isConnected) {
      return {
        label: 'No pulse feed',
        detail: 'Connect the board to derive heart rate from the IR sensor.',
        tone: 'slate',
      }
    }

    if (heartRateValue > 0) {
      return {
        label: 'Pulse locked',
        detail: 'The MAX30102 IR stream is producing a usable live heart-rate reading.',
        tone: 'emerald',
      }
    }

    if (irValue > 15000) {
      return {
        label: 'Finger detected',
        detail: 'A strong IR signal is present. Hold the finger still while the pulse locks.',
        tone: 'amber',
      }
    }

    if (irValue > 0) {
      return {
        label: 'Signal too weak',
        detail: 'The sensor sees light, but the pulse waveform is not stable enough yet.',
        tone: 'rose',
      }
    }

    return {
      label: 'Waiting for finger',
      detail: 'Place a finger on the MAX30102 sensor to begin pulse detection.',
      tone: 'slate',
    }
  })()
  const environmentOutlook = (() => {
    const temperature = Number(vitalSigns.ambientTemperature)
    const humidity = Number(vitalSigns.humidity)
    const airQuality = Number(vitalSigns.airQualityPpm)
    const noise = Number(vitalSigns.noiseLevel)

    const notes = []
    if (Number.isFinite(temperature) && temperature > 35) notes.push('High heat load')
    else if (Number.isFinite(temperature) && temperature > 0) notes.push('Thermal conditions stable')

    if (Number.isFinite(humidity) && humidity > 75) notes.push('Humidity rising')
    else if (Number.isFinite(humidity) && humidity > 0) notes.push('Humidity acceptable')

    if (Number.isFinite(airQuality) && airQuality > 1000) notes.push('Air quality needs attention')
    else if (Number.isFinite(airQuality) && airQuality > 0) notes.push('Air quality acceptable')

    if (Number.isFinite(noise) && noise > 85) notes.push('Noise protection advised')

    return notes.length > 0 ? notes.slice(0, 3).join(' - ') : 'Waiting for environmental data'
  })()
  const topInsightCards = [
    {
      icon: Shield,
      label: 'Safety Score',
      value: `${safetyScore}%`,
      helper:
        dangerKeys.length > 0
          ? `${dangerKeys.length} threshold alerts active`
          : 'All tracked readings within safety limits',
      tone:
        dangerKeys.length > 0
          ? 'from-rose-500/20 to-orange-500/10 border-rose-300/40'
          : 'from-emerald-500/20 to-sky-500/10 border-emerald-300/40',
    },
    {
      icon: Cpu,
      label: 'Active Sensors',
      value: `${activeSensorCount}/${sensorCards.length}`,
      helper: hasReceivedLiveData
        ? 'Live packets are populating the dashboard'
        : 'Sensor feed has not arrived yet',
      tone: 'from-sky-500/20 to-indigo-500/10 border-sky-300/40',
    },
    {
      icon: Radio,
      label: 'Pulse Status',
      value: pulseStatus.label,
      helper: pulseStatus.detail,
      tone:
        pulseStatus.tone === 'emerald'
          ? 'from-emerald-500/20 to-lime-500/10 border-emerald-300/40'
          : pulseStatus.tone === 'amber'
            ? 'from-amber-500/20 to-orange-500/10 border-amber-300/40'
            : pulseStatus.tone === 'rose'
              ? 'from-rose-500/20 to-red-500/10 border-rose-300/40'
              : 'from-slate-500/20 to-slate-400/10 border-slate-300/40',
    },
    {
      icon: TrendingUp,
      label: 'HR Trend',
      value: heartRateTrend > 0 ? `${heartRateTrend} bpm` : '--',
      helper:
        heartRateTrend > 0
          ? 'Average of the latest valid IR-derived readings'
          : 'Trend appears once live pulse values are available',
      tone: 'from-violet-500/20 to-fuchsia-500/10 border-violet-300/40',
    },
  ]

  useEffect(() => {
    if (typeof window === 'undefined' || !soundEnabled) return undefined

    const unlockOnGesture = () => {
      alarm.unlock().catch(() => {})
      window.removeEventListener('pointerdown', unlockOnGesture)
      window.removeEventListener('keydown', unlockOnGesture)
    }

    window.addEventListener('pointerdown', unlockOnGesture, { once: true })
    window.addEventListener('keydown', unlockOnGesture, { once: true })

    return () => {
      window.removeEventListener('pointerdown', unlockOnGesture)
      window.removeEventListener('keydown', unlockOnGesture)
    }
  }, [alarm, soundEnabled])

  useEffect(() => {
    if (!isConnected) {
      setAlerts([])
      return
    }

    const nextAlerts = Object.keys(VITAL_STANDARDS)
      .map((key) => {
        const value = Number(vitalSigns?.[key])
        if (!Number.isFinite(value) || value <= 0) return null
        const standard = VITAL_STANDARDS[key]
        const { outOfRange } = getVitalStatus(key, value)
        if (!outOfRange) return null

        return {
          type: 'danger',
          message: `${standard.sensor}: ${t(standard.label)} ${t('crossed construction site safety limit')} (${value} ${standard.unit})`,
        }
      })
      .filter(Boolean)

    setAlerts(nextAlerts)
  }, [isConnected, t, vitalSigns])

  useEffect(() => {
    if (!isConnected || !soundEnabled) {
      alarm.stop()
      return
    }

    const keys = Object.keys(VITAL_STANDARDS)
    const present = keys.filter((key) => Number(vitalSigns?.[key]) > 0)
    const exceeded = present.filter((key) => getVitalStatus(key, vitalSigns?.[key]).outOfRange)
    const shouldAlarm = exceeded.length > 0

    if (shouldAlarm) {
      alarm.start()
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate([220, 120, 220, 120, 360])
      }
    } else {
      alarm.stop()
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(0)
      }
    }
  }, [alarm, isConnected, soundEnabled, vitalSigns])

  const toggleSound = async () => {
    const unlockResult = await alarm.unlock()
    if (!unlockResult.success) return
    setSoundEnabled((current) => !current)
  }

  const pageShellClass = isNightMode
    ? 'bg-[radial-gradient(1200px_circle_at_12%_0%,rgba(14,165,233,0.14),transparent_58%),radial-gradient(900px_circle_at_88%_16%,rgba(249,115,22,0.14),transparent_52%),linear-gradient(160deg,#020617,#0f172a,#111827)] text-slate-100'
    : 'bg-[radial-gradient(1200px_circle_at_10%_0%,rgba(30,64,175,0.12),transparent_60%),radial-gradient(900px_circle_at_90%_20%,rgba(22,163,74,0.12),transparent_55%),linear-gradient(135deg,#f8fafc,rgba(255,255,255,0.96),#f0f9ff)] text-slate-900'
  const heroClass = isNightMode
    ? 'bg-gradient-to-r from-slate-900 via-sky-950 to-blue-950 border-sky-800/60 shadow-[0_22px_60px_-28px_rgba(8,47,73,0.95)]'
    : 'bg-gradient-to-r from-primary-blue via-blue-600 to-sky-500 border-white/20 shadow-[0_16px_50px_-20px_rgba(30,64,175,0.65)]'
  const glassCardClass = isNightMode
    ? 'bg-slate-900/80 border border-slate-700/80 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.95)] backdrop-blur-xl'
    : 'bg-white/75 border border-white/40 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.35)] backdrop-blur-xl'
  const headingTextClass = isNightMode ? 'text-white' : 'text-gray-900'
  const mutedTextClass = isNightMode ? 'text-slate-300' : 'text-gray-600'
  const subTextClass = isNightMode ? 'text-slate-400' : 'text-gray-500'
  const accentIconClass = isNightMode ? 'text-sky-300' : 'text-primary-blue'
  const successIconClass = isNightMode ? 'text-emerald-300' : 'text-primary-green'
  const insightLabelClass = isNightMode ? 'text-slate-200/90' : subTextClass
  const insightHelperClass = isNightMode ? 'text-slate-100/80' : mutedTextClass
  const liveStatusClass =
    liveDataStatus.tone === 'emerald'
      ? isNightMode
        ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/20'
        : 'bg-emerald-500/15 text-emerald-600'
      : liveDataStatus.tone === 'amber'
        ? isNightMode
          ? 'bg-amber-500/15 text-amber-200 border border-amber-400/20'
          : 'bg-amber-500/15 text-amber-600'
        : isNightMode
          ? 'bg-slate-500/15 text-slate-200 border border-slate-400/20'
          : 'bg-slate-500/15 text-slate-600'

  return (
    <div className={`min-h-screen pb-24 relative overflow-hidden transition-colors duration-500 ${pageShellClass}`}>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl animate-float-slow" />
        <div className="absolute top-32 -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl animate-float-slower" />
        <div className="absolute bottom-10 left-10 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl animate-float-slowest" />
        <div className={`absolute inset-0 bg-grid-faint ${isNightMode ? 'opacity-20' : 'opacity-40'}`} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className={`mb-6 relative overflow-hidden rounded-3xl p-6 text-white border transition-colors duration-500 ${heroClass}`}>
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight drop-shadow-sm">SAHAYAK</h1>
                <p className="text-blue-100/90 text-base mt-1">{t('Construction Safety Sensor Board')}</p>
              </div>
              <div className="shrink-0 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setThemeMode((current) => (current === 'day' ? 'night' : 'day'))}
                  className="inline-flex items-center gap-2 rounded-full bg-white/12 hover:bg-white/18 active:bg-white/22 border border-white/20 px-3 py-2 text-sm backdrop-blur-md transition"
                  aria-label="Toggle light and dark mode"
                  title="Toggle light and dark mode"
                >
                  {isNightMode ? <Sun size={18} /> : <Moon size={18} />}
                  <span className="hidden sm:inline">{isNightMode ? t('Light Mode') : t('Dark Mode')}</span>
                </button>
                <button
                  type="button"
                  onClick={toggleSound}
                  className="inline-flex items-center gap-2 rounded-full bg-white/12 hover:bg-white/18 active:bg-white/22 border border-white/20 px-3 py-2 text-sm backdrop-blur-md transition"
                  aria-label="Toggle alarm sound"
                  title="Toggle alarm sound"
                >
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  <span className="hidden sm:inline">{soundEnabled ? t('Alarm On') : t('Alarm Off')}</span>
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-blue-50/90">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/12 border border-white/15 px-2 py-1">
                <Usb size={14} />
                {isConnected
                  ? t('Arduino Connected')
                  : hardwareEnabled
                    ? t('Arduino Disconnected')
                    : t('Cloud Mode')}
              </span>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/12 border border-white/15 px-2 py-1">
                {isNightMode ? t('Dark Mode') : t('Light Mode')}
              </span>
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/15 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-white/10 rounded-full blur-2xl" />
        </div>

        {alerts.length > 0 ? (
          <div className="mb-6">
            {alerts.map((alert, idx) => (
              <AlertBanner key={idx} type={alert.type} message={alert.message} darkMode={isNightMode} />
            ))}
          </div>
        ) : null}

        {isConnected ? (
          <Card className={`p-4 mb-6 ${glassCardClass}`}>
            <div className="flex items-center gap-3">
              <CheckCircle className={successIconClass} size={24} />
              <div className="flex-1">
                <p className={`font-semibold ${headingTextClass}`}>
                  {t(hardwareEnabled ? 'Arduino Connected' : 'Cloud deployment active')}
                </p>
                <p className={`text-sm ${mutedTextClass}`}>
                  {t(hardwareEnabled ? 'Live sensor streaming active' : 'HTTP API features are available')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/device')}
                className={isNightMode ? 'border-sky-400 text-sky-300 hover:bg-sky-950/40' : ''}
              >
                {t('Manage')}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className={`p-4 mb-6 ${glassCardClass}`}>
            <div className="flex items-start gap-3">
              <Usb className={accentIconClass} size={22} />
              <div className="flex-1">
                <p className={`font-semibold ${headingTextClass}`}>
                  {t(hardwareEnabled ? 'Connect your Arduino sensor kit' : 'Cloud mode is running')}
                </p>
                <p className={`text-sm mt-1 ${mutedTextClass}`}>
                  {t(
                    hardwareEnabled
                      ? 'Open Device Management and connect the correct COM port to start streaming'
                      : 'Authentication, weather, jobs, schemes, and stored data features are available on Vercel.'
                  )}
                </p>
                <div className="mt-3">
                  <Button variant="primary" size="md" onClick={() => navigate('/device')}>
                    {t(hardwareEnabled ? 'Connect Arduino' : 'View device status')}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {topInsightCards.map(({ icon: Icon, label, value, helper, tone }) => (
            <Card key={label} className={`overflow-hidden p-0 ${glassCardClass}`}>
              <div className={`h-full rounded-3xl border bg-gradient-to-br ${tone} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-xs uppercase tracking-[0.22em] ${insightLabelClass}`}>{t(label)}</p>
                    <p className={`mt-3 text-2xl font-bold leading-tight ${headingTextClass}`}>
                      {value}
                    </p>
                  </div>
                  <div
                    className={`rounded-2xl border p-3 ${
                      isNightMode ? 'border-slate-600/80 bg-slate-800/80' : 'border-white/60 bg-white/70'
                    }`}
                  >
                    <Icon size={20} className={isNightMode ? 'text-white' : 'text-slate-900'} />
                  </div>
                </div>
                <p className={`mt-4 text-sm leading-6 ${insightHelperClass}`}>{helper}</p>
              </div>
            </Card>
          ))}
        </div>

        {isConnected ? (
          <Card className={`p-4 mb-6 ${glassCardClass}`}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className={`font-semibold ${headingTextClass}`}>{t('Live Vital Snapshot')}</p>
                <p className={`text-sm ${mutedTextClass}`}>{t('Live heart rate from the IR sensor stream and tilt angle from MPU6050')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {highlightedVitals.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border p-4 ${
                    isNightMode
                      ? 'border-slate-700 bg-slate-900/80'
                      : 'border-slate-200 bg-white/85'
                  }`}
                >
                  <p className={`text-sm font-semibold ${headingTextClass}`}>{t(item.label)}</p>
                  <p className={`mt-2 text-3xl font-bold tabular-nums ${headingTextClass}`}>
                    {item.value} <span className={`text-sm font-medium ${subTextClass}`}>{item.unit}</span>
                  </p>
                  <p className={`mt-2 text-xs ${mutedTextClass}`}>{item.source}</p>
                </div>
              ))}
            </div>
            <div className={`mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs ${mutedTextClass}`}>
              <p>IR Value: <span className="font-semibold tabular-nums">{Number(vitalSigns.irValue || 0)}</span></p>
              <p>Heart Rate Source: <span className="font-semibold">IR sensor derived</span></p>
            </div>
          </Card>
        ) : null}

        <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <Card className={`p-5 ${glassCardClass}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={`font-semibold ${headingTextClass}`}>{t('Live Signal Intelligence')}</p>
                <p className={`text-sm ${mutedTextClass}`}>
                  {t('A quick quality check for the current sensor stream')}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${liveStatusClass}`}
              >
                {t(liveDataStatus.label)}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div
                className={`rounded-2xl border p-4 ${
                  isNightMode ? 'border-slate-700 bg-slate-900/80' : 'border-slate-200 bg-white/80'
                }`}
              >
                <p className={`text-xs uppercase tracking-[0.18em] ${subTextClass}`}>{t('IR feed')}</p>
                <p className={`mt-2 text-3xl font-bold tabular-nums ${headingTextClass}`}>
                  {Math.round(Number(vitalSigns.irValue || 0))}
                </p>
                <p className={`mt-2 text-sm ${mutedTextClass}`}>{t('Raw MAX30102 infrared intensity')}</p>
              </div>
              <div
                className={`rounded-2xl border p-4 ${
                  isNightMode ? 'border-slate-700 bg-slate-900/80' : 'border-slate-200 bg-white/80'
                }`}
              >
                <p className={`text-xs uppercase tracking-[0.18em] ${subTextClass}`}>{t('Pulse state')}</p>
                <p className={`mt-2 text-2xl font-bold ${headingTextClass}`}>{t(pulseStatus.label)}</p>
                <p className={`mt-2 text-sm leading-6 ${mutedTextClass}`}>{t(pulseStatus.detail)}</p>
              </div>
              <div
                className={`rounded-2xl border p-4 ${
                  isNightMode ? 'border-slate-700 bg-slate-900/80' : 'border-slate-200 bg-white/80'
                }`}
              >
                <p className={`text-xs uppercase tracking-[0.18em] ${subTextClass}`}>
                  {t('Sensor coverage')}
                </p>
                <p className={`mt-2 text-3xl font-bold ${headingTextClass}`}>
                  {activeSensorCount}/{sensorCards.length}
                </p>
                <p className={`mt-2 text-sm leading-6 ${mutedTextClass}`}>{t(liveDataStatus.detail)}</p>
              </div>
            </div>
          </Card>

          <Card className={`p-5 ${glassCardClass}`}>
            <div className="flex items-center gap-2">
              <Cloud className={accentIconClass} size={18} />
              <p className={`font-semibold ${headingTextClass}`}>{t('Site Outlook')}</p>
            </div>
            <p className={`mt-3 text-3xl font-bold leading-tight ${headingTextClass}`}>
              {dangerKeys.length > 0 ? t('Needs attention') : t('Stable right now')}
            </p>
            <p className={`mt-3 text-sm leading-6 ${mutedTextClass}`}>{environmentOutlook}</p>
            <div
              className={`mt-5 rounded-2xl border p-4 ${
                isNightMode ? 'border-slate-700 bg-slate-950/70' : 'border-slate-200 bg-white/85'
              }`}
            >
              <p className={`text-xs uppercase tracking-[0.18em] ${subTextClass}`}>{t('Focus')}</p>
              <p className={`mt-2 text-base font-semibold ${headingTextClass}`}>
                {dangerKeys.length > 0
                  ? t(
                      'Watch the highlighted readings and respond before they cross into sustained risk.'
                    )
                  : t(
                      'Current readings look suitable for routine indoor monitoring and board testing.'
                    )}
              </p>
            </div>
          </Card>
        </div>

        {isConnected ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {sensorCards.map(({ key, value }) => {
              const standard = VITAL_STANDARDS[key]
              return (
                <VitalSignCard
                  key={key}
                  type={key}
                  value={value}
                  unit={standard.unit}
                  label={t(standard.label)}
                  sensor={standard.sensor}
                  status={evaluated[key]?.status || 'normal'}
                  isNightMode={isNightMode}
                />
              )
            })}
          </div>
        ) : (
          <Card className={`p-5 mb-6 ${glassCardClass}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={`font-semibold ${headingTextClass}`}>
                  {isConnected
                    ? t('Fetching live Arduino values...')
                    : t(
                        hardwareEnabled
                          ? 'Values will appear after Arduino connects'
                          : 'Live hardware values are disabled in cloud mode'
                      )}
                </p>
                <p className={`text-sm mt-1 ${mutedTextClass}`}>
                  {isConnected
                    ? t('Connected. Waiting for first sensor packet from Arduino Uno.')
                    : t(
                        hardwareEnabled
                          ? 'Open Device Management and connect your Arduino Uno to begin monitoring.'
                          : 'This deployment uses serverless APIs only. Hardware streaming is unavailable on Vercel.'
                      )}
                </p>
              </div>
              <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'}`} />
            </div>
          </Card>
        )}

        {isConnected ? (
          <Card className={`p-4 mb-6 ${glassCardClass}`}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Activity className={accentIconClass} size={20} />
                <h3 className={`font-semibold ${headingTextClass}`}>
                  {t(hardwareEnabled ? 'Construction Sensor Board' : 'Monitoring Overview')}
                </h3>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full ${alerts.length > 0 ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                {alerts.length > 0 ? t('DANGER') : t('SAFE')}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(VITAL_STANDARDS).map(([key, standard]) => {
                  const rawValue = Number(vitalSigns?.[key])
                  const safeValue = Number.isFinite(rawValue) ? rawValue : 0
                  const isDanger = getVitalStatus(key, rawValue).outOfRange

                  return (
                    <div
                      key={key}
                      className={`rounded-2xl border p-4 transition-all duration-500 ${
                        isDanger
                          ? isNightMode
                            ? 'border-red-700/70 bg-red-950/40'
                            : 'border-red-400 bg-red-50'
                          : isNightMode
                            ? 'border-slate-700 bg-slate-800/85'
                            : 'border-emerald-200 bg-emerald-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-sm font-semibold ${isDanger ? (isNightMode ? 'text-red-200' : 'text-red-700') : headingTextClass}`}>{t(standard.label)}</p>
                          <p className={`text-xs ${isDanger ? (isNightMode ? 'text-red-300' : 'text-red-500') : subTextClass}`}>{standard.sensor}</p>
                        </div>
                        {isDanger ? <AlertTriangle size={18} className="text-red-600" /> : null}
                      </div>
                      <p className={`mt-3 text-3xl font-bold tabular-nums transition-all duration-500 ${isDanger ? (isNightMode ? 'text-red-200' : 'text-red-700') : headingTextClass}`}>
                        {formatVitalDisplay(key, safeValue)} <span className={`text-sm font-medium ${isDanger ? (isNightMode ? 'text-red-300' : 'text-red-500') : subTextClass}`}>{standard.unit}</span>
                      </p>
                      <p className={`mt-2 text-xs ${isDanger ? (isNightMode ? 'text-red-300' : 'text-red-600') : mutedTextClass}`}>
                        {t('Safe range')}: {typeof standard.min === 'number' ? `${standard.min} - ` : '<= '}
                        {typeof standard.max === 'number' ? `${standard.max}` : ''}
                        {standard.unit}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className={`rounded-2xl border p-4 ${isNightMode ? 'border-sky-800 bg-slate-950 text-slate-100' : 'border-slate-200 bg-slate-950 text-slate-100'}`}>
                <p className="text-sm font-semibold">{t('MPU6050 Motion Detail')}</p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Tilt Angle</span>
                    <span className="font-semibold tabular-nums transition-all duration-500">{vitalSigns.tiltAngle || 0} deg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Vibration</span>
                    <span className="font-semibold tabular-nums transition-all duration-500">{vitalSigns.vibrationLevel || 0} g</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Accel X</span>
                    <span className="font-semibold tabular-nums transition-all duration-500">{vitalSigns.accelX || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Accel Y</span>
                    <span className="font-semibold tabular-nums transition-all duration-500">{vitalSigns.accelY || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Accel Z</span>
                    <span className="font-semibold tabular-nums transition-all duration-500">{vitalSigns.accelZ || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {isConnected ? (
          <Card className="p-4 mb-6 bg-slate-950 text-slate-100 border border-slate-700 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.95)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{t(hardwareEnabled ? 'Arduino Serial Monitor' : 'Sensor Monitor')}</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
                {t('LIVE')}
              </span>
            </div>
            <div className="max-h-52 overflow-y-auto rounded-lg bg-slate-900 border border-slate-800 p-3 font-mono text-xs space-y-1">
              {serialMonitorLines.length > 0 ? (
                serialMonitorLines.slice(0, 40).map((line) => (
                  <p key={line.id} className="text-slate-300">
                    <span className="text-cyan-300 mr-2">[{new Date(line.timestamp).toLocaleTimeString()}]</span>
                    <span>{line.rawLine}</span>
                  </p>
                ))
              ) : (
                <p className="text-slate-400">
                  {t(hardwareEnabled ? 'Waiting for serial data...' : 'No live hardware feed in cloud mode.')}
                </p>
              )}
            </div>
          </Card>
        ) : null}

        {isConnected ? (
          <Card className={`p-4 mb-6 ${glassCardClass}`}>
            <h3 className={`font-semibold mb-3 ${headingTextClass}`}>{t('Construction Safety Standards')}</h3>
            <div className="space-y-2">
              {Object.entries(VITAL_STANDARDS).map(([key, standard]) => {
                const rawValue = Number(vitalSigns?.[key])
                const safeValue = Number.isFinite(rawValue) ? rawValue : 0
                const isDanger = getVitalStatus(key, rawValue).outOfRange
                const statusClass = isDanger
                  ? isNightMode
                    ? 'text-red-200 bg-red-950/60'
                    : 'text-red-700 bg-red-100'
                  : isNightMode
                    ? 'text-emerald-200 bg-emerald-950/60'
                    : 'text-emerald-700 bg-emerald-100'

                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                      isNightMode ? 'border-slate-700 bg-slate-800/80' : 'border-gray-200 bg-white/80'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-medium ${headingTextClass}`}>{t(standard.label)}</p>
                      <p className={`text-xs ${subTextClass}`}>
                        {t('Standard')}: {typeof standard.min === 'number' && typeof standard.max === 'number'
                          ? `${standard.min}-${standard.max} ${standard.unit}`
                          : typeof standard.max === 'number'
                            ? `<= ${standard.max} ${standard.unit}`
                            : `>= ${standard.min} ${standard.unit}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold tabular-nums transition-all duration-500 ${headingTextClass}`}>
                        {formatVitalDisplay(key, safeValue)} {standard.unit}
                      </p>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass}`}>
                        {isDanger ? t('Danger') : t('Safe')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        ) : null}

        {weather ? (
          <Card className={`p-4 mb-6 ${glassCardClass}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-semibold ${headingTextClass}`}>{t('Weather')}</h3>
              <Cloud className={accentIconClass} size={24} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${headingTextClass}`}>{Math.round(weather.main.temp)} deg C</p>
                <p className={`text-sm capitalize ${mutedTextClass}`}>{weather.weather[0].description}</p>
              </div>
              <div className="text-right">
                <div className={`flex items-center gap-1 text-sm ${mutedTextClass}`}>
                  <Droplets size={16} />
                  <span>{weather.main.humidity}%</span>
                </div>
                <div className={`flex items-center gap-1 text-sm mt-1 ${mutedTextClass}`}>
                  <Wind size={16} />
                  <span>{weather.wind.speed} m/s</span>
                </div>
              </div>
            </div>
            {workSafetyRecommendations.length > 0 ? (
              <div className={`mt-3 pt-3 border-t ${isNightMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <p className={`text-xs font-medium mb-1 ${headingTextClass}`}>{t('Safety Tips')}:</p>
                <ul className={`text-xs space-y-1 ${mutedTextClass}`}>
                  {workSafetyRecommendations.slice(0, 2).map((tip, idx) => (
                    <li key={idx}>- {tip}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>
        ) : null}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Button
            variant="danger"
            size="lg"
            onClick={() => navigate('/emergency')}
            className="flex items-center justify-center gap-2 h-16"
          >
            <Phone size={20} />
            {t('Emergency')}
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/voice-assistant')}
            className="flex items-center justify-center gap-2 h-16"
          >
            <Mic size={20} />
            {t('Voice Assistant')}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card
            onClick={() => navigate('/health')}
            className={`p-6 text-center cursor-pointer transform hover:scale-105 ${isNightMode ? 'bg-slate-900/80 border-slate-700' : 'bg-gradient-to-br from-blue-50 to-blue-100'}`}
          >
            <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Activity className="text-white" size={32} />
            </div>
            <p className={`font-semibold text-lg ${headingTextClass}`}>{t('Health')}</p>
            <p className={`text-sm mt-1 ${mutedTextClass}`}>{t('Monitor & Track')}</p>
          </Card>
          <Card
            onClick={() => navigate('/education')}
            className={`p-6 text-center cursor-pointer transform hover:scale-105 ${isNightMode ? 'bg-slate-900/80 border-slate-700' : 'bg-gradient-to-br from-green-50 to-green-100'}`}
          >
            <div className="w-16 h-16 bg-primary-green rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Book className="text-white" size={32} />
            </div>
            <p className={`font-semibold text-lg ${headingTextClass}`}>{t('Learn')}</p>
            <p className={`text-sm mt-1 ${mutedTextClass}`}>{t('Education & Skills')}</p>
          </Card>
          <Card
            onClick={() => navigate('/schemes')}
            className={`p-6 text-center cursor-pointer transform hover:scale-105 ${isNightMode ? 'bg-slate-900/80 border-slate-700' : 'bg-gradient-to-br from-orange-50 to-orange-100'}`}
          >
            <div className="w-16 h-16 bg-primary-orange rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <FileText className="text-white" size={32} />
            </div>
            <p className={`font-semibold text-lg ${headingTextClass}`}>{t('Schemes')}</p>
            <p className={`text-sm mt-1 ${mutedTextClass}`}>{t('Government Benefits')}</p>
          </Card>
          <Card
            onClick={() => navigate('/jobs')}
            className={`p-6 text-center cursor-pointer transform hover:scale-105 ${isNightMode ? 'bg-slate-900/80 border-slate-700' : 'bg-gradient-to-br from-amber-50 to-yellow-100'}`}
          >
            <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Briefcase className="text-white" size={32} />
            </div>
            <p className={`font-semibold text-lg ${headingTextClass}`}>{t('Jobs')}</p>
            <p className={`text-sm mt-1 ${mutedTextClass}`}>{t('Find Opportunities')}</p>
          </Card>
        </div>
      </div>
      <BottomNavigation />
    </div>
  )
}
