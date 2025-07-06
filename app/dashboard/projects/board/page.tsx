'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../../lib/supabase/client'
import { DndContext, DragEndEvent, DragOverEvent, closestCenter, DragOverlay, DragStartEvent, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, User, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

type Project = {
  id: string
  name: string
  description: string | null
  status: 'preparing' | 'in_progress' | 'completed' | 'suspended'
  start_date: string | null
  end_date: string | null
  manager?: {
    name: string
  }
}

type Column = {
  id: string
  title: string
  status: 'preparing' | 'in_progress' | 'completed' | 'suspended'
  color: string
}

const columns: Column[] = [
  { id: 'preparing', title: '契約前', status: 'preparing', color: 'bg-blue-50 border-blue-200' },
  { id: 'in_progress', title: '進行中', status: 'in_progress', color: 'bg-orange-50 border-orange-200' },
  { id: 'completed', title: 'リフォーム', status: 'completed', color: 'bg-blue-50 border-blue-200' },
  { id: 'suspended', title: '完了', status: 'suspended', color: 'bg-gray-50 border-gray-200' }
]

export default function ProjectBoardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      // Get current user's company_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('認証が必要です')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!userData) {
        toast.error('ユーザー情報の取得に失敗しました')
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          manager:manager_id(name)
        `)
        .eq('company_id', userData.company_id)
        .order('created_at', { ascending: false })

      if (error) {
        toast.error('プロジェクトの取得に失敗しました')
        return
      }

      setProjects(data || [])
    } catch (error) {
      toast.error('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const updateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      // Get current user's company_id for security
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!userData) return

      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId)
        .eq('company_id', userData.company_id)

      if (error) {
        toast.error('ステータスの更新に失敗しました')
        return
      }

      // ローカル状態を更新
      setProjects(prev => 
        prev.map(project => 
          project.id === projectId 
            ? { ...project, status: newStatus as any }
            : project
        )
      )
      
      toast.success('ステータスを更新しました')
    } catch (error) {
      toast.error('エラーが発生しました')
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const project = projects.find(p => p.id === active.id)
    setActiveProject(project || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveProject(null)

    if (!over) return

    const projectId = active.id as string
    const columnId = over.id as string
    
    // カラムIDから対応するステータスを取得
    const column = columns.find(col => col.id === columnId)
    if (!column) return
    
    const newStatus = column.status

    // ステータスが変わっている場合のみ更新
    const project = projects.find(p => p.id === projectId)
    if (project && project.status !== newStatus) {
      updateProjectStatus(projectId, newStatus)
    }
  }

  const getProjectsByStatus = (status: string) => {
    return projects.filter(project => project.status === status)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">案件ボード</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">{projects.length}件</div>
            <button 
              onClick={() => router.push('/dashboard/projects/new')}
              className="inline-flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              案件を作成
            </button>
          </div>
        </div>
      </div>

      <DndContext 
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            projects={getProjectsByStatus(column.status)}
          />
        ))}
      </div>
        <DragOverlay>
          {activeProject ? <ProjectCard project={activeProject} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

function Column({ column, projects }: { column: Column; projects: Project[] }) {
  const { setNodeRef } = useDroppable({ id: column.id })
  const router = useRouter()

  return (
    <div 
      ref={setNodeRef}
      className={`bg-white rounded-lg shadow-sm border ${column.color} p-4 min-h-[600px]`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 text-sm">{column.title}</h3>
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-sm">{projects.length}件</span>
          <Plus className="h-4 w-4 text-gray-400 cursor-pointer hover:text-blue-500" />
        </div>
      </div>
      
      <div className="space-y-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
        <button 
          onClick={() => router.push(`/dashboard/projects/new?status=${column.status}`)}
          className="w-full py-3 text-sm text-gray-500 hover:text-blue-500 border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-lg transition-colors"
        >
          + 案件を作成
        </button>
      </div>
    </div>
  )
}

function ProjectCard({ project, isDragging = false }: { project: Project; isDragging?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all cursor-grab active:cursor-grabbing touch-none"
    >
      <h4 className="font-medium text-gray-900 mb-3 text-sm leading-tight">{project.name}</h4>
      
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span>
          {project.start_date && new Date(project.start_date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
          {project.start_date && project.end_date && ' ▶ '}
          {project.end_date && new Date(project.end_date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
        </span>
      </div>
      
      {project.manager && (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-medium">
              {project.manager.name.charAt(0)}
            </span>
          </div>
          <span className="text-xs text-gray-600">{project.manager.name}</span>
        </div>
      )}
    </div>
  )
}