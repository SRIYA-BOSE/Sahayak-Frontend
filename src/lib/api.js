const resolveApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    const envUrl = import.meta.env.VITE_API_URL
    if (typeof window !== 'undefined') {
      try {
        const parsed = new URL(envUrl)
        const hostIsLocal =
          parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
        const runningOnLocalHost =
          window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

        // If UI is opened from another device (phone on LAN), remap localhost API to current host.
        if (hostIsLocal && !runningOnLocalHost) {
          parsed.hostname = window.location.hostname
          return parsed.toString().replace(/\/$/, '')
        }
      } catch {
        // ignore invalid env URL and use raw value
      }
    }
    return envUrl
  }
  if (typeof window !== 'undefined') {
    const sameOriginApi = `${window.location.protocol}//${window.location.host}/api`
    return sameOriginApi
  }
  return 'https://sahayak-backend.vercel.app/api'
}

const API_BASE_URL = resolveApiBaseUrl()

// Helper to get auth token from Supabase session
const getAuthToken = async () => {
  const { supabase } = await import('./supabase')
  if (!supabase) return null
  
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

// Helper to create headers with auth token
const createHeaders = async (includeAuth = true) => {
  const headers = { 'Content-Type': 'application/json' }
  if (includeAuth) {
    const token = await getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }
  return headers
}

export const api = {
  // Authentication
  signUp: async (email, password, userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: await createHeaders(false),
      body: JSON.stringify({ email, password, ...userData }),
    })
    return response.json()
  },

  signIn: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: await createHeaders(false),
      body: JSON.stringify({ email, password }),
    })
    return response.json()
  },

  signOut: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/signout`, {
      method: 'POST',
      headers: await createHeaders(true),
    })
    return response.json()
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/user`, {
      method: 'GET',
      headers: await createHeaders(true),
    })
    return response.json()
  },

  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: await createHeaders(true),
      body: JSON.stringify(profileData),
    })
    return response.json()
  },

  // Health Records
  saveHealthRecord: async (data) => {
    const response = await fetch(`${API_BASE_URL}/health/record`, {
      method: 'POST',
      headers: await createHeaders(true),
      body: JSON.stringify(data),
    })
    return response.json()
  },

  getHealthRecords: async (startDate, endDate) => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    const response = await fetch(`${API_BASE_URL}/health/records?${params}`, {
      method: 'GET',
      headers: await createHeaders(true),
    })
    return response.json()
  },

  // AI Recommendations
  getHealthRecommendations: async (vitalSigns) => {
    const response = await fetch(`${API_BASE_URL}/ai/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vitalSigns }),
    })
    return response.json()
  },

  // Voice Assistant
  getVoiceAssistantResponse: async (message, language = 'en') => {
    const response = await fetch(`${API_BASE_URL}/ai/voice-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language }),
    })
    return response.json()
  },

  // Job Matching
  getJobSkillMatch: async (userSkills, jobDescription) => {
    const response = await fetch(`${API_BASE_URL}/ai/job-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSkills, jobDescription }),
    })
    return response.json()
  },

  // Weather
  getWeather: async (lat, lon) => {
    const response = await fetch(`${API_BASE_URL}/weather?lat=${lat}&lon=${lon}`)
    return response.json()
  },

  getWeatherForecast: async (lat, lon) => {
    const response = await fetch(`${API_BASE_URL}/weather/forecast?lat=${lat}&lon=${lon}`)
    return response.json()
  },

  // Notifications
  getNotifications: async (limit = 50) => {
    const response = await fetch(`${API_BASE_URL}/notifications?limit=${limit}`, {
      method: 'GET',
      headers: await createHeaders(true),
    })
    return response.json()
  },

  createNotification: async (notification) => {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: await createHeaders(true),
      body: JSON.stringify(notification),
    })
    return response.json()
  },

  markNotificationRead: async (id) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
    })
    return response.json()
  },

  // Emergency Contacts
  getEmergencyContacts: async () => {
    const response = await fetch(`${API_BASE_URL}/emergency-contacts`, {
      method: 'GET',
      headers: await createHeaders(true),
    })
    return response.json()
  },

  addEmergencyContact: async (contact) => {
    const response = await fetch(`${API_BASE_URL}/emergency-contacts`, {
      method: 'POST',
      headers: await createHeaders(true),
      body: JSON.stringify(contact),
    })
    return response.json()
  },

  deleteEmergencyContact: async (id) => {
    const response = await fetch(`${API_BASE_URL}/emergency-contacts/${id}`, {
      method: 'DELETE',
      headers: await createHeaders(true),
    })
    return response.json()
  },

  // Government Schemes
  getSchemes: async (category = 'all', search = '') => {
    const params = new URLSearchParams({ category, search })
    const response = await fetch(`${API_BASE_URL}/schemes?${params}`)
    return response.json()
  },

  // Jobs
  getJobs: async (type = 'all', search = '') => {
    const params = new URLSearchParams({ type, search })
    const response = await fetch(`${API_BASE_URL}/jobs?${params}`)
    return response.json()
  },

  // Education
  getEducationContent: async (category, language = 'en') => {
    const params = new URLSearchParams({ category, language })
    const response = await fetch(`${API_BASE_URL}/education?${params}`)
    return response.json()
  },

  // Device
  getDeviceData: async () => {
    const response = await fetch(`${API_BASE_URL}/device`, {
      method: 'GET',
      headers: await createHeaders(true),
    })
    return response.json()
  },

  saveDeviceData: async (deviceData) => {
    const response = await fetch(`${API_BASE_URL}/device`, {
      method: 'POST',
      headers: await createHeaders(true),
      body: JSON.stringify(deviceData),
    })
    return response.json()
  },

  // Arduino Serial Communication
  listArduinoPorts: async () => {
    const response = await fetch(`${API_BASE_URL}/arduino/ports`)
    return response.json()
  },

  connectArduino: async (comPort = 'COM7', baudRate = 115200) => {
    const response = await fetch(`${API_BASE_URL}/arduino/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comPort, baudRate }),
    })
    return response.json()
  },

  disconnectArduino: async () => {
    const response = await fetch(`${API_BASE_URL}/arduino/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    return response.json()
  },

  getArduinoStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/arduino/status`)
    return response.json()
  },

  getArduinoData: async () => {
    const response = await fetch(`${API_BASE_URL}/arduino/data`)
    return response.json()
  },

  // Worker Dataset
  getWorkerDataset: async () => {
    const response = await fetch(`${API_BASE_URL}/workers/dataset`)
    return response.json()
  },
}
