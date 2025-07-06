'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { Upload, Search, Filter, Eye, Download, Trash2, Image as ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { compressImage, generateThumbnail, formatFileSize } from '../../../lib/image-compression'

type Photo = {
  id: string
  project_id: string
  file_url: string
  thumbnail_url: string | null
  file_name: string
  file_size: number
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

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchPhotos()
    fetchProjects()
  }, [])

  const fetchPhotos = async () => {
    try {
      // 認証チェック
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('認証が必要です')
        return
      }

      // ユーザーの会社IDを取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (userError || !userData) {
        console.error('ユーザー情報取得エラー:', userError)
        toast.error('ユーザー情報の取得に失敗しました')
        return
      }

      const { data, error } = await supabase
        .from('photos')
        .select(`
          *,
          project:project_id(name),
          uploader:uploaded_by(name)
        `)
        .eq('company_id', userData.company_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('写真取得エラー:', error)
        toast.error('写真の取得に失敗しました')
        return
      }

      setPhotos(data || [])
    } catch (error) {
      console.error('予期しないエラー:', error)
      toast.error('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      // 認証チェック
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('認証が必要です')
        return
      }

      // ユーザーの会社IDを取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (userError || !userData) {
        console.error('ユーザー情報取得エラー:', userError)
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('company_id', userData.company_id)
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

  const deletePhoto = async (photoId: string) => {
    if (!confirm('この写真を削除しますか？')) return

    try {
      // 認証チェック
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('認証が必要です')
        return
      }

      // ユーザーの会社IDを取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (userError || !userData) {
        toast.error('認証エラーが発生しました')
        return
      }

      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId)
        .eq('company_id', userData.company_id)

      if (error) {
        toast.error('削除に失敗しました')
        return
      }

      toast.success('写真を削除しました')
      fetchPhotos()
    } catch (error) {
      toast.error('エラーが発生しました')
    }
  }

  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = photo.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.memo?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = projectFilter === 'all' || photo.project_id === projectFilter
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
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:flex-auto">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-blue-700 rounded-full"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">写真管理</h1>
                <p className="mt-2 text-gray-600">
                  現場の写真をアップロード・共有・管理
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 sm:mt-0">
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Upload className="h-4 w-4 mr-2" />
              写真をアップロード
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
              placeholder="ファイル名・メモで検索..."
              className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            >
              <option value="all">すべてのプロジェクト</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 写真グリッド */}
      <div className="mt-8">
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">写真がありません</h3>
            <p className="mt-1 text-sm text-gray-500">最初の写真をアップロードしましょう。</p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                <Upload className="h-4 w-4 mr-2" />
                写真をアップロード
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onDelete={deletePhoto}
                onView={setSelectedPhoto}
              />
            ))}
          </div>
        )}
      </div>

      {/* アップロードモーダル */}
      {showUploadModal && (
        <UploadModal
          projects={projects}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            fetchPhotos()
          }}
        />
      )}

      {/* 写真ビューアー */}
      {selectedPhoto && (
        <PhotoViewer
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  )
}

