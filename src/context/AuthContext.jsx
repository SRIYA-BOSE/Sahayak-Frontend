import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { saveSetting, getSetting, saveOfflineData, getOfflineData } from '../lib/indexedDB'
import { api } from '../lib/api'

const AuthContext = createContext({})
const AUTH_STORAGE_KEY = 'sahayak_auth_session'

const readStoredSession = () => {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const writeStoredSession = (session) => {
  if (typeof window === 'undefined') return

  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState('en')

  useEffect(() => {
    document.documentElement.setAttribute('lang', language)
  }, [language])

  useEffect(() => {
    getSetting('language')
      .then((lang) => {
        if (lang) setLanguage(lang)
      })
      .catch(console.error)

    const restoreSession = async () => {
      const storedSession = readStoredSession()

      if (!storedSession?.token) {
        const localUser = await getOfflineData('local_user').catch(() => null)
        if (localUser) setUser(localUser)
        setLoading(false)
        return
      }

      try {
        const result = await api.getCurrentUser()
        if (result?.success && result.data?.user) {
          const hydratedUser = {
            ...result.data.user,
            profile: result.data.profile || null,
          }
          setUser(hydratedUser)
        } else {
          writeStoredSession(null)
          const localUser = await getOfflineData('local_user').catch(() => null)
          if (localUser) setUser(localUser)
        }
      } catch (error) {
        console.error('Auth restore failed:', error)
        writeStoredSession(null)
        const localUser = await getOfflineData('local_user').catch(() => null)
        if (localUser) setUser(localUser)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  const signUp = useCallback(async (email, password, userData) => {
    const createLocalUser = async () => {
      const localUser = {
        id: `local_${Date.now()}`,
        email,
        user_metadata: userData || {},
        created_at: new Date().toISOString(),
      }
      await saveOfflineData('local_user', localUser)
      setUser(localUser)
      return { data: { user: localUser }, error: null }
    }

    try {
      const result = await api.signUp(email, password, userData || {})
      if (!result?.success) {
        return {
          data: null,
          error: { message: result?.error || 'Sign up failed' },
        }
      }

      const session = result.data?.session
      if (session?.access_token) {
        writeStoredSession({
          token: session.access_token,
          user: result.data.user,
        })
      }

      const nextUser = {
        ...result.data.user,
        profile: result.data.profile || null,
      }
      setUser(nextUser)
      return { data: result.data, error: null }
    } catch (err) {
      if (
        err.message?.includes('fetch') ||
        err.message?.includes('network') ||
        err.name === 'TypeError'
      ) {
        console.warn('Signup error, using local auth fallback:', err)
        return createLocalUser()
      }
      return { data: null, error: err }
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    const tryLocalUser = async (fallbackMessage) => {
      const localUser = await getOfflineData('local_user')
      if (localUser && localUser.email === email) {
        setUser(localUser)
        return { data: { user: localUser }, error: null }
      }
      return { data: null, error: { message: fallbackMessage } }
    }

    try {
      const result = await api.signIn(email, password)
      if (!result?.success) {
        return {
          data: null,
          error: { message: result?.error || 'Invalid email or password' },
        }
      }

      const session = result.data?.session
      if (session?.access_token) {
        writeStoredSession({
          token: session.access_token,
          user: result.data.user,
        })
      }

      const nextUser = {
        ...result.data.user,
        profile: result.data.profile || null,
      }
      setUser(nextUser)
      return { data: result.data, error: null }
    } catch (err) {
      if (
        err.message?.includes('fetch') ||
        err.message?.includes('network') ||
        err.name === 'TypeError'
      ) {
        console.warn('Signin error, attempting local auth fallback:', err)
        return tryLocalUser('Failed to connect to authentication service. Please sign up locally first.')
      }
      return { data: null, error: err }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await api.signOut()
    } catch {
      // Ignore signout failures and clear local state anyway.
    }

    writeStoredSession(null)
    await saveOfflineData('local_user', null)
    setUser(null)
    return { error: null }
  }, [])

  const updateLanguage = useCallback(async (lang) => {
    setLanguage(lang)
    await saveSetting('language', lang)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      language,
      setLanguage: updateLanguage,
      signUp,
      signIn,
      signOut,
    }),
    [user, loading, language, updateLanguage, signUp, signIn, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
