'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { Plus, Search, Filter, Calendar, Clock, User, Edit, Trash2, CheckCircle, Circle } from 'lucide-react'
import { toast } from 'react-hot-toast'

type Schedule = {
  id: string
  project_id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  assigned_to: string | null
  created_at: string
  created_by: string
  project?: {
    name: string
  }
  assignee?: {
    name: string
  }
  creator?: {
    name: string
  }
}

type Project = {
  id: string
  name: string
}

type User = {
  id: string
  name: string
}

const statusLabels = {
  pending: '予定',
  in_progress: '進行中',
  completed: '完了',
  cancelled: 'キャンセル'
}

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

const priorityLabels = {
  low: '低',
  medium: '中',
  high: '高'
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const supabase = createClient()

  useEffect(() => {
    fetchSchedules()
    fetchProjects()
    fetchUsers()
  }, [])

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          project:project_id(name),
          assignee:assigned_to(name),
          creator:created_by(name)
        `)
        .order('start_date', { ascending: true })

      if (error) {
        console.error('スケジュール取得エラー:', error)
        toast.error('スケジュールの取得に失敗しました')
        return
      }

      setSchedules(data || [])
    } catch (error) {
      console.error('予期しないエラー:', error)
      toast.error('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name')

      if (error) {
        console.error('プロジェクト取得エラー:', error)
        return
      }

      setProjects(data || [])
    } catch (error) {
      console.error('プロジェクト取得エラー:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .order('name')

      if (error) {
        console.error('ユーザー取得エラー:', error)
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error('ユーザー取得エラー:', error)
    }
  }

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm('このスケジュールを削除しますか？')) return

    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId)

      if (error) {
        toast.error('削除に失敗しました')
        return
      }

      toast.success('スケジュールを削除しました')
      fetchSchedules()
    } catch (error) {
      toast.error('エラーが発生しました')
    }
  }

  const updateScheduleStatus = async (scheduleId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ status: newStatus })
        .eq('id', scheduleId)

      if (error) {
        toast.error('ステータスの更新に失敗しました')
        return
      }

      toast.success('ステータスを更新しました')
      fetchSchedules()
    } catch (error) {
      toast.error('エラーが発生しました')
    }
  }

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = projectFilter === 'all' || schedule.project_id === projectFilter
    const matchesStatus = statusFilter === 'all' || schedule.status === statusFilter
    return matchesSearch && matchesProject && matchesStatus
  })

  // 今日から7日間の予定を取得
  const upcomingSchedules = schedules.filter(schedule => {
    const today = new Date()
    const scheduleDate = new Date(schedule.start_date)
    const daysDiff = Math.ceil((scheduleDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
    return daysDiff >= 0 && daysDiff <= 7 && schedule.status !== 'completed'
  }).slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:flex-auto">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-teal-600 to-teal-700 rounded-full"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">スケジュール管理</h1>
                <p className="mt-2 text-gray-600">
                  タスクや予定を管理し、進捗を追跡してプロジェクトを円滑に進行
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 sm:mt-0 flex flex-wrap gap-3">
            <div className="inline-flex rounded-lg shadow-sm border border-gray-200 bg-white">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2.5 text-sm font-medium rounded-l-lg transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                リスト
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2.5 text-sm font-medium rounded-r-lg border-l border-gray-200 transition-all duration-200 ${
                  viewMode === 'calendar'
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                カレンダー
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg hover:from-teal-700 hover:to-teal-800 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              スケジュール作成
            </button>
          </div>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="タイトル・説明で検索..."
              className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200"
            >
              <option value="all">すべてのプロジェクト</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200"
            >
              <option value="all">すべてのステータス</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 近日予定 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">近日の予定</h3>
              {upcomingSchedules.length === 0 ? (
                <p className="text-sm text-gray-500">近日の予定はありません</p>
              ) : (
                <div className="space-y-3">
                  {upcomingSchedules.map((schedule) => (
                    <div key={schedule.id} className="border-l-4 border-blue-400 pl-3">
                      <p className="text-sm font-medium text-gray-900">{schedule.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(schedule.start_date).toLocaleDateString('ja-JP', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* スケジュール一覧 */}
          <div className="lg:col-span-3">
            {filteredSchedules.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">スケジュールがありません</h3>
                <p className="mt-1 text-sm text-gray-500">最初のスケジュールを作成しましょう。</p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    スケジュール作成
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSchedules.map((schedule) => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    onEdit={setEditingSchedule}
                    onDelete={deleteSchedule}
                    onUpdateStatus={updateScheduleStatus}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <CalendarView schedules={filteredSchedules} />
      )}

      {/* 作成・編集モーダル */}
      {(showCreateModal || editingSchedule) && (
        <ScheduleModal
          projects={projects}
          users={users}
          schedule={editingSchedule}
          onClose={() => {
            setShowCreateModal(false)
            setEditingSchedule(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setEditingSchedule(null)
            fetchSchedules()
          }}
        />
      )}
    </div>
  )
}

// スケジュールカードコンポーネント
function ScheduleCard({ schedule, onEdit, onDelete, onUpdateStatus }: {
  schedule: Schedule
  onEdit: (schedule: Schedule) => void
  onDelete: (id: string) => void
  onUpdateStatus: (id: string, status: string) => void
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <button
            onClick={() => onUpdateStatus(
              schedule.id, 
              schedule.status === 'completed' ? 'pending' : 'completed'
            )}
            className="mt-0.5 hover:scale-110 transition-transform"
          >
            {getStatusIcon(schedule.status)}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{schedule.title}</h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[schedule.status]}`}>
                {statusLabels[schedule.status]}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityColors[schedule.priority]}`}>
                優先度: {priorityLabels[schedule.priority]}
              </span>
            </div>
            
            {schedule.description && (
              <p className="text-sm text-gray-600 mb-3">{schedule.description}</p>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  {new Date(schedule.start_date).toLocaleDateString('ja-JP')}
                  {schedule.end_date && schedule.end_date !== schedule.start_date && (
                    <> ～ {new Date(schedule.end_date).toLocaleDateString('ja-JP')}</>
                  )}
                </span>
              </div>
              
              {schedule.assignee && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  <span>{schedule.assignee.name}</span>
                </div>
              )}
              
              <span>{schedule.project?.name}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 ml-4">
          <button
            onClick={() => onEdit(schedule)}
            className="p-1.5 text-gray-400 hover:text-gray-600"
            title="編集"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(schedule.id)}
            className="p-1.5 text-gray-400 hover:text-red-600"
            title="削除"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// カレンダービューコンポーネント
function CalendarView({ schedules }: { schedules: Schedule[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  
  const daysInMonth = lastDayOfMonth.getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i)

  const getSchedulesForDate = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString().split('T')[0]
    return schedules.filter(schedule => {
      const startDate = schedule.start_date.split('T')[0]
      const endDate = schedule.end_date ? schedule.end_date.split('T')[0] : startDate
      return dateStr >= startDate && dateStr <= endDate
    })
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  return (
    <div className="mt-8">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* カレンダーヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            →
          </button>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
              {day}
            </div>
          ))}
        </div>

        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7">
          {emptyDays.map((day) => (
            <div key={`empty-${day}`} className="h-24 border-r border-b border-gray-200 bg-gray-50" />
          ))}
          {days.map((day) => {
            const daySchedules = getSchedulesForDate(day)
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
            
            return (
              <div key={day} className={`h-24 border-r border-b border-gray-200 p-1 ${isToday ? 'bg-blue-50' : ''}`}>
                <div className={`text-sm ${isToday ? 'font-bold text-blue-600' : 'text-gray-900'}`}>
                  {day}
                </div>
                <div className="mt-1 space-y-1">
                  {daySchedules.slice(0, 2).map((schedule) => (
                    <div
                      key={schedule.id}
                      className={`text-xs p-1 rounded truncate ${statusColors[schedule.status]}`}
                      title={schedule.title}
                    >
                      {schedule.title}
                    </div>
                  ))}
                  {daySchedules.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{daySchedules.length - 2}件
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// スケジュール作成・編集モーダル
function ScheduleModal({ projects, users, schedule, onClose, onSuccess }: {
  projects: Project[]
  users: User[]
  schedule: Schedule | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    project_id: schedule?.project_id || '',
    title: schedule?.title || '',
    description: schedule?.description || '',
    start_date: schedule?.start_date.split('T')[0] || new Date().toISOString().split('T')[0],
    end_date: schedule?.end_date?.split('T')[0] || '',
    status: schedule?.status || 'pending',
    priority: schedule?.priority || 'medium',
    assigned_to: schedule?.assigned_to || ''
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.project_id || !formData.title || !formData.start_date) {
      toast.error('必須項目を入力してください')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!userData) return

      const scheduleData = {
        project_id: formData.project_id,
        company_id: userData.company_id,
        title: formData.title,
        description: formData.description || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        status: formData.status,
        priority: formData.priority,
        assigned_to: formData.assigned_to || null,
        created_by: user.id
      }

      let error
      if (schedule) {
        // 更新
        const result = await supabase
          .from('schedules')
          .update(scheduleData)
          .eq('id', schedule.id)
        error = result.error
      } else {
        // 新規作成
        const result = await supabase
          .from('schedules')
          .insert([scheduleData])
        error = result.error
      }

      if (error) {
        console.error('保存エラー:', error)
        toast.error('保存に失敗しました')
        return
      }

      toast.success(schedule ? 'スケジュールを更新しました' : 'スケジュールを作成しました')
      onSuccess()
    } catch (error) {
      console.error('予期しないエラー:', error)
      toast.error('エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <form onSubmit={handleSubmit} className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {schedule ? 'スケジュール編集' : 'スケジュール作成'}
          </h3>
          
          {/* プロジェクト選択 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロジェクト *
            </label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">プロジェクトを選択してください</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* タイトル */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              タイトル *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* 説明 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              説明
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* 開始日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始日 *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* 終了日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了日
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* ステータス */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'pending' | 'in_progress' | 'completed' | 'cancelled' }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* 優先度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                優先度
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 担当者 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              担当者
            </label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">担当者を選択してください</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
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
              {saving ? '保存中...' : (schedule ? '更新' : '作成')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}