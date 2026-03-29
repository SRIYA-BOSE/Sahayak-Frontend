import { useState, useEffect } from 'react'
import { getNotifications as getOfflineNotifications, markNotificationAsRead } from '../lib/indexedDB'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { BottomNavigation } from '../components/BottomNavigation'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Bell, AlertTriangle, Cloud, Activity } from 'lucide-react'
import { useVoiceAssistant } from '../hooks/useVoiceAssistant'
import { useWeather } from '../hooks/useWeather'
import { api } from '../lib/api'
import { useTranslation } from '../hooks/useTranslation'

export const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [location, setLocation] = useState({ lat: null, lon: null })
  const { speak } = useVoiceAssistant()
  const { t } = useTranslation()
  const {
    weather,
    error: weatherError,
    loading: weatherLoading,
    heatIndex,
    workSafetyRecommendations,
  } = useWeather(location.lat, location.lon)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })
        },
        () => {
          setLocation({ lat: null, lon: null })
        }
      )
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [filter])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      let remoteNotifications = []
      const response = await api.getNotifications(100)
      if (response?.success) {
        remoteNotifications = response.data
      }

      // Fallback to offline storage if remote empty
      if (!remoteNotifications.length) {
        remoteNotifications = await getOfflineNotifications(100)
      }

      let filtered = remoteNotifications
      if (filter !== 'all') {
        filtered = remoteNotifications.filter((n) => n.type === filter)
      }

      setNotifications(filtered)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    await markNotificationAsRead(id)
    loadNotifications()
  }

  const handlePlayVoice = (message) => {
    speak(message)
  }

  const getIcon = (type) => {
    switch (type) {
      case 'health':
        return Activity
      case 'weather':
        return Cloud
      case 'safety':
        return AlertTriangle
      default:
        return Bell
    }
  }

  const getColor = (type) => {
    switch (type) {
      case 'health':
        return 'text-red-500'
      case 'weather':
        return 'text-blue-500'
      case 'safety':
        return 'text-primary-orange'
      default:
        return 'text-gray-500'
    }
  }

  const filters = [
    { value: 'all', label: t('All') },
    { value: 'health', label: t('Health') },
    { value: 'weather', label: t('WeatherLabel') },
    { value: 'safety', label: t('Safety') },
  ]

  const renderWeatherPulse = () => {
    if (weatherLoading) {
      return (
        <Card className="p-4 mb-6">
          <p className="text-sm text-gray-600">{t('Waiting for live weather data')}</p>
        </Card>
      )
    }

    if (weather) {
      return (
        <Card className="p-4 mb-6 border border-blue-100 bg-blue-50/40">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase text-primary-blue tracking-wide">
              {t('Live Weather Alerts')}
            </p>
            <span className="text-xs text-gray-500">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-gray-900">{weather.name}</p>
              <p className="text-sm text-gray-700 capitalize">{weather.weather[0].description}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(weather.main.temp)}
                <span className="text-sm font-medium ml-1">°C</span>
              </p>
              {heatIndex && (
                <p className="text-xs text-gray-600">
                  HI {heatIndex.value}°C • {heatIndex.risk.toUpperCase()}
                </p>
              )}
            </div>
          </div>
          {workSafetyRecommendations.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-gray-700">
              {workSafetyRecommendations.slice(0, 2).map((tip, idx) => (
                <li key={idx}>• {tip}</li>
              ))}
            </ul>
          )}
        </Card>
      )
    }

    return (
      <Card className="p-4 mb-6 border border-dashed border-gray-200">
        <p className="text-sm text-gray-700 mb-1">{t('Waiting for live weather data')}</p>
        <p className="text-xs text-gray-500">
          {weatherError
            ? t('Allow location access to receive personalised alerts')
            : t('Stay prepared with live weather alerts')}
        </p>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader title="Notifications & Alerts" />

        {renderWeatherPulse()}

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.value
                  ? 'bg-primary-blue text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = getIcon(notification.type)
              return (
                <Card
                  key={notification.id}
                  className={`p-4 ${!notification.read ? 'border-l-4 border-primary-blue' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`${getColor(notification.type)} flex-shrink-0 mt-1`} size={20} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary-blue rounded-full flex-shrink-0 mt-2"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-400 mb-2">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                      <div className="flex gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs text-primary-blue font-medium"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => handlePlayVoice(notification.message)}
                          className="text-xs text-primary-green font-medium"
                        >
                          🔊 Play
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="p-8 text-center bg-white border border-dashed border-gray-200">
            <Bell className="mx-auto mb-3 text-primary-blue" size={48} />
            <p className="text-gray-800 font-semibold mb-2">{t('No notifications')}</p>
            <p className="text-sm text-gray-600">
              {t(
                'Everything is calm right now. We will notify you instantly if anything needs your attention.'
              )}
            </p>
          </Card>
        )}
      </div>
      <BottomNavigation />
    </div>
  )
}

