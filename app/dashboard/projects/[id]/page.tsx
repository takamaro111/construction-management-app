'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/client'
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, User, FileText, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'

type Project = {
  id: string
  name: string
  description: string | null
  address: string | null
  status: 'preparing' | 'in_progress' | 'completed' | 'suspended'
  start_date: string | null
  end_date: string | null
  created_at: string
  manager_id: string | null
  manager?: {
    name: string
    email: string
  }
  company?: {
    name: string
  }
}

export default function ProjectDetailPage() {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      fetchProject()
    }
  }, [params.id])

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          manager:manager_id(name, email),
          company:company_id(name)
        `)
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('プロジェクト取得エラー:', error)
        toast.error('プロジェクトの取得に失敗しました')
        router.push('/dashboard/projects')
        return
      }

      setProject(data)
    } catch (error) {
      console.error('予期しないエラー:', error)
      toast.error('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('このプロジェクトを削除しますか？')) return

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', params.id)

      if (error) {
        toast.error('削除に失敗しました')
        return
      }

      toast.success('プロジェクトを削除しました')
      router.push('/dashboard/projects')
    } catch (error) {
      toast.error('エラーが発生しました')
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      preparing: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      preparing: '契約前',
      in_progress: '進行中',
      completed: '契約中',
      suspended: 'リフォーム'
    }
    return labels[status as keyof typeof labels] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">プロジェクトが見つかりません</div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                  {project.company && (
                    <span className="text-sm text-gray-600">{project.company.name}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                編集
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                削除
              </button>
            </div>
          </div>
        </div>

        {/* 詳細情報 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 基本情報 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
              
              {project.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">説明</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{project.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {project.address && (
                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      現場住所
                    </div>
                    <p className="text-gray-900">{project.address}</p>
                  </div>
                )}

                <div>
                  <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    期間
                  </div>
                  <p className="text-gray-900">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString('ja-JP') : '未設定'}
                    {' ～ '}
                    {project.end_date ? new Date(project.end_date).toLocaleDateString('ja-JP') : '未設定'}
                  </p>
                </div>

                {project.manager && (
                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                      <User className="h-4 w-4 mr-1" />
                      担当者
                    </div>
                    <p className="text-gray-900">{project.manager.name}</p>
                    <p className="text-sm text-gray-600">{project.manager.email}</p>
                  </div>
                )}

                <div>
                  <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                    <Clock className="h-4 w-4 mr-1" />
                    作成日
                  </div>
                  <p className="text-gray-900">
                    {new Date(project.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 関連情報 */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/dashboard/reports?project=${project.id}`)}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">報告書を見る</p>
                      <p className="text-xs text-gray-500">このプロジェクトの報告書一覧</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => router.push('/dashboard/photos')}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">写真を見る</p>
                      <p className="text-xs text-gray-500">現場写真の管理</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}