// シンプルな写真カードコンポーネント
function PhotoCard({ photo, onDelete, onView }: {
  photo: Photo
  onDelete: (id: string) => void
  onView: (photo: Photo) => void
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 画像エリア */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden cursor-pointer" onClick={() => onView(photo)}>
        <img
          src={photo.thumbnail_url || photo.file_url}
          alt={photo.file_name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      
      {/* 情報エリア */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 truncate">{photo.file_name}</h3>
        <p className="text-xs text-gray-500 mt-1">{photo.project?.name}</p>
        {photo.memo && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{photo.memo}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">
            {new Date(photo.created_at).toLocaleDateString('ja-JP')}
          </span>
          <span className="text-xs text-gray-400">
            {photo.uploader?.name}
          </span>
        </div>
        <div className="flex space-x-2 mt-2">
          <button
            onClick={() => onView(photo)}
            className="flex-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
          >
            表示
          </button>
          <a
            href={photo.file_url}
            download={photo.file_name}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 text-center"
          >
            DL
          </a>
          <button
            onClick={() => onDelete(photo.id)}
            className="flex-1 px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
          >
            削除
          </button>
        </div>
      </div>
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
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length !== files.length) {
      toast.error('画像ファイルのみアップロード可能です')
    }
    
    setSelectedFiles(imageFiles)
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
          setUploadProgress(prev => ({ ...prev, [file.name]: 10 }))
          
          // 画像を圧縮
          const compressedFile = await compressImage(file, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            initialQuality: 0.8
          })
          
          setUploadProgress(prev => ({ ...prev, [file.name]: 30 }))
          
          // サムネイルを生成
          const thumbnailFile = await generateThumbnail(file, 300)
          
          setUploadProgress(prev => ({ ...prev, [file.name]: 50 }))
          
          // ファイル名を一意にする
          const fileExt = file.name.split('.').pop()
          const baseName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}`
          const fileName = `${baseName}.${fileExt}`
          const thumbnailName = `${baseName}_thumb.${fileExt}`
          
          // 圧縮後の画像をアップロード
          const { data: storageData, error: storageError } = await supabase.storage
            .from('photos')
            .upload(fileName, compressedFile, {
              cacheControl: '3600',
              upsert: false
            })

          if (storageError) {
            console.error('Storage upload error:', storageError)
            toast.error(`${file.name}のアップロードに失敗しました`)
            continue
          }
          
          setUploadProgress(prev => ({ ...prev, [file.name]: 70 }))
          
          // サムネイルをアップロード
          const { data: thumbData, error: thumbError } = await supabase.storage
            .from('photos')
            .upload(thumbnailName, thumbnailFile, {
              cacheControl: '3600',
              upsert: false
            })
          
          setUploadProgress(prev => ({ ...prev, [file.name]: 90 }))

          // 公開URLを取得
          const { data: urlData } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName)
            
          const { data: thumbUrlData } = supabase.storage
            .from('photos')
            .getPublicUrl(thumbnailName)

          console.log('Compressed size:', formatFileSize(compressedFile.size), 'Original size:', formatFileSize(file.size))
          console.log('Compression ratio:', ((1 - compressedFile.size / file.size) * 100).toFixed(1) + '%')

          // データベースにレコードを作成
          const { error: dbError } = await supabase
            .from('photos')
            .insert([
              {
                project_id: selectedProject,
                company_id: userData.company_id,
                uploaded_by: user.id,
                file_url: urlData.publicUrl,
                thumbnail_url: thumbUrlData.publicUrl,
                file_name: file.name,
                file_size: compressedFile.size,
                memo: memo || null
              }
            ])

          if (dbError) {
            console.error('Database insert error:', dbError)
            // ストレージからファイルを削除
            await supabase.storage.from('photos').remove([fileName, thumbnailName])
            toast.error(`${file.name}の情報保存に失敗しました`)
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
        toast.success(`${successCount}件の写真をアップロードしました`)
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


  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">写真アップロード</h3>
          
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
              写真ファイル *
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
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
              placeholder="写真の説明を入力してください..."
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

// 写真ビューアー
function PhotoViewer({ photo, onClose }: {
  photo: Photo
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="max-w-4xl max-h-4xl relative" onClick={(e) => e.stopPropagation()}>
        <img
          src={photo.file_url}
          alt={photo.file_name}
          className="max-w-full max-h-screen object-contain"
          style={{ maxHeight: '90vh', maxWidth: '90vw' }}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 w-10 h-10 flex items-center justify-center"
        >
          ✕
        </button>
        <div className="absolute bottom-4 left-4 right-4 text-white bg-black bg-opacity-50 p-4 rounded">
          <h3 className="font-medium">{photo.file_name}</h3>
          {photo.memo && <p className="text-sm mt-1">{photo.memo}</p>}
          <p className="text-xs mt-2">
            プロジェクト: {photo.project?.name} | 
            アップロード者: {photo.uploader?.name} |
            日時: {new Date(photo.created_at).toLocaleString('ja-JP')}
          </p>
        </div>
      </div>
    </div>
  )
}