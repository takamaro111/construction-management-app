'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { User, LogOut, Bell, Calendar, MessageSquare, HelpCircle, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { toast } from 'react-hot-toast'

const pageNames: Record<string, string> = {
  '/dashboard': 'ダッシュボード',
  '/dashboard/projects': '案件一覧',
  '/dashboard/projects/new': '新規案件作成',
  '/dashboard/projects/board': '案件ボード', 
  '/dashboard/projects/calendar': '案件カレンダー',
  '/dashboard/photos': '写真管理',
  '/dashboard/documents': '資料管理',
  '/dashboard/chat': 'チャット',
  '/dashboard/reports': '報告書管理',
  '/dashboard/schedule': 'スケジュール',
  '/dashboard/members': 'メンバー管理',
  '/dashboard/settings': '設定',
}

const getPageName = (pathname: string) => {
  // 動的ルートの処理
  if (pathname.match(/^\/dashboard\/projects\/[^\/]+$/)) {
    return '案件詳細'
  }
  return pageNames[pathname] || 'ページ'
}

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [selectedHelpTopic, setSelectedHelpTopic] = useState<string>('')
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('認証ユーザー:', user)
      if (user) {
        console.log('認証済み - ユーザーID:', user.id)
        
        // RLS状態確認
        try {
          const { data: rlsTest, error: rlsError } = await supabase.rpc('auth.uid')
          console.log('RPC auth.uid()結果:', rlsTest, rlsError)
        } catch (e) {
          console.log('RPC auth.uid()失敗:', e)
        }
        
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        console.log('ユーザーデータ:', userData)
        console.log('ユーザーデータエラー:', error)
        setUser(userData)
      } else {
        console.log('認証されていません')
      }
    }
    fetchUser()
  }, [])

  // パネルを閉じるためのクリックハンドラー
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.notification-panel') && !target.closest('[data-notification-trigger]')) {
        setShowNotifications(false)
      }
      if (!target.closest('.help-panel') && !target.closest('[data-help-trigger]')) {
        setShowHelp(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('ログアウトしました')
    router.push('/auth/login')
  }

  const handleCalendarClick = () => {
    router.push('/dashboard/projects/calendar')
  }

  const handleChatClick = () => {
    router.push('/dashboard/chat')
  }

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications)
  }

  const handleHelpClick = () => {
    setShowHelp(!showHelp)
  }

  const handleHelpTopicClick = (topic: string) => {
    setSelectedHelpTopic(topic)
    setShowHelpModal(true)
    setShowHelp(false)
  }

  const currentPageName = getPageName(pathname)

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="h-full px-6 max-w-full">
        <div className="flex items-center justify-between h-full">
          {/* ページタイトル */}
          <div className="flex items-center min-w-0">
            <h1 className="text-lg font-medium text-gray-900 truncate">{currentPageName}</h1>
          </div>

          {/* 右側メニュー */}
          <div className="flex items-center gap-3 relative">
            {/* アイコンメニュー */}
            <button 
              onClick={handleCalendarClick}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="カレンダー"
            >
              <Calendar className="h-5 w-5" />
            </button>
            <button 
              onClick={handleChatClick}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="チャット"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
            <button 
              onClick={handleNotificationClick}
              data-notification-trigger
              className="relative p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="通知"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-blue-500 rounded-full"></span>
            </button>
            <button 
              onClick={handleHelpClick}
              data-help-trigger
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="ヘルプ"
            >
              <HelpCircle className="h-5 w-5" />
            </button>

            {/* 通知パネル */}
            {showNotifications && (
              <div className="notification-panel absolute top-12 right-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">通知</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-4 text-center text-gray-500">
                    <Bell className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                    <p className="text-sm">新しい通知はありません</p>
                  </div>
                </div>
              </div>
            )}

            {/* ヘルプパネル */}
            {showHelp && (
              <div className="help-panel absolute top-12 right-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">ヘルプ</h3>
                    <button
                      onClick={() => setShowHelp(false)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">よくある質問</h4>
                    <div className="space-y-2">
                      <button 
                        onClick={() => handleHelpTopicClick('project-creation')}
                        className="block w-full text-left text-xs text-gray-600 hover:text-blue-600 py-1"
                      >
                        案件の作成方法
                      </button>
                      <button 
                        onClick={() => handleHelpTopicClick('member-invitation')}
                        className="block w-full text-left text-xs text-gray-600 hover:text-blue-600 py-1"
                      >
                        メンバーの招待方法
                      </button>
                      <button 
                        onClick={() => handleHelpTopicClick('report-creation')}
                        className="block w-full text-left text-xs text-gray-600 hover:text-blue-600 py-1"
                      >
                        報告書の作成方法
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">サポート</h4>
                    <button className="block w-full text-left text-xs text-blue-600 hover:text-blue-700 py-1">
                      お問い合わせ
                    </button>
                  </div>
                </div>
              </div>
            )}
          
            {/* ユーザーメニュー */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar_url || ''} />
                    <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user?.name || 'ユーザー'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'ユーザー'}</p>
                    <p className="text-xs leading-none text-gray-500">{user?.email || ''}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>プロフィール設定</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>ログアウト</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ヘルプモーダル */}
      {showHelpModal && (
        <HelpModal 
          topic={selectedHelpTopic}
          onClose={() => setShowHelpModal(false)}
        />
      )}
    </header>
  )
}

