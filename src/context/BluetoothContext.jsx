import { createContext, useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../lib/api'
import { saveHealthRecord } from '../lib/indexedDB'

export const BluetoothContext = createContext({})

export const BluetoothProvider = ({ children }) => {
  const [device, setDevice] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [hasReceivedLiveData, setHasReceivedLiveData] = useState(false)
  const [batteryLevel, setBatteryLevel] = useState(null)
  const [vitalSigns, setVitalSigns] = useState({
    heartRate: 0,
    spo2: 0,
    irValue: 0,
    redValue: 0,
    ambientTemperature: 0,
    humidity: 0,
    noiseLevel: 0,
    airQualityPpm: 0,
    vibrationLevel: 0,
    tiltAngle: 0,
    accelX: 0,
    accelY: 0,
    accelZ: 0,
  })
  const [error, setError] = useState(null)
  const [availablePorts, setAvailablePorts] = useState([])
  const [connectedPort, setConnectedPort] = useState(null)
  const [vitalSignsHistory, setVitalSignsHistory] = useState([])
  const [serialMonitorLines, setSerialMonitorLines] = useState([])
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const lastSavedRecordRef = useRef(0)
  const lastLivePacketRef = useRef(0)
  const MAX_HISTORY = 180
  const MAX_SERIAL_LINES = 120

  const resolveWsUrl = useCallback(() => {
    if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
    if (import.meta.env.VITE_API_URL) {
      try {
        const apiUrl = new URL(import.meta.env.VITE_API_URL)
        const wsProtocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
        const hostIsLocal =
          apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1'
        const runningOnLocalHost =
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

        // If UI is on another device, remap localhost backend to UI host machine.
        if (typeof window !== 'undefined' && hostIsLocal && !runningOnLocalHost) {
          apiUrl.hostname = window.location.hostname
        }

        return `${wsProtocol}//${apiUrl.host}/ws`
      } catch {
        // ignore malformed env URL and continue to fallback
      }
    }
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      return `${protocol}://${window.location.host}/ws`
    }
    return 'ws://localhost:5000/ws'
  }, [])

  const handleIncomingData = useCallback((incomingData = {}) => {
    const sensorKeys = [
      'heartRate',
      'spo2',
      'irValue',
      'redValue',
      'ambientTemperature',
      'humidity',
      'noiseLevel',
      'airQualityPpm',
      'vibrationLevel',
      'tiltAngle',
      'accelX',
      'accelY',
      'accelZ',
    ]

    const readingPatch = {}
    for (const key of sensorKeys) {
      if (!Object.prototype.hasOwnProperty.call(incomingData, key)) continue
      const value = Number(incomingData[key])
      if (Number.isFinite(value)) {
        readingPatch[key] = value
      }
    }

    const timestamp = incomingData.timestamp || new Date().toISOString()
    const rawLine = incomingData.rawLine || ''
    const sourceFormat = incomingData.sourceFormat || ''
    const hasMeaningfulReading = Object.values(readingPatch).some(
      (value) => Number.isFinite(value) && value > 0
    )

    lastLivePacketRef.current = Date.now()

    setVitalSigns((prev) => {
      const next = { ...prev, ...readingPatch }

      if (Number(readingPatch.heartRate) <= 0 && Number(prev.heartRate) > 0) {
        next.heartRate = prev.heartRate
      }

      if (Number(readingPatch.spo2) <= 0 && Number(prev.spo2) > 0) {
        next.spo2 = prev.spo2
      }

      return next
    })

    if (hasMeaningfulReading || rawLine) {
      setHasReceivedLiveData(true)
    }

    if (rawLine) {
      setSerialMonitorLines((prev) => {
        const next = [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            timestamp,
            rawLine,
            sourceFormat,
          },
          ...prev,
        ]
        return next.slice(0, MAX_SERIAL_LINES)
      })
    }

    if (hasMeaningfulReading) {
      setVitalSignsHistory((prev) => {
        const next = [{ ...readingPatch, timestamp }, ...prev]
        return next.slice(0, MAX_HISTORY)
      })

      const now = Date.now()
      if (now - lastSavedRecordRef.current >= 1000) {
        lastSavedRecordRef.current = now
        saveHealthRecord({
          ...readingPatch,
          timestamp,
        }).catch((storageError) => {
          console.error('Failed to store health record locally:', storageError)
        })
      }
    }
  }, [MAX_HISTORY, MAX_SERIAL_LINES])

  // WebSocket connection for real-time data
  const connectWebSocket = useCallback(() => {
    const wsUrl = resolveWsUrl()

    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      return
    }
    
    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setError(null)
        // Send ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          } else {
            clearInterval(pingInterval)
          }
        }, 30000) // Ping every 30 seconds

        ws.pingInterval = pingInterval
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'data' && message.data) {
            handleIncomingData(message.data)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('WebSocket connection error')
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        // Attempt to reconnect after 3 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isConnected) {
            connectWebSocket()
          }
        }, 3000)
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      setError('Failed to connect to server')
    }
  }, [handleIncomingData, isConnected, resolveWsUrl])

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.pingInterval) {
        clearInterval(wsRef.current.pingInterval)
      }
      wsRef.current.close()
      wsRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  // Load available COM ports
  const loadAvailablePorts = async () => {
    try {
      const result = await api.listArduinoPorts()
      if (result.success) {
        setAvailablePorts(result.data || [])
      }
    } catch (error) {
      console.error('Error loading ports:', error)
    }
  }

  // Check connection status periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await api.getArduinoStatus()
        if (result.success && result.data) {
          const currentlyConnected = result.data.isConnected || false
          setIsConnected(currentlyConnected)
          if (!currentlyConnected) {
            setDevice(null)
            setConnectedPort(null)
          }
          // Use polling only as a fallback/initial hydration to avoid flicker
          // from repeatedly pushing the same reading while WebSocket is active.
          const socketReady =
            wsRef.current &&
            (wsRef.current.readyState === WebSocket.OPEN ||
              wsRef.current.readyState === WebSocket.CONNECTING)

          if (result.data.isConnected && result.data.currentData && !socketReady) {
            handleIncomingData(result.data.currentData)
          }
        }
      } catch (error) {
        console.error('Error checking status:', error)
      }
    }

    // Check status immediately and then every 5 seconds
    checkStatus()
    const interval = setInterval(checkStatus, 5000)

    // Load available ports on mount
    loadAvailablePorts()

    return () => clearInterval(interval)
  }, [handleIncomingData])

  // Fast fallback sync: keeps dashboard smooth if WebSocket is delayed.
  useEffect(() => {
    if (!isConnected) return undefined

    const syncCurrentData = async () => {
      try {
        const socketReady =
          wsRef.current &&
          (wsRef.current.readyState === WebSocket.OPEN ||
            wsRef.current.readyState === WebSocket.CONNECTING)
        const staleMs = Date.now() - lastLivePacketRef.current
        const shouldPoll = !socketReady || staleMs > 2500

        if (!shouldPoll) return

        const result = await api.getArduinoData()
        if (result.success && result.data) {
          handleIncomingData(result.data)
        }
      } catch (pollError) {
        console.error('Fast sensor sync failed:', pollError)
      }
    }

    syncCurrentData()
    const fastInterval = setInterval(syncCurrentData, 1000)
    return () => clearInterval(fastInterval)
  }, [handleIncomingData, isConnected])

  // Connect WebSocket when connected
  useEffect(() => {
    if (isConnected) {
      connectWebSocket()
    } else {
      disconnectWebSocket()
    }

    return () => {
      disconnectWebSocket()
    }
  }, [connectWebSocket, disconnectWebSocket, isConnected])

  // Request device connection (Arduino via COM port)
  const requestDevice = async (comPort = 'COM7', baudRate = 115200) => {
    try {
      setIsConnecting(true)
      setError(null)
      
      // First, try to connect to Arduino
      const connectResult = await api.connectArduino(comPort, baudRate)
      
      if (connectResult.success) {
        setConnectedPort(comPort)
        setIsConnected(true)
        setDevice({ name: `Arduino (${comPort})`, id: comPort })

        // Get initial data
        const dataResult = await api.getArduinoData()
        if (dataResult.success && dataResult.data) {
          handleIncomingData(dataResult.data)
        }

        return { success: true }
      } else {
        setError(connectResult.error || 'Failed to connect to Arduino')
        return { success: false, error: connectResult.error }
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to connect to Arduino'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsConnecting(false)
    }
  }

  // Disconnect device
  const disconnect = async () => {
    try {
      disconnectWebSocket()
      await api.disconnectArduino()
      setIsConnected(false)
      setDevice(null)
      setConnectedPort(null)
      setBatteryLevel(null)
      setError(null)
      setVitalSigns({
        heartRate: 0,
        spo2: 0,
        irValue: 0,
        redValue: 0,
        ambientTemperature: 0,
        humidity: 0,
        noiseLevel: 0,
        airQualityPpm: 0,
        vibrationLevel: 0,
        tiltAngle: 0,
        accelX: 0,
        accelY: 0,
        accelZ: 0,
      })
      setHasReceivedLiveData(false)
      setSerialMonitorLines([])
    } catch (error) {
      console.error('Error disconnecting:', error)
      setError(error.message)
    }
  }

  // Calibrate sensor (placeholder - can be implemented if Arduino supports it)
  const calibrateSensor = async () => {
    if (!isConnected) {
      return { success: false, error: 'Not connected' }
    }
    // This would need to be implemented on the Arduino side.
    return { success: true, message: 'Calibration command sent' }
  }

  const value = {
    device,
    isConnected,
    batteryLevel,
    isConnecting,
    hasReceivedLiveData,
    vitalSigns,
    vitalSignsHistory,
    serialMonitorLines,
    error,
    requestDevice,
    disconnect,
    calibrateSensor,
    availablePorts,
    connectedPort,
    loadAvailablePorts,
  }

  return <BluetoothContext.Provider value={value}>{children}</BluetoothContext.Provider>
}
