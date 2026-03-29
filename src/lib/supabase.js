import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && 
         supabaseAnonKey && 
         supabaseUrl !== 'your_supabase_project_url' &&
         supabaseAnonKey !== 'your_supabase_anon_key' &&
         !supabaseUrl.includes('placeholder')
}

// Create client only if configured, otherwise return null
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Database schema helpers
export const tables = {
  users: 'users',
  health_records: 'health_records',
  emergency_contacts: 'emergency_contacts',
  notifications: 'notifications',
  government_schemes: 'government_schemes',
  jobs: 'jobs',
  education_content: 'education_content',
  device_data: 'device_data',
}

