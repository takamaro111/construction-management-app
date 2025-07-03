'use client'

import { Sidebar } from '../../components/ui/sidebar'
import { Header } from '../../components/ui/header'
import { AuthGuard } from '../../components/auth/AuthGuard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
            <div className="h-full">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}