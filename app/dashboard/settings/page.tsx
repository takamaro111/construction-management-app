'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { Building2, User, Lock, Save, Bell, Globe, Palette } from 'lucide-react'
import { toast } from 'react-hot-toast'

type CompanyInfo = {
  id: string
  name: string
  created_at: string
}

type UserInfo = {
  id: string
  name: string
  email: string
  role: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // ユーザー情報を取得
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, email, role, company_id')
        .eq('id', user.id)
        .single()

      if (!userData) return

      setUserInfo({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      })

      // 会社情報を取得
      const { data: companyData } = await supabase
        .from('companies')
        .select('id, name, created_at')
        .eq('id', userData.company_id)
        .single()

      if (companyData) {
        setCompanyInfo(companyData)
      }
    } catch (error) {
      console.error('データ取得エラー:', error)
      toast.error('ユーザー情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'プロフィール', icon: User },
    { id: 'company', name: '会社情報', icon: Building2 },
    { id: 'security', name: 'セキュリティ', icon: Lock },
    { id: 'notifications', name: '通知設定', icon: Bell },
    { id: 'preferences', name: '表示設定', icon: Palette }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-xl font-semibold text-gray-900">設定</h1>
        <p className="mt-1 text-sm text-gray-500">アカウントとアプリケーションの設定を管理</p>
      </div>

      <div className="flex gap-6">
        {/* サイドバー */}
        <div className="w-64 bg-white rounded-lg shadow-sm p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${
                    activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1">{activeTab === 'profile' && (
            <ProfileSettings userInfo={userInfo!} onUpdate={fetchData} />
          )}
          {activeTab === 'company' && (
            <CompanySettings companyInfo={companyInfo!} userRole={userInfo?.role || ''} onUpdate={fetchData} />
          )}
          {activeTab === 'security' && (
            <SecuritySettings />
          )}
          {activeTab === 'notifications' && (
            <NotificationSettings />
          )}
          {activeTab === 'preferences' && (
            <PreferenceSettings />
          )}
        </div>
      </div>
    </div>
  )
}

// プロファイル設定
function ProfileSettings({ userInfo, onUpdate }: { userInfo: UserInfo; onUpdate: () => void }) {
  const [name, setName] = useState(userInfo.name)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ name })
        .eq('id', userInfo.id)

      if (error) {
        toast.error('更新に失敗しました')
        return
      }

      toast.success('プロファイルを更新しました')
      onUpdate()
    } catch (error) {
      toast.error('エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">プロフィール設定</h2>
        <p className="text-sm text-gray-500">個人情報とアカウント設定を管理</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            名前
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            メールアドレス
          </label>
          <input
            type="email"
            value={userInfo.email}
            disabled
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
          />
          <p className="mt-1 text-sm text-gray-500">メールアドレスは変更できません</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            権限
          </label>
          <input
            type="text"
            value={userInfo.role === 'admin' ? '管理者' : userInfo.role === 'manager' ? 'マネージャー' : '閲覧者'}
            disabled
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
          />
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 会社情報設定
function CompanySettings({ companyInfo, userRole, onUpdate }: { companyInfo: CompanyInfo; userRole: string; onUpdate: () => void }) {
  const [companyName, setCompanyName] = useState(companyInfo.name)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    if (userRole !== 'admin') {
      toast.error('管理者のみが会社情報を変更できます')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('companies')
        .update({ name: companyName })
        .eq('id', companyInfo.id)

      if (error) {
        toast.error('更新に失敗しました')
        return
      }

      toast.success('会社情報を更新しました')
      onUpdate()
    } catch (error) {
      toast.error('エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">会社情報</h2>
        <p className="text-sm text-gray-500">会社の基本情報を管理</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            会社名
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={userRole !== 'admin'}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            登録日
          </label>
          <input
            type="text"
            value={new Date(companyInfo.created_at).toLocaleDateString('ja-JP')}
            disabled
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
          />
        </div>

        {userRole === 'admin' && (
          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// セキュリティ設定
function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('新しいパスワードが一致しません')
      return
    }

    if (newPassword.length < 8) {
      toast.error('パスワードは8文字以上で設定してください')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        toast.error('パスワードの更新に失敗しました')
        return
      }

      toast.success('パスワードを更新しました')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error('エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">セキュリティ設定</h2>
        <p className="text-sm text-gray-500">アカウントのセキュリティを管理</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            現在のパスワード
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            新しいパスワード
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="8文字以上"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            新しいパスワード（確認）
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="pt-4">
          <button
            onClick={handlePasswordChange}
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Lock className="h-4 w-4 mr-2" />
            {saving ? '更新中...' : 'パスワードを変更'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 通知設定
function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [chatNotifications, setChatNotifications] = useState(true)
  const [scheduleReminders, setScheduleReminders] = useState(true)

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">通知設定</h2>
        <p className="text-sm text-gray-500">通知の受信設定を管理</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">メール通知</h4>
            <p className="text-sm text-gray-500">重要な更新をメールで受け取る</p>
          </div>
          <button
            onClick={() => setEmailNotifications(!emailNotifications)}
            className={`${
              emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
          >
            <span
              className={`${
                emailNotifications ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">チャット通知</h4>
            <p className="text-sm text-gray-500">新しいメッセージの通知音</p>
          </div>
          <button
            onClick={() => setChatNotifications(!chatNotifications)}
            className={`${
              chatNotifications ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
          >
            <span
              className={`${
                chatNotifications ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">スケジュールリマインダー</h4>
            <p className="text-sm text-gray-500">予定の事前通知</p>
          </div>
          <button
            onClick={() => setScheduleReminders(!scheduleReminders)}
            className={`${
              scheduleReminders ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
          >
            <span
              className={`${
                scheduleReminders ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

// 環境設定
function PreferenceSettings() {
  const [language, setLanguage] = useState('ja')
  const [theme, setTheme] = useState('light')
  const [dateFormat, setDateFormat] = useState('YYYY/MM/DD')

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">表示設定</h2>
        <p className="text-sm text-gray-500">アプリケーションの表示をカスタマイズ</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            言語
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            テーマ
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="light">ライト</option>
            <option value="dark">ダーク</option>
            <option value="auto">自動</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            日付形式
          </label>
          <select
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="YYYY/MM/DD">2025/06/30</option>
            <option value="YYYY-MM-DD">2025-06-30</option>
            <option value="DD/MM/YYYY">30/06/2025</option>
          </select>
        </div>

        <div className="pt-4">
          <p className="text-sm text-gray-500">※ これらの設定は今後のアップデートで反映されます</p>
        </div>
      </div>
    </div>
  )
}