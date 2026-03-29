import { useState, useEffect, useCallback } from 'react'
import { useBluetooth } from '../hooks/useBluetooth'
import { useTranslation } from '../hooks/useTranslation'
import { getHealthRecords } from '../lib/indexedDB'
import { getHealthRecommendations } from '../lib/openai'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { BottomNavigation } from '../components/BottomNavigation'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Calendar, TrendingUp, AlertCircle } from 'lucide-react'

export const HealthMonitoring = () => {
  const { t } = useTranslation()
  const { vitalSigns, vitalSignsHistory, isConnected, hasReceivedLiveData } = useBluetooth()
  const [timeRange, setTimeRange] = useState('daily')
  const [healthData, setHealthData] = useState([])
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(false)
  const [riskLevel, setRiskLevel] = useState('normal')

  const getDateRange = useCallback(() => {
    const endDate = new Date()
    const startDate = new Date(endDate)

    switch (timeRange) {
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      default:
        startDate.setHours(0, 0, 0, 0)
    }

    return { startDate, endDate }
  }, [timeRange])

  const loadHealthData = useCallback(async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange()
      const records = await getHealthRecords(startDate.toISOString(), endDate.toISOString())
      const chartData = records
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map((record) => {
          const ts = new Date(record.timestamp)
          return {
            timestamp: record.timestamp,
            time: ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            heartRate: record.heartRate || 0,
            spo2: record.spo2 || 0,
            temperature: record.ambientTemperature || record.temperature || 0,
          }
        })
      setHealthData(chartData)
    } catch (error) {
      console.error('Error loading health data:', error)
    } finally {
      setLoading(false)
    }
  }, [getDateRange])

  useEffect(() => {
    if (!isConnected) {
      setHealthData([])
      return
    }
    loadHealthData()
  }, [isConnected, loadHealthData])

  const fetchRecommendations = useCallback(async () => {
    try {
      const result = await getHealthRecommendations(vitalSigns)
      setRecommendations(result.recommendations || [])
      setRiskLevel(result.riskLevel || 'normal')
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    }
  }, [vitalSigns])

  useEffect(() => {
    if (!isConnected) return
    if (vitalSigns.heartRate > 0 || vitalSigns.spo2 > 0 || vitalSigns.ambientTemperature > 0) {
      fetchRecommendations()
    }
  }, [fetchRecommendations, isConnected, vitalSigns])

  useEffect(() => {
    if (!isConnected || !vitalSignsHistory.length) return
    const latest = vitalSignsHistory[0]
    if (!latest.timestamp) return
    const { startDate, endDate } = getDateRange()
    const ts = new Date(latest.timestamp)
    if (ts < startDate || ts > endDate) return

    const latestEntry = {
      timestamp: latest.timestamp,
      time: ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      heartRate: latest.heartRate || 0,
      spo2: latest.spo2 || 0,
      temperature: latest.ambientTemperature || latest.temperature || 0,
    }

    setHealthData((prev) => {
      const withoutDuplicate = prev.filter((item) => item.timestamp !== latestEntry.timestamp)
      const next = [...withoutDuplicate, latestEntry].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      )
      return next.slice(-200)
    })
  }, [isConnected, vitalSignsHistory, getDateRange])

  const getRiskColor = (level) => {
    switch (level) {
      case 'high':
        return 'text-red-600 bg-red-50'
      case 'medium':
        return 'text-primary-orange bg-orange-50'
      case 'low':
        return 'text-primary-green bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 pb-24 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1920&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/95 via-blue-50/98 to-purple-50/95" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader title={t('Health Monitoring')} subtitle={t('Track your vital signs over time')} />

        <div className="flex gap-2 mb-6">
          {['daily', 'weekly', 'monthly'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className="flex-1 capitalize"
            >
              {range}
            </Button>
          ))}
        </div>

        {isConnected && hasReceivedLiveData ? (
          <Card className="p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              {t('Current Readings')}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{vitalSigns.heartRate || '--'}</p>
                <p className="text-xs text-gray-600">{t('HR (bpm)')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{vitalSigns.spo2 || '--'}</p>
                <p className="text-xs text-gray-600">{t('SpO2 (%)')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{vitalSigns.ambientTemperature || '--'}</p>
                <p className="text-xs text-gray-600">{t('Temp (°C)')}</p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 mb-6 text-center">
            <p className="font-semibold text-gray-900">{t('Arduino not connected')}</p>
            <p className="text-sm text-gray-600 mt-1">{t('Connect Arduino Uno from Device Management to view live values.')}</p>
          </Card>
        )}

        {isConnected && riskLevel !== 'normal' && (
          <Card className={`p-4 mb-6 ${getRiskColor(riskLevel)}`}>
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <div>
                <p className="font-semibold">{t('Risk Level')}: {riskLevel.toUpperCase()}</p>
                <p className="text-sm mt-1">
                  {riskLevel === 'high'
                    ? t('Please consult a healthcare professional')
                    : t('Monitor your condition closely')}
                </p>
              </div>
            </div>
          </Card>
        )}

        {!isConnected || !hasReceivedLiveData ? (
          <Card className="p-8 text-center">
            <Calendar className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-gray-600">
              {isConnected
                ? t('Waiting for first live reading from Arduino Uno')
                : t('Charts will appear after device connection')}
            </p>
          </Card>
        ) : loading ? (
          <LoadingSpinner />
        ) : healthData.length > 0 ? (
          <div className="space-y-6 mb-6">
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">{t('Heart Rate')}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={healthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="heartRate" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">{t('SpO2')}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={healthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="spo2" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">{t('Temperature')}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={healthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Calendar className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-gray-600">{t('No health data available for this period')}</p>
          </Card>
        )}

        {isConnected && recommendations && recommendations.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">{t('AI Recommendations')}</h3>
            <ul className="space-y-2">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-primary-blue mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
      <BottomNavigation />
    </div>
  )
}

