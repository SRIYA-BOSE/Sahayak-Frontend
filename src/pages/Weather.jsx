import { useState, useEffect } from 'react'
import { useWeather } from '../hooks/useWeather'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { BottomNavigation } from '../components/BottomNavigation'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Cloud, Droplets, Wind, Sun, AlertCircle, Thermometer, RefreshCw } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'

export const Weather = () => {
  const [location, setLocation] = useState({ lat: null, lon: null })
  const { t } = useTranslation()
  const {
    weather,
    forecast,
    loading,
    error,
    refresh,
    heatIndex,
    workSafetyRecommendations,
  } = useWeather(
    location.lat,
    location.lon
  )

  const updateLocation = () => {
    if (navigator.geolocation) {
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
  }

  useEffect(() => {
    updateLocation()
  }, [])

  const handleRefresh = async () => {
    updateLocation()
    if (refresh) {
      await refresh()
    }
  }

  const getWeatherIcon = (condition) => {
    const cond = condition.toLowerCase()
    if (cond.includes('rain')) return Droplets
    if (cond.includes('cloud')) return Cloud
    return Sun
  }

  const getDayName = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 pb-24 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50/95 via-blue-50/98 to-cyan-50/95" />
      </div>
      
      <div className="relative z-10 mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader title={t('Weather')} subtitle={t('Current conditions and forecast')} />

        {/* Live Weather Alert Banner */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-white border border-blue-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary-blue">
                {t('Live Weather Alerts')}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {error
                  ? t('Allow location access to receive personalised alerts')
                  : t('Stay prepared with live weather alerts')}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1 text-xs font-semibold text-primary-blue hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {t('Refresh now')}
            </button>
          </div>
        </Card>

        {loading ? (
          <LoadingSpinner />
        ) : weather ? (
          <>
            {/* Current Weather */}
            <Card className="p-6 mb-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{weather.name}</h2>
                  <p className="text-blue-100 text-sm">
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {(() => {
                  const Icon = getWeatherIcon(weather.weather[0].main)
                  return <Icon size={64} className="text-white opacity-90" />
                })()}
              </div>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-6xl font-bold">{Math.round(weather.main.temp)}</span>
                <span className="text-2xl mb-2">°C</span>
              </div>
              <p className="text-blue-100 capitalize text-lg">
                {weather.weather[0].description}
              </p>
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-blue-400">
                <div>
                  <p className="text-blue-100 text-sm mb-1">{t('Feels like')}</p>
                  <p className="text-xl font-semibold">{Math.round(weather.main.feels_like)}°C</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm mb-1">{t('Humidity')}</p>
                  <p className="text-xl font-semibold">{weather.main.humidity}%</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm mb-1">{t('Wind')}</p>
                  <p className="text-xl font-semibold">{weather.wind.speed} m/s</p>
                </div>
              </div>
            </Card>

            {/* Heat Index */}
            {heatIndex && (
              <Card className="p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <Thermometer className="text-primary-orange" size={24} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{t('Heat Index')}</h3>
                    <p className="text-2xl font-bold text-gray-900">{heatIndex.value}°C</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      heatIndex.risk === 'high'
                        ? 'bg-red-100 text-red-700'
                        : heatIndex.risk === 'medium'
                        ? 'bg-orange-100 text-primary-orange'
                        : 'bg-green-100 text-primary-green'
                    }`}
                  >
                    {heatIndex.risk.toUpperCase()} {t('RISK')}
                  </span>
                </div>
              </Card>
            )}

            {/* Work Safety Recommendations */}
            {workSafetyRecommendations.length > 0 && (
              <Card className="p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="text-primary-orange" size={20} />
                  <h3 className="font-semibold text-gray-900">{t('Work Safety Recommendations')}</h3>
                </div>
                <ul className="space-y-2">
                  {workSafetyRecommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-primary-orange mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* 7-Day Forecast */}
            {forecast && (
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">{t('7-Day Forecast')}</h3>
                <div className="space-y-3">
                  {forecast.list
                    .filter((item, index) => index % 8 === 0)
                    .slice(0, 7)
                    .map((item, idx) => {
                      const Icon = getWeatherIcon(item.weather[0].main)
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="text-primary-blue" size={24} />
                            <div>
                              <p className="font-medium text-gray-900">
                                {getDayName(item.dt_txt)}
                              </p>
                              <p className="text-sm text-gray-600 capitalize">
                                {item.weather[0].description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              {Math.round(item.main.temp_max)}°
                            </p>
                            <p className="text-sm text-gray-500">
                              {Math.round(item.main.temp_min)}°
                            </p>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </Card>
            )}
          </>
        ) : (
          <Card className="p-8 text-center bg-white border border-dashed border-gray-200">
            <Cloud className="mx-auto mb-3 text-primary-blue" size={48} />
            <h3 className="font-semibold text-gray-900 mb-2">{t('Waiting for live weather data')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('Allow location access to receive personalised alerts')}
            </p>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-blue rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {t('Refresh now')}
            </button>
          </Card>
        )}
      </div>
      <BottomNavigation />
    </div>
  )
}
