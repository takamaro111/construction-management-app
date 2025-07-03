'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { Plus, Search, Shield, User, Mail, Edit, Trash2, UserPlus, ChevronDown, Phone, Calendar, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'

type Member = {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'member'
  phone?: string
  avatar_url?: string
  created_at: string
  last_login?: string
  status: 'active' | 'inactive'
  current_password?: string
}

const roleLabels = {
  admin: '管理者',
  manager: 'マネージャー',
  member: 'メンバー'
}

const roleColors = {
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-blue-100 text-blue-800',
  member: 'bg-gray-100 text-gray-800'
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({})
  const [memberPasswords, setMemberPasswords] = useState<{[key: string]: string}>({})
  const supabase = createClient()

  useEffect(() => {
    fetchMembers()
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setCurrentUserId(user.id)

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData) {
        setCurrentUserRole(userData.role)
      }
    } catch (error) {
      console.error('ユーザー権限確認エラー:', error)
    }
  }

  const fetchMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!userData) return

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', userData.company_id)
        .order('created_at', { ascending: false })

      if (error) {
        toast.error('メンバー情報の取得に失敗しました')
        return
      }

      // Supabaseのデータを型に合わせて変換
      const formattedMembers: Member[] = data?.map(user => ({
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email || '',
        role: user.role === 'admin' ? 'admin' : 
              user.role === 'manager' ? 'manager' : 'member', // データベースの'viewer'をUIの'member'に変換
        phone: user.phone || undefined,
        avatar_url: user.avatar_url || undefined,
        created_at: user.created_at,
        last_login: user.last_login || undefined,
        status: user.name?.includes('(招待中)') ? 'inactive' : 'active'
      })) || []

      setMembers(formattedMembers)
    } catch (error) {
      console.error('メンバー取得エラー:', error)
      toast.error('メンバー情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      // roleの値を確認・調整（データベースの制約に合わせる）
      const validRole = newRole === 'admin' ? 'admin' : 
                       newRole === 'manager' ? 'manager' : 'viewer'

      const { error } = await supabase
        .from('users')
        .update({ role: validRole })
        .eq('id', memberId)

      if (error) {
        toast.error('権限の更新に失敗しました')
        return
      }

      // ローカル状態を更新
      setMembers(prev => 
        prev.map(member => 
          member.id === memberId 
            ? { ...member, role: newRole as 'admin' | 'manager' | 'member' }
            : member
        )
      )
      toast.success('権限を更新しました')
    } catch (error) {
      console.error('権限更新エラー:', error)
      toast.error('権限の更新に失敗しました')
    }
  }

  const deleteMember = async (memberId: string) => {
    // 自分自身を削除しようとした場合の処理
    if (memberId === currentUserId) {
      toast.error('自分自身は削除できません')
      return
    }

    const memberToDelete = members.find(m => m.id === memberId)
    if (!memberToDelete) {
      toast.error('削除対象のメンバーが見つかりません')
      return
    }

    if (!confirm(`${memberToDelete.name}さんを完全に削除しますか？\n\n※この操作により、以下が実行されます：\n- ユーザーアカウントの完全削除\n- 認証情報の削除\n- 同じメールアドレスでの再登録が可能になります\n\nこの操作は取り消せません。`)) {
      return
    }

    try {
      // Edge Functionを使って完全削除
      const response = await fetch('https://drhcinwdqwcosbjxwzfl.supabase.co/functions/v1/delete-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyaGNpbndkcXdjb3Nianh3emZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDIwNzQsImV4cCI6MjA2Njc3ODA3NH0.YfWoZPNAzI4PQIpPjEWd0XTP0IKv7wt2_vQX5pTzKv0'
        },
        body: JSON.stringify({ 
          user_id: memberId,
          email: memberToDelete.email 
        })
      })

      const responseText = await response.text()
      console.log('Delete response:', responseText)

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse delete response:', parseError)
        toast.error('削除処理でエラーが発生しました')
        return
      }

      if (!response.ok) {
        console.error('Delete failed:', result)
        toast.error('削除に失敗しました: ' + (result.error || 'エラーが発生しました'))
        return
      }

      // ローカル状態を更新
      setMembers(prev => prev.filter(member => member.id !== memberId))
      toast.success(`${memberToDelete.name}さんを完全に削除しました。同じメールアドレスで再登録が可能です。`)
    } catch (error) {
      console.error('削除エラー:', error)
      toast.error('削除に失敗しました')
    }
  }

  const resetPassword = async (memberEmail: string, memberName: string) => {
    if (!confirm(`${memberName}さんのパスワードをリセットしますか？\n新しい一時パスワードが生成されます。`)) {
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { email: memberEmail }
      })

      console.log('パスワードリセット レスポンス:', { data, error })

      if (error) {
        console.error('パスワードリセット エラー:', error)
        toast.error('パスワードリセットに失敗しました: ' + (error.message || 'エラーが発生しました'))
        return
      }

      if (data?.error) {
        console.error('パスワードリセット データエラー:', data)
        toast.error(data.error)
        return
      }

      // 一時パスワードを表示
      if (data?.temp_password) {
        const passwordInfo = `【パスワードリセット完了】\n\nメンバー: ${memberName}\nメールアドレス: ${data.email}\n新しい一時パスワード: ${data.temp_password}\n\n※このパスワードをメンバーに共有してください。\n※ログイン後にパスワード変更を推奨します。`
        
        if (confirm(passwordInfo + '\n\nパスワードをクリップボードにコピーしますか？')) {
          try {
            await navigator.clipboard.writeText(data.temp_password)
            toast.success('パスワードをクリップボードにコピーしました！')
          } catch (err) {
            console.error('クリップボードコピーに失敗:', err)
            toast.success('パスワードリセット完了！新しいパスワード: ' + data.temp_password, {
              duration: 15000
            })
          }
        } else {
          toast.success('パスワードリセット完了！新しいパスワード: ' + data.temp_password, {
            duration: 20000
          })
        }
      }
    } catch (error) {
      console.error('パスワードリセットエラー:', error)
      toast.error('パスワードリセットに失敗しました')
    }
  }

  const viewPassword = async (memberId: string, memberName: string, memberEmail: string) => {
    // 管理者以外はアクセス不可
    if (currentUserRole !== 'admin') {
      toast.error('この機能は管理者のみ利用可能です')
      return
    }

    // 自分のパスワードは表示しない
    if (memberId === currentUserId) {
      toast.error('自分のパスワードは表示できません')
      return
    }

    if (!confirm(`${memberName}さんの現在のパスワードを表示しますか？\n\n※この操作は管理者権限で実行されます。\n※パスワードを確認後は適切に管理してください。`)) {
      return
    }

    try {
      // Edge Functionを使って現在のパスワードを取得
      const response = await fetch('https://drhcinwdqwcosbjxwzfl.supabase.co/functions/v1/get-user-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyaGNpbndkcXdjb3Nianh3emZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDIwNzQsImV4cCI6MjA2Njc3ODA3NH0.YfWoZPNAzI4PQIpPjEWd0XTP0IKv7wt2_vQX5pTzKv0'
        },
        body: JSON.stringify({ 
          user_id: memberId,
          email: memberEmail 
        })
      })

      const responseText = await response.text()
      console.log('Password view response:', responseText)

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse password response:', parseError)
        toast.error('パスワード取得でエラーが発生しました')
        return
      }

      if (!response.ok) {
        console.error('Password view failed:', result)
        toast.error('パスワード取得に失敗しました: ' + (result.error || 'エラーが発生しました'))
        return
      }

      if (result.current_password) {
        // パスワードを状態に保存
        setMemberPasswords(prev => ({
          ...prev,
          [memberId]: result.current_password
        }))

        // パスワード表示状態をONに
        setShowPasswords(prev => ({
          ...prev,
          [memberId]: true
        }))

        const passwordInfo = `【${memberName}さんの現在のパスワード】\n\nメールアドレス: ${memberEmail}\n現在のパスワード: ${result.current_password}\n\n※このパスワードを安全に管理してください。\n※必要に応じてパスワードリセットを推奨します。`
        
        if (confirm(passwordInfo + '\n\nパスワードをクリップボードにコピーしますか？')) {
          try {
            await navigator.clipboard.writeText(result.current_password)
            toast.success('パスワードをクリップボードにコピーしました！')
          } catch (err) {
            console.error('クリップボードコピーに失敗:', err)
            toast.success('パスワードを表示しました。テーブルで確認してください。', {
              duration: 5000
            })
          }
        } else {
          toast.success('パスワードを表示しました。テーブルで確認してください。', {
            duration: 8000
          })
        }
      } else {
        toast.error('パスワード情報が取得できませんでした')
      }
    } catch (error) {
      console.error('パスワード表示エラー:', error)
      toast.error('パスワード表示に失敗しました')
    }
  }

  const hidePassword = (memberId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [memberId]: false
    }))
    
    // パスワードデータも削除（セキュリティのため）
    setMemberPasswords(prev => {
      const newPasswords = { ...prev }
      delete newPasswords[memberId]
      return newPasswords
    })
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    )
  }

  // 管理者でない場合のアクセス拒否画面
  if (currentUserRole !== 'admin') {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">アクセス権限がありません</h2>
          <p className="text-gray-600 mb-4">
            メンバー管理機能は管理者のみがアクセス可能です。
          </p>
          <p className="text-sm text-gray-500">
            アクセス権限が必要な場合は、システム管理者にお問い合わせください。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">メンバー管理</h1>
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">{filteredMembers.length}人</span>
          </div>
          <div className="flex items-center gap-2">
            {currentUserRole === 'admin' && (
              <button
                onClick={() => {
                  const hasVisiblePasswords = Object.keys(showPasswords).some(key => showPasswords[key])
                  if (hasVisiblePasswords) {
                    // 全てのパスワードを非表示にする
                    setShowPasswords({})
                    setMemberPasswords({})
                    toast.success('全てのパスワードを非表示にしました')
                  } else {
                    // 全メンバーのパスワードを表示する（管理者以外）
                    const nonAdminMembers = filteredMembers.filter(m => m.id !== currentUserId)
                    if (confirm(`全メンバー（${nonAdminMembers.length}人）のパスワードを表示しますか？\n\n※この操作は管理者権限で実行されます。\n※セキュリティのため必要時のみ使用してください。`)) {
                      nonAdminMembers.forEach(member => {
                        viewPassword(member.id, member.name, member.email)
                      })
                    }
                  }
                }}
                className="inline-flex items-center px-3 py-2 text-sm text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
              >
                <Eye className="h-4 w-4 mr-1" />
                {Object.keys(showPasswords).some(key => showPasswords[key]) ? 'パスワード全非表示' : 'パスワード全表示'}
              </button>
            )}
            <button className="inline-flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors">
              エクスポート
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="名前・メールアドレスで検索"
                className="w-80 pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="inline-flex items-center px-3 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors">
              検索
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              メンバーを招待
            </button>
          </div>
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-sm font-medium text-gray-900">メンバーがいません</h3>
            <p className="mt-1 text-sm text-gray-500">新しいメンバーを招待して始めましょう。</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  メンバー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  権限
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                {currentUserRole === 'admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    パスワード
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    最終ログイン
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    登録日
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <User className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                        {member.phone && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleColors[member.role]}`}>
                      {roleLabels[member.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      member.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.status === 'active' ? 'アクティブ' : '非アクティブ'}
                    </span>
                  </td>
                  {currentUserRole === 'admin' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.id === currentUserId ? (
                        <span className="text-gray-400 italic">非表示</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          {showPasswords[member.id] ? (
                            <>
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {memberPasswords[member.id] || '****'}
                              </span>
                              <button
                                onClick={() => hidePassword(member.id)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title="パスワードを隠す"
                              >
                                <EyeOff className="h-4 w-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(memberPasswords[member.id] || '')
                                    toast.success('パスワードをコピーしました')
                                  } catch (err) {
                                    toast.error('コピーに失敗しました')
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600"
                                title="パスワードをコピー"
                              >
                                📋
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => viewPassword(member.id, member.name, member.email)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                              title="パスワードを表示"
                            >
                              <Eye className="h-3 w-3" />
                              表示
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.last_login 
                      ? new Date(member.last_login).toLocaleString('ja-JP')
                      : '未ログイン'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1">
                      {currentUserRole === 'admin' && (
                        <>
                          <button
                            onClick={() => {
                              const newRole = prompt('新しい権限を選択してください (admin/manager/member)', member.role)
                              if (newRole && ['admin', 'manager', 'member'].includes(newRole)) {
                                updateMemberRole(member.id, newRole)
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="権限編集"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => resetPassword(member.email, member.name)}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                            title="パスワードリセット"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteMember(member.id)}
                            disabled={member.id === currentUserId}
                            className={`p-1.5 rounded ${
                              member.id === currentUserId 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'
                            }`}
                            title={member.id === currentUserId ? '自分自身は削除できません' : '削除'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 招待モーダル */}
      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false)
            fetchMembers()
          }}
        />
      )}
    </div>
  )
}

// メンバー招待モーダル
function InviteMemberModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'manager' | 'member'>('member')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const supabase = createClient()
      
      // 現在のユーザーの会社IDを取得
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('ユーザー情報が取得できません')
        return
      }

      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('company_id, name, role')
        .eq('id', user.id)
        .single()

      if (userDataError || !userData) {
        console.error('ユーザーデータ取得エラー:', userDataError)
        toast.error('会社情報が取得できません')
        return
      }

      // company_idが存在するかチェック
      if (!userData.company_id) {
        toast.error('会社IDが設定されていません。管理者にお問い合わせください。')
        return
      }

      console.log('=== 招待データ詳細 ===')
      console.log('email:', email)
      console.log('name:', name)
      console.log('role:', role)
      console.log('company_id:', userData.company_id)
      console.log('invited_by:', user.id)
      console.log('userData_full:', JSON.stringify(userData, null, 2))
      console.log('user_full:', JSON.stringify(user, null, 2))
      console.log('======================')

      // 直接fetchでEdge Functionを呼び出してエラー詳細を取得
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      console.log('=== 送信するリクエスト ===')
      const requestBody = {
        email,
        name,
        role,
        company_id: userData.company_id,
        invited_by: user.id
      }
      console.log('Request body:', JSON.stringify(requestBody, null, 2))
      console.log('Token exists:', !!token)
      console.log('==========================')

      const response = await fetch('https://drhcinwdqwcosbjxwzfl.supabase.co/functions/v1/invite-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyaGNpbndkcXdjb3Nianh3emZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDIwNzQsImV4cCI6MjA2Njc3ODA3NH0.YfWoZPNAzI4PQIpPjEWd0XTP0IKv7wt2_vQX5pTzKv0'
        },
        body: JSON.stringify(requestBody)
      })

      console.log('=== レスポンス詳細 ===')
      console.log('Status:', response.status)
      console.log('Status Text:', response.statusText)
      console.log('Headers:', Object.fromEntries(response.headers.entries()))

      const responseText = await response.text()
      console.log('Response body (text):', responseText)

      let data, error

      try {
        const responseJson = JSON.parse(responseText)
        console.log('Response body (JSON):', responseJson)
        
        if (response.ok) {
          data = responseJson
          error = null
        } else {
          data = null
          error = { message: responseJson.error || 'Unknown error', details: responseJson }
        }
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError)
        data = null
        error = { message: 'Invalid response format', details: responseText }
      }
      console.log('=====================')

      console.log('=== Edge Function レスポンス ===')
      console.log('data:', JSON.stringify(data, null, 2))
      console.log('error:', JSON.stringify(error, null, 2))
      console.log('================================')

      if (error) {
        console.error('=== Edge Function エラー詳細 ===')
        console.error('error object:', error)
        console.error('error.message:', error.message)
        console.error('error.details:', error.details)
        console.error('error stringified:', JSON.stringify(error, null, 2))
        console.error('===============================')
        
        // より詳細なエラーメッセージを表示
        let errorMessage = error.message || 'エラーが発生しました'
        if (error.details && error.details.details) {
          if (error.details.details.includes('already been registered')) {
            errorMessage = `このメールアドレスは既に登録されています。\n別のメールアドレスを使用するか、既存ユーザーのパスワードリセットを行ってください。`
          } else {
            errorMessage = `${errorMessage}\n詳細: ${error.details.details}`
          }
        }
        
        toast.error('招待に失敗しました:\n' + errorMessage, {
          duration: 8000
        })
        return
      }

      if (data?.error) {
        console.error('Edge Function データエラー:', data)
        toast.error(data.error)
        return
      }

      // メール送信結果とパスワード表示
      if (data?.temp_password) {
        // メール送信状況を確認
        const emailSent = data.email_sent !== false
        const emailMessage = data.email_message || '（メール送信状況不明）'
        
        let passwordInfo = `【メンバー招待完了】\n\nメールアドレス: ${data.email}\n一時パスワード: ${data.temp_password}\n\n`
        
        if (emailSent && data.email_message?.includes('メールを送信しました')) {
          passwordInfo += `✅ 招待メールを送信しました\n${emailMessage}\n\n※メールが届かない場合は、下記パスワードを直接共有してください。`
        } else {
          passwordInfo += `⚠️ メール送信状況: ${emailMessage}\n\n※このパスワードを新しいメンバーに直接共有してください。`
        }
        
        passwordInfo += `\n※初回ログイン後にパスワード変更を推奨します。`
        
        if (confirm(passwordInfo + '\n\nパスワードをクリップボードにコピーしますか？')) {
          try {
            await navigator.clipboard.writeText(data.temp_password)
            toast.success('パスワードをクリップボードにコピーしました！', {
              duration: 5000
            })
          } catch (err) {
            console.error('クリップボードコピーに失敗:', err)
            toast.success('招待完了！パスワード: ' + data.temp_password, {
              duration: 15000
            })
          }
        } else {
          const displayMessage = emailSent && data.email_message?.includes('メールを送信しました') 
            ? `招待完了！メールを送信しました。\nパスワード: ${data.temp_password}`
            : `招待完了！パスワード: ${data.temp_password}\n※メール設定を確認してください`
            
          toast.success(displayMessage, {
            duration: 20000
          })
        }
      } else {
        toast.success('メンバーを招待しました！')
      }
      
      onSuccess()
    } catch (error) {
      console.error('招待エラー:', error)
      toast.error('招待に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">新しいメンバーを招待</h3>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                名前 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>


            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                権限
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'manager' | 'member')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="member">メンバー</option>
                <option value="manager">マネージャー</option>
                <option value="admin">管理者</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? '招待中...' : '招待'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}