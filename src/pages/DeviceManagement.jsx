import { useState, useEffect } from 'react'
import { useBluetooth } from '../hooks/useBluetooth'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { BottomNavigation } from '../components/BottomNavigation'
import { Settings, CheckCircle, XCircle, RefreshCw, Usb } from 'lucide-react'

export const DeviceManagement = () => {
  const {
    device,
    isConnected,
    error,
    requestDevice,
    disconnect,
    calibrateSensor,
    availablePorts,
    connectedPort,
    loadAvailablePorts,
    isConnecting,
  } = useBluetooth()

  const [calibrating, setCalibrating] = useState(false)
  const [selectedPort, setSelectedPort] = useState('')
  const [baudRate, setBaudRate] = useState(115200)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    loadAvailablePorts()
  }, [loadAvailablePorts])

  useEffect(() => {
    if (!selectedPort && availablePorts.length > 0) {
      const comPort = availablePorts.find((p) => p.path.startsWith('COM'))
      if (comPort) {
        setSelectedPort(comPort.path)
      }
    }
  }, [availablePorts, selectedPort])

  const handleConnect = async () => {
    if (!selectedPort) return
    setConnecting(true)
    try {
      const result = await requestDevice(selectedPort, baudRate)
      if (!result.success) {
        console.error(result.error || 'Failed to connect')
      }
    } catch (err) {
      console.error(err.message || 'Connection failed')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    await disconnect()
  }

  const handleRefreshPorts = async () => {
    await loadAvailablePorts()
  }

  const handleCalibrate = async (sensorType) => {
    setCalibrating(true)
    const result = await calibrateSensor(sensorType)
    if (result.success) {
      alert('Sensor calibrated successfully')
    } else {
      alert('Calibration failed: ' + result.error)
    }
    setCalibrating(false)
  }

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden bg-[radial-gradient(1200px_circle_at_20%_0%,rgba(30,64,175,0.10),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(249,115,22,0.10),transparent_55%),linear-gradient(135deg,#f8fafc,rgba(255,255,255,0.96),#f0f9ff)]">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl animate-float-slow" />
        <div className="absolute top-40 -right-24 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl animate-float-slower" />
        <div className="absolute inset-0 bg-grid-faint opacity-35" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader title="Device Management" subtitle="Connect Arduino Uno and verify live sensor streaming" />

        <Card className="p-4 mb-6 bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Usb size={20} />
              Arduino Connection
            </h3>
            {isConnected ? (
              <CheckCircle className="text-primary-green" size={24} />
            ) : (
              <XCircle className="text-gray-400" size={24} />
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status</span>
              <span className={`font-bold text-lg ${isConnected ? 'text-primary-green' : 'text-gray-400'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {connectedPort && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">COM Port</span>
                <span className="font-medium text-gray-900">{connectedPort}</span>
              </div>
            )}

            {device && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Device Name</span>
                <span className="font-medium text-gray-900">{device.name || 'Arduino Uno'}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          {!isConnected && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">COM Port</label>
                <div className="flex gap-2">
                  <select
                    value={selectedPort}
                    onChange={(e) => setSelectedPort(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl bg-white/70 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary-blue shadow-sm"
                  >
                    <option value="">Select COM Port</option>
                    {availablePorts.map((port) => (
                      <option key={port.path} value={port.path}>
                        {port.path} {port.manufacturer ? `(${port.manufacturer})` : ''}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" size="md" onClick={handleRefreshPorts} className="px-3">
                    <RefreshCw size={18} />
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Baud Rate</label>
                <select
                  value={baudRate}
                  onChange={(e) => setBaudRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white/70 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary-blue shadow-sm"
                >
                  <option value={115200}>115200</option>
                  <option value={9600}>9600</option>
                  <option value={57600}>57600</option>
                  <option value={38400}>38400</option>
                  <option value={19200}>19200</option>
                </select>
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            {!isConnected ? (
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={handleConnect}
                disabled={connecting || isConnecting || !selectedPort}
              >
                {connecting || isConnecting ? 'Connecting...' : 'Connect Arduino Uno'}
              </Button>
            ) : (
              <Button variant="danger" size="md" className="flex-1" onClick={handleDisconnect}>
                Disconnect
              </Button>
            )}
          </div>
        </Card>

        {isConnected && (
          <Card className="p-4 mb-6 bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.35)]">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings size={20} />
              Sensor Calibration
            </h3>
            <p className="text-sm text-gray-600 mb-4">Calibrate sensors for accurate readings</p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={() => handleCalibrate('hr')}
                disabled={calibrating}
              >
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw size={18} className={calibrating ? 'animate-spin' : ''} />
                  Calibrate Heart Rate
                </div>
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={() => handleCalibrate('spo2')}
                disabled={calibrating}
              >
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw size={18} className={calibrating ? 'animate-spin' : ''} />
                  Calibrate SpO2
                </div>
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={() => handleCalibrate('temperature')}
                disabled={calibrating}
              >
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw size={18} className={calibrating ? 'animate-spin' : ''} />
                  Calibrate Temperature
                </div>
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-4 bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.35)]">
          <h3 className="font-semibold text-gray-900 mb-4">Device Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Model</span>
              <span className="font-medium text-gray-900">Arduino Uno + SAHAYAK Sensor Kit</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Firmware Protocol</span>
              <span className="font-medium text-gray-900">Serial CSV/JSON</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Data Sync</span>
              <span className="font-medium text-gray-900">Live via WebSocket</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Sync</span>
              <span className="font-medium text-gray-900">{new Date().toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>
      <BottomNavigation />
    </div>
  )
}

