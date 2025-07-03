import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../../types/database'

export function createClient() {
  const supabaseUrl = 'https://drhcinwdqwcosbjxwzfl.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyaGNpbndkcXdjb3NianF3emZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4OTQ4ODEsImV4cCI6MjA1MTQ3MDg4MX0.aOLgJdBKxI_b7YLsZdOz7WnxqRjpgB9tgJ9DhFHrMVQ'
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}