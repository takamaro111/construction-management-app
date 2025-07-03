'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '../../../../lib/supabase/client'
import { Calendar, momentLocalizer, View, Event } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { toast } from 'react-hot-toast'
import { Plus, Filter } from 'lucide-react'

// momentのローカル設定
moment.locale('ja')
const localizer = momentLocalizer(moment)

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

type CalendarEvent = Event & {
  id: string
  project: Project
  type: 'start' | 'end' | 'duration'
}

const statusColors = {
  preparing: '#fbbf24', // yellow
  in_progress: '#3b82f6', // blue
  completed: '#10b981', // green
  suspended: '#ef4444' // red
}

const statusLabels = {
  preparing: '契約前',
  in_progress: '進行中',
  completed: 'リフォーム',
  suspended: '完了'
}

export default function ProjectCalendarPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          manager:manager_id(name)
        `)
        .order('start_date', { ascending: true })

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

  const filteredProjects = useMemo(() => {
    if (statusFilter === 'all') return projects
    return projects.filter(project => project.status === statusFilter)
  }, [projects, statusFilter])

  const events: CalendarEvent[] = useMemo(() => {
    const eventList: CalendarEvent[] = []

    filteredProjects.forEach(project => {
      const color = statusColors[project.status]
      
      // 開始日がある場合
      if (project.start_date) {
        // 終了日もある場合は期間で表示
        if (project.end_date) {
          const endDate = new Date(project.end_date)
          endDate.setDate(endDate.getDate() + 1) // 終了日を含むために1日追加
          eventList.push({
            id: `${project.id}-duration`,
            title: `${project.name} (${statusLabels[project.status]})`,
            start: new Date(project.start_date),
            end: endDate,
            allDay: true,
            resource: {
              backgroundColor: color,
              borderColor: color,
            },
            project,
            type: 'duration'
          })
        } else {
          // 開始日のみ
          eventList.push({
            id: `${project.id}-start`,
            title: `開始: ${project.name} (${statusLabels[project.status]})`,
            start: new Date(project.start_date),
            end: new Date(project.start_date),
            allDay: true,
            resource: {
              backgroundColor: color,
              borderColor: color,
            },
            project,
            type: 'start'
          })
        }
      }
      
      // 終了日があるが開始日がない場合
      if (project.end_date && !project.start_date) {
        eventList.push({
          id: `${project.id}-end`,
          title: `終了: ${project.name} (${statusLabels[project.status]})`,
          start: new Date(project.end_date),
          end: new Date(project.end_date),
          allDay: true,
          resource: {
            backgroundColor: color,
            borderColor: color,
          },
          project,
          type: 'end'
        })
      }
    })

    return eventList
  }, [filteredProjects])

  const eventStyleGetter = (event: CalendarEvent) => {
    const style = {
      backgroundColor: event.resource?.backgroundColor || '#3174ad',
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    }
    return { style }
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    const project = event.project
    alert(`案件: ${project.name}\nステータス: ${statusLabels[project.status]}\n開始日: ${project.start_date || '未設定'}\n終了日: ${project.end_date || '未設定'}`)
  }

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setShowCreateModal(true)
    // TODO: 選択した日付をデフォルト値として設定
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
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">案件カレンダー</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">{projects.length}件</div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              案件作成
            </button>
          </div>
        </div>
      </div>

      {/* ステータスカラーレジェンド */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded" 
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-xs text-gray-600">
                {statusLabels[status as keyof typeof statusLabels]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* カレンダー */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <style jsx global>{`
          .rbc-allday-cell {
            display: none;
          }
          .rbc-agenda-view .rbc-agenda-time-cell {
            display: none;
          }
          .rbc-agenda-view .rbc-agenda-event-cell {
            border-left: none !important;
            padding-left: 0 !important;
          }
          .rbc-time-view .rbc-time-gutter,
          .rbc-time-view .rbc-time-column {
            display: none;
          }
          .rbc-time-view .rbc-time-content {
            margin-left: 0 !important;
          }
          .rbc-time-view .rbc-time-header {
            margin-left: 0 !important;
          }
          .rbc-time-view .rbc-allday-cell {
            display: block !important;
            height: auto !important;
          }
          .rbc-day-view .rbc-time-view,
          .rbc-week-view .rbc-time-view {
            height: auto !important;
          }
        `}</style>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべてのステータス</option>
              <option value="preparing">契約前</option>
              <option value="in_progress">進行中</option>
              <option value="completed">リフォーム</option>
              <option value="suspended">完了</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-sm text-gray-600 hover:text-blue-600">今日</button>
            <button className="px-3 py-2 text-sm text-gray-600 hover:text-blue-600">月</button>
          </div>
        </div>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          messages={{
            next: '次へ',
            previous: '前へ',
            today: '今日',
            month: '月',
            week: '週',
            day: '日',
            agenda: '予定一覧',
            date: '日付',
            time: '時刻',
            event: 'イベント',
            noEventsInRange: 'この期間にイベントはありません',
            showMore: (total: number) => `+${total}件表示`
          }}
          formats={{
            monthHeaderFormat: 'YYYY年M月',
            dayHeaderFormat: 'M/D(ddd)',
            dayRangeHeaderFormat: ({ start, end }) => 
              `${moment(start).format('M/D')} - ${moment(end).format('M/D')}`,
            agendaHeaderFormat: ({ start, end }) =>
              `${moment(start).format('YYYY年M月D日')} - ${moment(end).format('M月D日')}`,
            agendaDateFormat: 'M月D日(ddd)',
            agendaTimeFormat: 'HH:mm',
            agendaTimeRangeFormat: ({ start, end }) => 
              `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
            eventTimeRangeFormat: ({ start, end }) => 
              `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
            timeGutterFormat: 'HH:mm'
          }}
        />
      </div>
    </div>
  )
}