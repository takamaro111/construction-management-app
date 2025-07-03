'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/client'
import { toast } from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'

export default function NewProjectPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    start_date: '',
    end_date: '',
    status: 'preparing' as 'preparing' | 'in_progress' | 'completed' | 'suspended'
  })
  const supabase = createClient()
  const router = useRouter()

  const getStatusLabel = (status: string) => {
    const labels = {
      preparing: '契約前',
      in_progress: '進行中',
      completed: '契約中',
      suspended: 'リフォーム'
    }
    return labels[status as keyof typeof labels]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 現在のユーザーの会社IDを取得
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

      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name: formData.name,
            description: formData.description || null,
            address: formData.address || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            status: formData.status,
            company_id: userData.company_id
          }
        ])
        .select()

      if (error) {
        console.error('プロジェクト作成エラー:', error)
        toast.error('プロジェクトの作成に失敗しました: ' + error.message)
        return
      }

      toast.success('プロジェクトを作成しました')
      router.push('/dashboard/projects')
    } catch (error) {
      console.error('予期しないエラー:', error)
      toast.error('エラーが発生しました: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">新規案件作成</h1>
              <p className="text-gray-600 mt-1">新しいプロジェクトを登録します</p>
            </div>
          </div>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                案件名 *
              </label>
              <input
                type="text"
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="〇〇様邸 リフォーム工事"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                案件詳細
              </label>
              <textarea
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="案件の詳細説明を入力してください"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                現場住所
              </label>
              <input
                type="text"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="〒000-0000 東京都渋谷区..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
              >
                <option value="preparing">契約前</option>
                <option value="in_progress">進行中</option>
                <option value="completed">契約中</option>
                <option value="suspended">リフォーム</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始日
                </label>
                <input
                  type="date"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  終了予定日
                </label>
                <input
                  type="date"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? '作成中...' : '案件を作成'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}