// ヘルプモーダルコンポーネント
function HelpModal({ topic, onClose }: { topic: string; onClose: () => void }) {
  const getHelpContent = (topic: string) => {
    switch (topic) {
      case 'project-creation':
        return {
          title: '案件の作成方法',
          content: (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">1. 案件作成ページへのアクセス</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>サイドバーの「案件作成」ボタンをクリック</li>
                  <li>または、案件一覧ページの「新規作成」ボタンをクリック</li>
                  <li>案件ボードからもカラム内の「+ 案件を作成」ボタンで作成可能</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">2. 必要な情報を入力</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li><strong>案件名（必須）</strong>: プロジェクトの名前を入力</li>
                  <li><strong>説明</strong>: プロジェクトの詳細説明（任意）</li>
                  <li><strong>現場住所</strong>: 工事現場の住所</li>
                  <li><strong>開始日・終了予定日</strong>: スケジュールを設定</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">3. 保存と確認</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>「案件を作成」ボタンをクリックして保存</li>
                  <li>作成後は案件一覧または案件ボードで確認可能</li>
                  <li>作成した案件は後から編集も可能です</li>
                </ul>
              </div>
            </div>
          )
        }
      case 'member-invitation':
        return {
          title: 'メンバーの招待方法',
          content: (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">1. メンバー管理ページへアクセス</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>サイドバーの「メンバー管理」をクリック</li>
                  <li>※管理者権限が必要です</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">2. 新規メンバーの招待</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>「メンバーを招待」ボタンをクリック</li>
                  <li><strong>名前</strong>: 招待するメンバーの名前</li>
                  <li><strong>メールアドレス</strong>: ログイン用のメールアドレス（重複不可）</li>
                  <li><strong>権限</strong>: 管理者・マネージャー・メンバーから選択</li>
                  <li>システムが自動で安全な一時パスワードを生成します</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">3. パスワードの共有</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>📧 <strong>メール送信</strong>: 設定済みの場合、招待メールが自動送信</li>
                  <li>📋 <strong>クリップボードコピー</strong>: 確認ダイアログでパスワードをコピー</li>
                  <li>👁️ <strong>管理者表示</strong>: メンバー一覧の「表示」ボタンでパスワード確認</li>
                  <li>新しいメンバーにログイン情報を安全に共有してください</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">4. パスワード管理（管理者のみ）</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>👁️ <strong>個別表示</strong>: 各メンバーの「表示」ボタンでパスワード確認</li>
                  <li>🔄 <strong>パスワードリセット</strong>: 新しい一時パスワードを生成</li>
                  <li>📋 <strong>一括表示</strong>: 「パスワード全表示」で全メンバーのパスワード表示</li>
                  <li>🗑️ <strong>完全削除</strong>: メンバー削除で同じメールアドレスでの再登録が可能</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">5. 権限について</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li><strong>管理者</strong>: 全機能アクセス・メンバー管理・パスワード表示</li>
                  <li><strong>マネージャー</strong>: プロジェクト管理・報告書作成</li>
                  <li><strong>メンバー</strong>: 基本的な閲覧と参加</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">6. メール送信設定（オプション）</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>Resend API または Gmail SMTP を設定で自動メール送信</li>
                  <li>未設定の場合は管理者が手動でパスワードを共有</li>
                  <li>設定方法は <code>email-setup.md</code> を参照</li>
                </ul>
              </div>
            </div>
          )
        }
      case 'report-creation':
        return {
          title: '報告書の作成方法',
          content: (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">1. 報告書管理ページへアクセス</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>サイドバーの「報告書管理」をクリック</li>
                  <li>プロジェクト別に報告書を管理できます</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">2. 新規報告書の作成</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>「新規報告書作成」ボタンをクリック</li>
                  <li><strong>タイトル</strong>: 報告書のタイトルを入力</li>
                  <li><strong>対象プロジェクト</strong>: 関連するプロジェクトを選択</li>
                  <li><strong>作成日</strong>: 報告書の作成日を設定</li>
                  <li><strong>内容</strong>: 詳細な報告内容を記述</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">3. 写真・資料の添付</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>現場写真や図面などのファイルを添付可能</li>
                  <li>複数ファイルの同時アップロードに対応</li>
                  <li>PDF、画像ファイル（JPG、PNG）に対応</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">4. 共有とエクスポート</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li>作成した報告書はチームメンバーと共有</li>
                  <li>PDF形式でエクスポート可能</li>
                  <li>プロジェクト履歴として保存されます</li>
                </ul>
              </div>
            </div>
          )
        }
      default:
        return {
          title: 'ヘルプ',
          content: <p className="text-sm text-gray-600">ヘルプトピックが見つかりません。</p>
        }
    }
  }

  const helpContent = getHelpContent(topic)

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">{helpContent.title}</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="text-sm text-gray-700">
            {helpContent.content}
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}