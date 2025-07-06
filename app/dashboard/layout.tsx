'use client'

import { useState } from 'react'
import { Sidebar } from '../../components/ui/sidebar'
import { MobileSidebar } from '../../components/ui/mobile-sidebar'
import { Header } from '../../components/ui/header'
import { AuthGuard } from '../../components/auth/AuthGuard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* デスクトップサイドバー */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* モバイルサイドバー */}
        <MobileSidebar 
          isOpen={isMobileSidebarOpen} 
          onClose={() => setIsMobileSidebarOpen(false)} 
        />
        
        {/* メインコンテンツ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
            <div className="h-full">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}