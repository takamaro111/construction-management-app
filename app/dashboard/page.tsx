'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { Building2, Users, Camera, FileText, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    projects: 0,
    activeProjects: 0,
    members: 0,
    photos: 0,
    documents: 0,
    todaySchedules: 0,
  })
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // ユーザー情報の取得
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userData) return

    // 統計データの取得
    const [projectsRes, membersRes, photosRes, documentsRes, schedulesRes] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact' }).eq('company_id', userData.company_id),
      supabase.from('users').select('*', { count: 'exact' }).eq('company_id', userData.company_id),
      supabase.from('photos').select('*', { count: 'exact' }).eq('company_id', userData.company_id),
      supabase.from('documents').select('*', { count: 'exact' }).eq('company_id', userData.company_id),
      supabase.from('schedules').select('*', { count: 'exact' })
        .eq('company_id', userData.company_id)
        .gte('start_datetime', new Date().toISOString().split('T')[0])
        .lte('start_datetime', new Date().toISOString().split('T')[0] + 'T23:59:59'),
    ])

    const activeProjects = projectsRes.data?.filter(p => p.status === 'in_progress').length || 0

    setStats({
      projects: projectsRes.count || 0,
      activeProjects,
      members: membersRes.count || 0,
      photos: photosRes.count || 0,
      documents: documentsRes.count || 0,
      todaySchedules: schedulesRes.count || 0,
    })

    // 最近のプロジェクト
    if (projectsRes.data) {
      setRecentProjects(projectsRes.data.slice(0, 5))
    }
  }

  const statCards = [
    {
      title: '全プロジェクト',
      value: stats.projects,
      icon: Building2,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: '進行中',
      value: stats.activeProjects,
      icon: Clock,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'メンバー',
      value: stats.members,
      icon: Users,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: '写真',
      value: stats.photos,
      icon: Camera,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
    {
      title: '資料',
      value: stats.documents,
      icon: FileText,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      title: '本日の予定',
      value: stats.todaySchedules,
      icon: Calendar,
      bgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
    },
  ]

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">ダッシュボード</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">プロジェクトの概要と最新情報</p>
        </div>
      </div>
      
      {/* 統計カード */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-4 sm:mb-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 truncate">{card.title}</p>
                  <p className="mt-1 text-lg sm:text-xl font-semibold text-gray-900">{card.value}</p>
                </div>
                <div className={`${card.bgColor} p-1.5 sm:p-2 rounded flex-shrink-0 ml-2`}>
                  <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 最近のプロジェクト */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">最近のプロジェクト</h2>
            <Link href="/dashboard/projects" className="text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap">
              すべて表示 →
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {recentProjects.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-gray-500">
              <Building2 className="mx-auto h-6 w-6 sm:h-8 sm:w-8 mb-2 sm:mb-3 text-gray-400" />
              <p className="text-xs sm:text-sm font-medium">プロジェクトがありません</p>
              <p className="text-xs mt-1">新しいプロジェクトを作成しましょう</p>
            </div>
          ) : (
            recentProjects.map((project) => (
              <div key={project.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                <Link href={`/dashboard/projects/${project.id}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        project.status === 'in_progress' ? 'bg-orange-500' :
                        project.status === 'completed' ? 'bg-blue-500' :
                        project.status === 'preparing' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{project.name}</p>
                        <p className="text-xs text-gray-500">
                          {project.status === 'preparing' && '契約前'}
                          {project.status === 'in_progress' && '進行中'}
                          {project.status === 'completed' && 'リフォーム'}
                          {project.status === 'suspended' && '完了'}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex-shrink-0">
                      {project.start_date && new Date(project.start_date).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}