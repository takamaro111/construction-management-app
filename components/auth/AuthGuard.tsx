'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          console.log('認証エラーまたはユーザーなし:', error)
          setIsAuthenticated(false)
          router.push('/auth/login')
          return
        }
        
        console.log('認証済みユーザー:', user.email)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('認証チェックエラー:', error)
        setIsAuthenticated(false)
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('認証状態変更:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          setIsAuthenticated(true)
          setIsLoading(false)
        } else if (event === 'SIGNED_OUT' || !session) {
          setIsAuthenticated(false)
          setIsLoading(false)
          router.push('/auth/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  // 未認証の場合は何も表示しない（リダイレクト中）
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">ログインページにリダイレクト中...</p>
        </div>
      </div>
    )
  }

  // 認証済みの場合は子コンポーネントを表示
  return <>{children}</>
}