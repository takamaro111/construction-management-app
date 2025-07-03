'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { Plus, Search, ChevronDown, Eye, Edit, Trash2, FileText, Download, Calendar, MoreHorizontal } from 'lucide-react'
import { toast } from 'react-hot-toast'

type Report = {
  id: string
  project_id: string
  type: string
  title: string
  content: string
  report_date: string
  weather: string | null
  temperature: string | null
  work_progress: number | null
  issues: string | null
  next_actions: string | null
  created_at: string
  reported_by: string
  project?: {
    name: string
  }
  author?: {
    name: string
  }
}

type Project = {
  id: string
  name: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingReport, setEditingReport] = useState<Report | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchReports()
    fetchProjects()
  }, [])

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          project:project_id(name),
          author:reported_by(name)
        `)
        .order('report_date', { ascending: false })

      if (error) {
        console.error('報告書取得エラー:', error)
        toast.error('報告書の取得に失敗しました')
        return
      }

      setReports(data || [])
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

  const deleteReport = async (reportId: string) => {
    if (!confirm('この報告書を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)

      if (error) {
        toast.error('削除に失敗しました')
        return
      }

      toast.success('報告書を削除しました')
      fetchReports()
    } catch (error) {
      toast.error('エラーが発生しました')
    }
  }

  const generatePDF = (report: Report) => {
    // 簡易的なPDF生成（実際のプロジェクトではライブラリを使用）
    const content = `
      施工報告書
      
      =====================================
      
      案件名: ${report.project?.name}
      報告日: ${new Date(report.report_date).toLocaleDateString('ja-JP')}
      作成者: ${report.author?.name}
      
      =====================================
      
      件名: ${report.title}
      
      【作業内容】
      ${report.content}
      
      ${report.weather ? `【天気】\n${report.weather}\n` : ''}
      ${report.temperature ? `【気温】\n${report.temperature}℃\n` : ''}
      ${report.work_progress !== null ? `【進捗率】\n${report.work_progress}%\n` : ''}
      ${report.issues ? `【課題・問題点】\n${report.issues}\n` : ''}
      ${report.next_actions ? `【次回予定】\n${report.next_actions}\n` : ''}
      
      =====================================
      
      作成日時: ${new Date(report.created_at).toLocaleString('ja-JP')}
    `

    // ブラウザでダウンロード
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.title}_${new Date(report.report_date).toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('報告書をダウンロードしました')
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = projectFilter === 'all' || report.project_id === projectFilter
    return matchesSearch && matchesProject
  })

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">報告書一覧</h1>
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">{filteredReports.length}件</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors">
              表示設定
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="件名・内容で検索"
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">並び替え:</span>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">任意順</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              報告書作成
            </button>
          </div>
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-sm font-medium text-gray-900">報告書がありません</h3>
            <p className="mt-1 text-sm text-gray-500">新しい報告書を作成して始めましょう。</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    件名
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイプ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  投稿者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  途中投稿
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    投稿日
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 text-left"
                      >
                        {report.title}
                      </button>
                    </div>
                    {report.project?.name && (
                      <div className="text-xs text-gray-500 mt-1">{report.project.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      report.type === '月報' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {report.type || '日報'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.author?.name || '未設定'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(report.report_date).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => setSelectedReport(report)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      詳細
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 作成・編集モーダル */}
      {(showCreateModal || editingReport) && (
        <ReportModal
          projects={projects}
          report={editingReport}
          onClose={() => {
            setShowCreateModal(false)
            setEditingReport(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setEditingReport(null)
            fetchReports()
          }}
        />
      )}

      {/* 詳細ビューモーダル */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onEdit={setEditingReport}
          onGeneratePDF={generatePDF}
        />
      )}
    </div>
  )
}

// 報告書カードコンポーネント
function ReportCard({ report, onEdit, onDelete, onView, onGeneratePDF }: {
  report: Report
  onEdit: (report: Report) => void
  onDelete: (id: string) => void
  onView: (report: Report) => void
  onGeneratePDF: (report: Report) => void
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              {new Date(report.report_date).toLocaleDateString('ja-JP')}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {report.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-3">
            {report.content}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{report.project?.name}</span>
            <span>{report.author?.name}</span>
          </div>
          {report.work_progress !== null && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">進捗率</span>
                <span className="font-medium">{report.work_progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${report.work_progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => onView(report)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          詳細を見る
        </button>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onGeneratePDF(report)}
            className="p-1.5 text-gray-400 hover:text-gray-600"
            title="出力"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(report)}
            className="p-1.5 text-gray-400 hover:text-gray-600"
            title="編集"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(report.id)}
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

// 報告書作成・編集モーダル
function ReportModal({ projects, report, onClose, onSuccess }: {
  projects: Project[]
  report: Report | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    project_id: report?.project_id || '',
    type: report?.type || '日報',
    title: report?.title || '',
    content: report?.content || '',
    report_date: report?.report_date || new Date().toISOString().split('T')[0],
    weather: report?.weather || '',
    temperature: report?.temperature || '',
    work_progress: report?.work_progress || '',
    issues: report?.issues || '',
    next_actions: report?.next_actions || ''
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.project_id || !formData.title || !formData.content) {
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

      const reportData = {
        project_id: formData.project_id,
        company_id: userData.company_id,
        type: formData.type,
        title: formData.title,
        content: formData.content,
        report_date: formData.report_date,
        weather: formData.weather || null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        work_progress: formData.work_progress ? parseInt(String(formData.work_progress)) : null,
        issues: formData.issues || null,
        next_actions: formData.next_actions || null,
        reported_by: user.id
      }

      let error
      if (report) {
        // 更新
        const result = await supabase
          .from('reports')
          .update(reportData)
          .eq('id', report.id)
        error = result.error
      } else {
        // 新規作成
        const result = await supabase
          .from('reports')
          .insert([reportData])
        error = result.error
      }

      if (error) {
        console.error('保存エラー:', error)
        toast.error('保存に失敗しました')
        return
      }

      toast.success(report ? '報告書を更新しました' : '報告書を作成しました')
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
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <form onSubmit={handleSubmit} className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {report ? '報告書編集' : '報告書作成'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* プロジェクト選択 */}
            <div>
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
            
            {/* レポートタイプ選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                レポートタイプ *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="日報">日報</option>
                <option value="月報">月報</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* 件名 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                件名 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* 報告日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                報告日 *
              </label>
              <input
                type="date"
                value={formData.report_date}
                onChange={(e) => setFormData(prev => ({ ...prev, report_date: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* 進捗率 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                進捗率 (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.work_progress}
                onChange={(e) => setFormData(prev => ({ ...prev, work_progress: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 天気（日報のみ） */}
            {formData.type === '日報' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  天気
                </label>
                <select
                  value={formData.weather}
                  onChange={(e) => setFormData(prev => ({ ...prev, weather: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="晴れ">晴れ</option>
                  <option value="曇り">曇り</option>
                  <option value="雨">雨</option>
                  <option value="雪">雪</option>
                </select>
              </div>
            )}

            {/* 気温（日報のみ） */}
            {formData.type === '日報' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  気温 (℃)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* 作業内容 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.type === '日報' ? '作業内容' : '月次概要'} *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* 課題・問題点 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              課題・問題点
            </label>
            <textarea
              value={formData.issues}
              onChange={(e) => setFormData(prev => ({ ...prev, issues: e.target.value }))}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 次回予定 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.type === '日報' ? '次回予定' : '来月の計画'}
            </label>
            <textarea
              value={formData.next_actions}
              onChange={(e) => setFormData(prev => ({ ...prev, next_actions: e.target.value }))}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
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
              {saving ? '保存中...' : (report ? '更新' : '作成')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 報告書詳細モーダル
function ReportDetailModal({ report, onClose, onEdit, onGeneratePDF }: {
  report: Report
  onClose: () => void
  onEdit: (report: Report) => void
  onGeneratePDF: (report: Report) => void
}) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium text-gray-900">{report.title}</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onGeneratePDF(report)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                出力
              </button>
              <button
                onClick={() => {
                  onClose()
                  onEdit(report)
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                編集
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 基本情報 */}
            <div className="md:col-span-1 space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">案件名</dt>
                <dd className="mt-1 text-sm text-gray-900">{report.project?.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">報告日</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(report.report_date).toLocaleDateString('ja-JP')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">作成者</dt>
                <dd className="mt-1 text-sm text-gray-900">{report.author?.name}</dd>
              </div>
              {report.weather && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">天気</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.weather}</dd>
                </div>
              )}
              {report.temperature !== null && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">気温</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.temperature}℃</dd>
                </div>
              )}
              {report.work_progress !== null && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">進捗率</dt>
                  <dd className="mt-1">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${report.work_progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900 font-medium">
                        {report.work_progress}%
                      </span>
                    </div>
                  </dd>
                </div>
              )}
            </div>

            {/* 詳細内容 */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-2">作業内容</dt>
                <dd className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                  {report.content}
                </dd>
              </div>

              {report.issues && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-2">課題・問題点</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap bg-red-50 p-4 rounded-md border border-red-200">
                    {report.issues}
                  </dd>
                </div>
              )}

              {report.next_actions && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-2">次回予定</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap bg-blue-50 p-4 rounded-md border border-blue-200">
                    {report.next_actions}
                  </dd>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-500">
            作成日時: {new Date(report.created_at).toLocaleString('ja-JP')}
          </div>
        </div>
      </div>
    </div>
  )
}