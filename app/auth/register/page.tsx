'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    userName: '',
    userEmail: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // 既にログイン済みかチェック
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      } else {
        setChecking(false)
      }
    }
    checkAuth()
  }, [router, supabase.auth])

  // 認証チェック中の表示
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('パスワードが一致しません')
      return
    }

    setLoading(true)

    try {
      console.log('1. 会社情報を作成中...')
      // 1. 会社情報を作成
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([
          {
            name: formData.companyName,
            email: formData.companyEmail,
            is_approved: false,
          },
        ])
        .select()
        .single()

      if (companyError) {
        console.error('会社情報登録エラー:', companyError)
        toast.error('会社情報の登録に失敗しました: ' + companyError.message)
        return
      }

      console.log('2. ユーザーアカウントを作成中...', companyData)
      // 2. ユーザーアカウントを作成
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.userEmail,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        console.error('ユーザー登録エラー:', authError)
        // エラーの場合、会社情報も削除
        await supabase.from('companies').delete().eq('id', companyData.id)
        toast.error('ユーザー登録に失敗しました: ' + authError.message)
        return
      }

      if (authData.user) {
        console.log('3. usersテーブルにユーザー情報を追加中...', authData.user)
        // 3. usersテーブルにユーザー情報を追加
        const { error: userError } = await supabase.from('users').insert([
          {
            id: authData.user.id,
            company_id: companyData.id,
            email: formData.userEmail,
            name: formData.userName,
            role: 'admin',
          },
        ])

        if (userError) {
          console.error('ユーザー情報登録エラー:', userError)
          toast.error('ユーザー情報の登録に失敗しました: ' + userError.message)
          return
        }

        toast.success('登録が完了しました。ログインページに移動します。')
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('予期しないエラー:', error)
      toast.error('エラーが発生しました: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            新規登録
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            すでにアカウントをお持ちの方は{' '}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              ログインはこちら
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">会社情報</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    会社名
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="株式会社○○建設"
                    value={formData.companyName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">
                    会社メールアドレス
                  </label>
                  <input
                    id="companyEmail"
                    name="companyEmail"
                    type="email"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="info@company.com"
                    value={formData.companyEmail}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">管理者情報</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
                    お名前
                  </label>
                  <input
                    id="userName"
                    name="userName"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="山田 太郎"
                    value={formData.userName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700">
                    メールアドレス
                  </label>
                  <input
                    id="userEmail"
                    name="userEmail"
                    type="email"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="user@company.com"
                    value={formData.userEmail}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    パスワード
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="8文字以上"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    パスワード（確認）
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="パスワードを再入力"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {loading ? '登録中...' : '登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}