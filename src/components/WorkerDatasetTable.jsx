import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useBluetooth } from '../hooks/useBluetooth'
import { Card } from './Card'
import { LoadingSpinner } from './LoadingSpinner'
import { RefreshCw, CheckCircle, XCircle, Users } from 'lucide-react'

export const WorkerDatasetTable = () => {
  const { isConnected } = useBluetooth()
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)

  const loadWorkerData = async () => {
    try {
      setLoading(true)
      const result = await api.getWorkerDataset()
      if (result.success && result.data) {
        setWorkers(result.data)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Error loading worker dataset:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only show data if Arduino is connected
    if (isConnected) {
      loadWorkerData()
      // Auto-refresh every 5 seconds
      const interval = setInterval(loadWorkerData, 5000)
      return () => clearInterval(interval)
    } else {
      setWorkers([])
      setLoading(false)
    }
  }, [isConnected])

  // Don't render anything if not connected
  if (!isConnected) {
    return null
  }

  if (loading && workers.length === 0) {
    return (
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="text-primary-blue" size={20} />
          <h3 className="font-semibold text-gray-900">Worker Health Dataset</h3>
          <CheckCircle className="text-primary-green" size={18} />
          <span className="text-sm text-primary-green font-medium">Connected</span>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-gray-500">
              Updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadWorkerData}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={16} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Worker ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    O₂ Level
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Heart Rate
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Temp (°C)
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    BP (Sys/Dia)
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Resp. Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workers.map((worker) => (
                  <tr key={worker.worker_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {worker.worker_id}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      {worker.oxygen_level}%
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      {worker.heart_rate} bpm
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      {worker.temperature}°C
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      {worker.bp_systolic}/{worker.bp_diastolic}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      {worker.respiration_rate} /min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 text-center">
        Showing {workers.length} workers • Auto-refreshing every 5 seconds
      </div>
    </Card>
  )
}

