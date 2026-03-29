import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { BluetoothProvider } from './context/BluetoothContext'
import { Dashboard } from './pages/Dashboard'
import { Profile } from './pages/Profile'
import { HealthMonitoring } from './pages/HealthMonitoring'
import { Notifications } from './pages/Notifications'
import { Weather } from './pages/Weather'
import { Education } from './pages/Education'
import { GovernmentSchemes } from './pages/GovernmentSchemes'
import { Jobs } from './pages/Jobs'
import { VoiceAssistant } from './pages/VoiceAssistant'
import { Emergency } from './pages/Emergency'
import { DeviceManagement } from './pages/DeviceManagement'
import { Login } from './pages/Login'
import { LoadingSpinner } from './components/LoadingSpinner'
import { useEffect } from 'react'
import { initDB } from './lib/indexedDB'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  useEffect(() => {
    // Initialize IndexedDB
    initDB().catch(console.error)
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/health"
        element={
          <ProtectedRoute>
            <HealthMonitoring />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/weather"
        element={
          <ProtectedRoute>
            <Weather />
          </ProtectedRoute>
        }
      />
      <Route
        path="/education"
        element={
          <ProtectedRoute>
            <Education />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schemes"
        element={
          <ProtectedRoute>
            <GovernmentSchemes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/jobs"
        element={
          <ProtectedRoute>
            <Jobs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/voice-assistant"
        element={
          <ProtectedRoute>
            <VoiceAssistant />
          </ProtectedRoute>
        }
      />
      <Route
        path="/emergency"
        element={
          <ProtectedRoute>
            <Emergency />
          </ProtectedRoute>
        }
      />
      <Route
        path="/device"
        element={
          <ProtectedRoute>
            <DeviceManagement />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BluetoothProvider>
          <AppRoutes />
        </BluetoothProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

