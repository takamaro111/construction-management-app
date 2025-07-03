import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../../types/database'

export function createClient() {
  const supabaseUrl = 'https://drhcinwdqwcosbjxwzfl.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyaGNpbndkcXdjb3Nianh3emZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDIwNzQsImV4cCI6MjA2Njc3ODA3NH0.YfWoZPNAzI4PQIpPjEWd0XTP0IKv7wt2_vQX5pTzKv0'
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}