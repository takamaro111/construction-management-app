'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { Upload, Search, ChevronDown, Eye, Download, Trash2, FileText, File, Plus, MoreHorizontal } from 'lucide-react'
import { toast } from 'react-hot-toast'

type Document = {
  id: string
  project_id: string
  file_url: string
  file_name: string
  file_size: number
  file_type: string
  memo: string | null
  created_at: string
  uploaded_by: string
  project?: {
    name: string
  }
  uploader?: {
    name: string
  }
}

type Project = {
  id: string
  name: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchDocuments()
    fetchProjects()
  }, [])

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          project:project_id(name),
          uploader:uploaded_by(name)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('資料取得エラー:', error)
        toast.error('資料の取得に失敗しました')
        return
      }

      setDocuments(data || [])
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

  const deleteDocument = async (documentId: string) => {
    if (!confirm('この資料を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (error) {
        toast.error('削除に失敗しました')
        return
      }

      toast.success('資料を削除しました')
      fetchDocuments()
    } catch (error) {
      toast.error('エラーが発生しました')
    }
  }

  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.memo?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = projectFilter === 'all' || document.project_id === projectFilter
    return matchesSearch && matchesProject
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-600" />
    } else if (fileType.includes('word') || fileType.includes('doc')) {
      return <FileText className="h-8 w-8 text-blue-600" />
    } else if (fileType.includes('excel') || fileType.includes('sheet')) {
      return <FileText className="h-8 w-8 text-green-600" />
    } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
      return <FileText className="h-8 w-8 text-orange-600" />
    } else {
      return <File className="h-8 w-8 text-gray-600" />
    }
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">資料一覧</h1>
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">{filteredDocuments.length}件</span>
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
                placeholder="ファイル名・メモで検索"
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
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Upload className="h-4 w-4 mr-1" />
              ファイルを追加
            </button>
          </div>
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-sm font-medium text-gray-900">資料がありません</h3>
            <p className="mt-1 text-sm text-gray-500">新しい資料をアップロードして始めましょう。</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    ファイル名
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  投稿者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ファイルサイズ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  投稿日時
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
              {filteredDocuments.map((document) => (
                <tr key={document.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getFileIcon(document.file_type)}
                      <div>
                        <a
                          href={document.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-gray-900 hover:text-blue-600"
                        >
                          {document.file_name}
                        </a>
                        {document.project?.name && (
                          <div className="text-xs text-gray-500 mt-1">{document.project.name}</div>
                        )}
                        {document.memo && (
                          <div className="text-xs text-gray-500 mt-1">{document.memo}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {document.uploader?.name || '未設定'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(document.file_size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(document.created_at).toLocaleString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(document.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={document.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="表示"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <a
                        href={document.file_url}
                        download={document.file_name}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="ダウンロード"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => deleteDocument(document.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* アップロードモーダル */}
      {showUploadModal && (
        <UploadModal
          projects={projects}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            fetchDocuments()
          }}
        />
      )}
    </div>
  )
}


// アップロードモーダル
function UploadModal({ projects, onClose, onSuccess }: {
  projects: Project[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [memo, setMemo] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const supabase = createClient()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('ファイルを選択してください')
      return
    }
    
    if (!selectedProject) {
      toast.error('プロジェクトを選択してください')
      return
    }

    setUploading(true)

    try {
      // 現在のユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('ユーザー情報が取得できません')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!userData) {
        toast.error('会社情報が取得できません')
        return
      }

      let successCount = 0
      
      for (const file of selectedFiles) {
        try {
          // ファイル名を一意にする
          const fileExt = file.name.split('.').pop()
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
          
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

          // Storageにアップロード（photosバケットを使用）
          const { data: storageData, error: storageError } = await supabase.storage
            .from('photos')
            .upload(`documents/${fileName}`, file, {
              cacheControl: '3600',
              upsert: false
            })

          if (storageError) {
            console.error('Storage upload error:', storageError)
            console.error('Error details:', storageError)
            toast.error(`${file.name}のアップロードに失敗しました: ${storageError.message}`)
            continue
          }

          console.log('Storage upload success:', storageData)

          // 公開URLを取得
          const { data: urlData } = supabase.storage
            .from('photos')
            .getPublicUrl(`documents/${fileName}`)

          console.log('Generated URL:', urlData.publicUrl)

          // データベースにレコードを作成
          const { error: dbError } = await supabase
            .from('documents')
            .insert([
              {
                project_id: selectedProject,
                company_id: userData.company_id,
                uploaded_by: user.id,
                file_url: urlData.publicUrl,
                file_name: file.name,
                file_size: file.size,
                file_type: file.type,
                memo: memo || null
              }
            ])

          if (dbError) {
            console.error('Database insert error:', dbError)
            console.error('DB Error details:', dbError)
            // ストレージからファイルを削除
            await supabase.storage.from('photos').remove([`documents/${fileName}`])
            toast.error(`${file.name}の情報保存に失敗しました: ${dbError.message}`)
            continue
          }

          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
          successCount++

        } catch (error) {
          console.error('Upload error:', error)
          toast.error(`${file.name}のアップロードでエラーが発生しました`)
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount}件の資料をアップロードしました`)
        onSuccess()
      }

    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('予期しないエラーが発生しました')
    } finally {
      setUploading(false)
      setUploadProgress({})
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">資料アップロード</h3>
          
          {/* プロジェクト選択 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロジェクト *
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
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

          {/* ファイル選択 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              資料ファイル *
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              PDF、Word、Excel、PowerPoint、画像ファイルなどをアップロードできます
            </p>
          </div>

          {/* 選択されたファイル一覧 */}
          {selectedFiles.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選択されたファイル ({selectedFiles.length}件)
              </label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    {uploadProgress[file.name] !== undefined && (
                      <div className="ml-2 w-16">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${uploadProgress[file.name]}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {!uploading && (
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* メモ */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メモ（共通）
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="資料の説明を入力してください..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0 || !selectedProject}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {uploading ? 'アップロード中...' : `アップロード (${selectedFiles.length}件)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}