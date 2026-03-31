const AUTH_STORAGE_KEY = 'sahayak_auth_session'
const DEPLOYED_BACKEND_URL = 'https://sahayak-backend.vercel.app/api'

const trimTrailingSlash = (value = '') => String(value).replace(/\/$/, '')

const isLocalHostname = (hostname = '') => hostname === 'localhost' || hostname === '127.0.0.1'

const getSameOriginApiUrl = () => {
  if (typeof window === 'undefined') return null
  return `${window.location.protocol}//${window.location.host}/api`
}

const getEnvApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (!envUrl) return null

  if (typeof window !== 'undefined') {
    try {
      const parsed = new URL(envUrl)
      const hostIsLocal = isLocalHostname(parsed.hostname)
      const runningOnLocalHost = isLocalHostname(window.location.hostname)

      // If UI is opened from another device on the same LAN, remap localhost API to that host.
      if (hostIsLocal && !runningOnLocalHost) {
        if (window.location.hostname.includes('vercel.app')) {
          return DEPLOYED_BACKEND_URL
        }

        parsed.hostname = window.location.hostname
        return trimTrailingSlash(parsed.toString())
      }
    } catch {
      // ignore invalid env URL and use raw value
    }
  }

  return trimTrailingSlash(envUrl)
}

const getApiBaseCandidates = () => {
  const candidates = []
  const addCandidate = (value) => {
    if (!value) return
    const normalized = trimTrailingSlash(value)
    if (normalized && !candidates.includes(normalized)) {
      candidates.push(normalized)
    }
  }

  const envUrl = getEnvApiUrl()
  const sameOriginApi = getSameOriginApiUrl()

  if (typeof window !== 'undefined' && isLocalHostname(window.location.hostname)) {
    addCandidate(envUrl || 'http://localhost:5000/api')
    addCandidate(sameOriginApi)
    addCandidate(DEPLOYED_BACKEND_URL)
    return candidates
  }

  // In deployed environments, prefer the explicit backend first.
  // The frontend Vercel app may not expose auth/api routes at its own /api path.
  addCandidate(envUrl)
  addCandidate(sameOriginApi)
  addCandidate(DEPLOYED_BACKEND_URL)

  return candidates
}

const API_BASE_CANDIDATES = getApiBaseCandidates()

const requestJson = async (path, options = {}) => {
  let lastFailure = {
    success: false,
    error: 'Network request failed',
    data: null,
  }

  for (const baseUrl of API_BASE_CANDIDATES) {
    try {
      const response = await fetch(`${baseUrl}${path}`, options)
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const isRetryableMissingRoute = response.status === 404 && API_BASE_CANDIDATES.length > 1

        lastFailure = {
          success: false,
          error: data?.error || `Request failed with status ${response.status}`,
          data: data?.data ?? null,
        }

        if (isRetryableMissingRoute) {
          continue
        }

        return lastFailure
      }

      return data ?? { success: true }
    } catch (error) {
      lastFailure = {
        success: false,
        error:
          error?.message ||
          'Network request failed. Check that the deployed API URL is reachable and CORS is enabled.',
        data: null,
      }
    }
  }

  try {
    console.error('All API base URL candidates failed for path:', path, API_BASE_CANDIDATES)
  } catch {
    // ignore logging issues in restricted environments
  }

  return lastFailure
}

