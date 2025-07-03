'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { Send, MessageSquare, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'

type ChatMessage = {
  id: string
  chat_id: string
  user_id: string
  message: string
  created_at: string
  sender?: {
    name: string
  }
}

type Chat = {
  id: string
  project_id: string
  name: string
  project?: {
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

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    initializeChat()
  }, [])

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id)
      // リアルタイム更新を設定
      const subscription = supabase
        .channel(`chat:${selectedChat.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${selectedChat.id}`
        }, async (payload) => {
          // 新しいメッセージの送信者情報を取得
          const { data: senderData } = await supabase
            .from('users')
            .select('name')
            .eq('id', payload.new.user_id)
            .single()
          
          const newMessage: ChatMessage = {
            ...payload.new as ChatMessage,
            sender: senderData || undefined
          }
          
          // 自分が送信したメッセージでない場合のみ追加（重複を防ぐ）
          if (payload.new.user_id !== currentUser?.id) {
            setMessages(prev => [...prev, newMessage])
            
            // 通知音を鳴らす（ブラウザのビープ音）
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLYiTcIGWi77OWeTQ8MUJH1/aKFWBs');
            audio.play().catch(() => {})
          }
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [selectedChat])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeChat = async () => {
    try {
      // 現在のユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('id, name')
        .eq('id', user.id)
        .single()

      setCurrentUser(userData)

      await Promise.all([
        fetchChats(),
        fetchProjects()
      ])
    } catch (error) {
      console.error('初期化エラー:', error)
      toast.error('初期化に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          project:project_id(name)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('チャット取得エラー:', error)
        return
      }

      setChats(data || [])
    } catch (error) {
      console.error('チャット取得エラー:', error)
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

  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:user_id(name)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('メッセージ取得エラー:', error)
        return
      }

      setMessages(data || [])
    } catch (error) {
      console.error('メッセージ取得エラー:', error)
    }
  }

  const createChat = async (projectId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!userData) return

      const project = projects.find(p => p.id === projectId)
      if (!project) return

      const { data, error } = await supabase
        .from('chats')
        .insert([
          {
            project_id: projectId,
            company_id: userData.company_id,
            name: `${project.name} - チャット`,
            created_by: user.id
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('チャット作成エラー:', error)
        toast.error('チャットの作成に失敗しました')
        return
      }

      toast.success('チャットを作成しました')
      await fetchChats()
      
      // 作成したチャットを選択
      const newChat = { ...data, project: { name: project.name } }
      setSelectedChat(newChat)
    } catch (error) {
      console.error('チャット作成エラー:', error)
      toast.error('エラーが発生しました')
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUser) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const messageToSend = {
        chat_id: selectedChat.id,
        user_id: user.id,
        message: newMessage.trim()
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert([messageToSend])
        .select()
        .single()

      if (error) {
        console.error('メッセージ送信エラー:', error)
        toast.error('メッセージの送信に失敗しました')
        return
      }

      // 自分のメッセージをすぐに画面に反映
      const newMessageData: ChatMessage = {
        ...data,
        sender: { name: currentUser.name }
      }
      setMessages(prev => [...prev, newMessageData])
      setNewMessage('')
    } catch (error) {
      console.error('メッセージ送信エラー:', error)
      toast.error('エラーが発生しました')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">チャット</h1>
            <p className="text-sm text-gray-500 mt-1">プロジェクトメンバーとコミュニケーション</p>
          </div>
          <CreateChatModal projects={projects} onCreateChat={createChat} />
        </div>
      </div>

      <div className="flex h-[calc(100vh-16rem)] gap-6">
        {/* サイドバー - チャット一覧 */}
        <div className="w-80 bg-white rounded-lg shadow-sm flex flex-col">
          {/* ヘッダー */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-900">チャット一覧</h2>
          </div>

          {/* チャット一覧 */}
          <div className="flex-1 overflow-y-auto p-4">
            {chats.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="mx-auto h-8 w-8 mb-3 text-gray-400" />
                <p className="text-sm font-medium">チャットがありません</p>
                <p className="text-xs mt-1 text-gray-400">新しいチャットを作成してください</p>
              </div>
            ) : (
              <div className="space-y-1">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full p-3 text-left rounded-md transition-colors ${
                      selectedChat?.id === chat.id 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${
                          selectedChat?.id === chat.id 
                            ? 'bg-blue-100' 
                            : 'bg-gray-100'
                        }`}>
                          <MessageSquare className={`w-4 h-4 ${
                            selectedChat?.id === chat.id ? 'text-blue-600' : 'text-gray-500'
                          }`} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {chat.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {chat.project?.name}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* メインチャットエリア */}
        <div className="flex-1 bg-white rounded-lg shadow-sm flex flex-col">
          {selectedChat ? (
            <>
              {/* チャットヘッダー */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{selectedChat.name}</h3>
                    <p className="text-xs text-gray-500">{selectedChat.project?.name}</p>
                  </div>
                </div>
              </div>

              {/* メッセージエリア */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-12">
                    <MessageSquare className="mx-auto h-8 w-8 mb-3 text-gray-400" />
                    <p className="text-sm font-medium">まだメッセージがありません</p>
                    <p className="text-xs mt-1">最初のメッセージを送信しましょう</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.user_id === currentUser?.id}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* メッセージ入力エリア */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="メッセージを入力..."
                      className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageSquare className="mx-auto h-12 w-12 mb-3 text-gray-400" />
                <h3 className="text-sm font-medium mb-1">チャットを選択してください</h3>
                <p className="text-xs">左側のリストからチャットを選択するか、新しいチャットを作成してください</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// メッセージバブルコンポーネント
function MessageBubble({ message, isOwn }: {
  message: ChatMessage
  isOwn: boolean
}) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-1' : 'order-2'}`}>
        <div
          className={`px-3 py-2 rounded-lg text-sm ${
            isOwn
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-900 border border-gray-200'
          }`}
        >
          <p className="leading-relaxed whitespace-pre-wrap">{message.message}</p>
        </div>
        <div className={`mt-1 flex items-center space-x-2 text-xs text-gray-500 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          {!isOwn && (
            <span className="font-medium text-blue-600">{message.sender?.name}</span>
          )}
          <span>
            {new Date(message.created_at).toLocaleString('ja-JP', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>
    </div>
  )
}

// チャット作成モーダル
function CreateChatModal({ projects, onCreateChat }: {
  projects: Project[]
  onCreateChat: (projectId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState('')

  const handleCreate = () => {
    if (!selectedProject) {
      toast.error('プロジェクトを選択してください')
      return
    }

    onCreateChat(selectedProject)
    setIsOpen(false)
    setSelectedProject('')
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
      >
        <MessageSquare className="h-4 w-4 mr-1" />
        新規チャット作成
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">新しいチャットを作成</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プロジェクト *
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!selectedProject}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  作成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}