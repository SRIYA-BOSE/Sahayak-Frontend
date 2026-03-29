import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { saveSetting, getSetting, saveOfflineData, getOfflineData } from '../lib/indexedDB'

const AuthContext = createContext({})

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
    // Check for saved language preference
    getSetting('language').then((lang) => {
      if (lang) setLanguage(lang)
    }).catch(console.error)

    // Check for local user session if Supabase is not configured
    if (!isSupabaseConfigured()) {
      getOfflineData('local_user').then((localUser) => {
        if (localUser) {
          setUser(localUser)
        }
        setLoading(false)
      }).catch(() => setLoading(false))
      return
    }

    // Get initial session with error handling
    if (supabase) {
      supabase.auth.getSession()
        .then(({ data: { session } }) => {
          setUser(session?.user ?? null)
          setLoading(false)
        })
        .catch((error) => {
          console.error('Supabase connection error:', error)
          // Fallback to local auth
          getOfflineData('local_user').then((localUser) => {
            if (localUser) setUser(localUser)
            setLoading(false)
          }).catch(() => setLoading(false))
        })

      // Listen for auth changes with error handling
      try {
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null)
        })

        return () => {
          if (subscription) subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Error setting up auth listener:', error)
      }
    } else {
      setLoading(false)
    }
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

    // Always support simple local auth when Supabase is not configured
    if (!isSupabaseConfigured() || !supabase) {
      return createLocalUser()
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      })
      
      if (error) {
        // On localhost or dev, fall back to local auth instead of blocking the user
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.warn('Supabase signup failed, falling back to local auth:', error)
          return createLocalUser()
        }

        // Check if it's a network/connection error
        if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
          return { 
            data: null, 
            error: { 
              message: 'Cannot connect to authentication service. Please check your internet connection and ensure Supabase is configured.' 
            } 
          }
        }
        return { data, error }
      }
      
      return { data, error }
    } catch (err) {
      // Handle network or configuration errors - fallback to local auth in dev
      if (
        err.message?.includes('fetch') || 
        err.message?.includes('network') || 
        err.name === 'TypeError' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
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
      return {
        data: null,
        error: { message: fallbackMessage },
      }
    }

    // Use local auth if Supabase is not configured
    if (!isSupabaseConfigured() || !supabase) {
      return tryLocalUser('Invalid email or password. For local demo, please sign up first.')
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        // On localhost/dev, prefer local user instead of blocking on Supabase errors
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.warn('Supabase signin failed, attempting local auth:', error)
          return tryLocalUser('Invalid email or password. For this demo, please sign up locally first.')
        }

        // Check if it's a network/connection error
        if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
          return tryLocalUser('Cannot connect to authentication service. Using local demo mode - please sign up first.')
        }
        return { data, error }
      }
      
      return { data, error }
    } catch (err) {
      // Handle network or configuration errors - fallback to local auth in dev
      if (
        err.message?.includes('fetch') || 
        err.message?.includes('network') || 
        err.name === 'TypeError' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      ) {
        console.warn('Signin error, attempting local auth fallback:', err)
        return tryLocalUser('Failed to connect to authentication service. Using local demo mode - please sign up first.')
      }
      return { data: null, error: err }
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      // Clear local user
      await saveOfflineData('local_user', null)
      setUser(null)
      return { error: null }
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        // Clear local user anyway
        await saveOfflineData('local_user', null)
        setUser(null)
      }
      return { error }
    } catch (err) {
      // Clear local user on error
      await saveOfflineData('local_user', null)
      setUser(null)
      return { error: null }
    }
  }, [])

  const updateLanguage = useCallback(async (lang) => {
    setLanguage(lang)
    await saveSetting('language', lang)
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    language,
    setLanguage: updateLanguage,
    signUp,
    signIn,
    signOut,
  }), [user, loading, language, updateLanguage, signUp, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