// Helper to get auth token from the stored backend session
const getAuthToken = async () => {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.token || null
  } catch {
    return null
  }
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
    return requestJson('/auth/signup', {
      method: 'POST',
      headers: await createHeaders(false),
      body: JSON.stringify({ email, password, ...userData }),
    })
  },

  signIn: async (email, password) => {
    return requestJson('/auth/signin', {
      method: 'POST',
      headers: await createHeaders(false),
      body: JSON.stringify({ email, password }),
    })
  },

  signOut: async () => {
    return requestJson('/auth/signout', {
      method: 'POST',
      headers: await createHeaders(true),
    })
  },

  getCurrentUser: async () => {
    return requestJson('/auth/user', {
      method: 'GET',
      headers: await createHeaders(true),
    })
  },

  updateProfile: async (profileData) => {
    return requestJson('/auth/profile', {
      method: 'PUT',
      headers: await createHeaders(true),
      body: JSON.stringify(profileData),
    })
  },

  // Health Records
  saveHealthRecord: async (data) => {
    return requestJson('/health/record', {
      method: 'POST',
      headers: await createHeaders(true),
      body: JSON.stringify(data),
    })
  },

  getHealthRecords: async (startDate, endDate) => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    return requestJson(`/health/records?${params}`, {
      method: 'GET',
      headers: await createHeaders(true),
    })
  },

  // AI Recommendations
  getHealthRecommendations: async (vitalSigns) => {
    return requestJson('/ai/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vitalSigns }),
    })
  },

  // Voice Assistant
  getVoiceAssistantResponse: async (message, language = 'en') => {
    return requestJson('/ai/voice-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language }),
    })
  },

  // Job Matching
  getJobSkillMatch: async (userSkills, jobDescription) => {
    return requestJson('/ai/job-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSkills, jobDescription }),
    })
  },

  // Weather
  getWeather: async (lat, lon) => {
    return requestJson(`/weather?lat=${lat}&lon=${lon}`)
  },

  getWeatherForecast: async (lat, lon) => {
    return requestJson(`/weather/forecast?lat=${lat}&lon=${lon}`)
  },

  // Notifications
  getNotifications: async (limit = 50) => {
    return requestJson(`/notifications?limit=${limit}`, {
      method: 'GET',
      headers: await createHeaders(true),
    })
  },

  createNotification: async (notification) => {
    return requestJson('/notifications', {
      method: 'POST',
      headers: await createHeaders(true),
      body: JSON.stringify(notification),
    })
  },

  markNotificationRead: async (id) => {
    return requestJson(`/notifications/${id}/read`, {
      method: 'PATCH',
      headers: await createHeaders(true),
    })
  },

  // Emergency Contacts
  getEmergencyContacts: async () => {
    return requestJson('/emergency-contacts', {
      method: 'GET',
      headers: await createHeaders(true),
    })
  },

  addEmergencyContact: async (contact) => {
    return requestJson('/emergency-contacts', {
      method: 'POST',
      headers: await createHeaders(true),
      body: JSON.stringify(contact),
    })
  },

  deleteEmergencyContact: async (id) => {
    return requestJson(`/emergency-contacts/${id}`, {
      method: 'DELETE',
      headers: await createHeaders(true),
    })
  },

  // Government Schemes
  getSchemes: async (category = 'all', search = '') => {
    const params = new URLSearchParams({ category, search })
    return requestJson(`/schemes?${params}`)
  },

  // Jobs
  getJobs: async (type = 'all', search = '') => {
    const params = new URLSearchParams({ type, search })
    return requestJson(`/jobs?${params}`)
  },

  // Education
  getEducationContent: async (category, language = 'en') => {
    const params = new URLSearchParams({ category, language })
    return requestJson(`/education?${params}`)
  },

  // Device
  getDeviceData: async () => {
    return requestJson('/device', {
      method: 'GET',
      headers: await createHeaders(true),
    })
  },

  saveDeviceData: async (deviceData) => {
    return requestJson('/device', {
      method: 'POST',
      headers: await createHeaders(true),
      body: JSON.stringify(deviceData),
    })
  },

  // Arduino Serial Communication
  listArduinoPorts: async () => {
    return requestJson('/arduino/ports')
  },

  connectArduino: async (comPort = 'COM7', baudRate = 115200) => {
    return requestJson('/arduino/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comPort, baudRate }),
    })
  },

  disconnectArduino: async () => {
    return requestJson('/arduino/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
  },

  getArduinoStatus: async () => {
    return requestJson('/arduino/status')
  },

  getArduinoData: async () => {
    return requestJson('/arduino/data')
  },

  // Worker Dataset
  getWorkerDataset: async () => {
    return requestJson('/workers/dataset')
  },
}
