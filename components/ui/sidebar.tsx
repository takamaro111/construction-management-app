'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Home,
  FolderOpen,
  Camera,
  FileText,
  MessageSquare,
  FileCheck,
  Calendar,
  Users,
  Settings,
  Plus,
  LogOut,
  Layout
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { createClient } from '../../lib/supabase/client'

const navigation = [
  { name: 'ダッシュボード', href: '/dashboard', icon: Home },
  { name: '案件作成', href: '/dashboard/projects/new', icon: Plus, isButton: true },
  { name: '案件一覧', href: '/dashboard/projects', icon: FolderOpen },
  { name: '案件ボード', href: '/dashboard/projects/board', icon: Layout },
  { name: '案件カレンダー', href: '/dashboard/projects/calendar', icon: Calendar },
  { name: 'チャット', href: '/dashboard/chat', icon: MessageSquare },
  { name: '報告書管理', href: '/dashboard/reports', icon: FileCheck },
  { name: '資料管理', href: '/dashboard/documents', icon: FileText },
  { name: 'メンバー管理', href: '/dashboard/members', icon: Users },
  { name: '設定', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      {/* ヘッダー */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="GENBA Logo"
            width={32}
            height={32}
            className="object-contain"
          />
          <h1 className="text-lg font-bold text-gray-900">GENBA</h1>
        </div>
      </div>
      
      {/* ナビゲーション */}
      <nav className="flex-1 overflow-y-auto py-6">
        <ul className="px-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            if (item.isButton) {
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              )
            }

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Icon className={cn(
                    'h-5 w-5',
                    isActive ? 'text-blue-600' : 'text-gray-400'
                  )} />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      
      {/* フッター */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <LogOut className="h-5 w-5 text-gray-400" />
          ログアウト
        </button>
      </div>
    </div>
  )
}