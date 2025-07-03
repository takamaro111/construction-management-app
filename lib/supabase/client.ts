import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../../types/database'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://drhcinwdqwcosbjxwzfl.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyaGNpbndkcXdjb3NianF3emZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4OTQ4ODEsImV4cCI6MjA1MTQ3MDg4MX0.aOLgJdBKxI_b7YLsZdOz7WnxqRjpgB9tgJ9DhFHrMVQ'
  
  // デバッグ用ログ
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key length:', supabaseAnonKey?.length)
  console.log('Key starts with:', supabaseAnonKey?.substring(0, 20))
  
  // 値の検証
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials!')
    throw new Error('Supabase credentials are required')
  }
  
  if (typeof supabaseUrl !== 'string' || typeof supabaseAnonKey !== 'string') {
    console.error('Invalid Supabase credential types!')
    throw new Error('Supabase credentials must be strings')
  }
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}