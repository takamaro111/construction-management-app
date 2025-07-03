export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          email: string
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          company_id: string
          email: string
          name: string
          role: 'admin' | 'manager' | 'viewer'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          email: string
          name: string
          role?: 'admin' | 'manager' | 'viewer'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          email?: string
          name?: string
          role?: 'admin' | 'manager' | 'viewer'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          status: 'preparing' | 'in_progress' | 'completed' | 'suspended'
          start_date: string | null
          end_date: string | null
          manager_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          status?: 'preparing' | 'in_progress' | 'completed' | 'suspended'
          start_date?: string | null
          end_date?: string | null
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          status?: 'preparing' | 'in_progress' | 'completed' | 'suspended'
          start_date?: string | null
          end_date?: string | null
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'manager' | 'member' | 'viewer'
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: 'manager' | 'member' | 'viewer'
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: 'manager' | 'member' | 'viewer'
          created_at?: string
        }
      }
      photos: {
        Row: {
          id: string
          project_id: string
          company_id: string
          uploaded_by: string
          file_url: string
          thumbnail_url: string | null
          file_name: string
          file_size: number
          memo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          company_id: string
          uploaded_by: string
          file_url: string
          thumbnail_url?: string | null
          file_name: string
          file_size: number
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          company_id?: string
          uploaded_by?: string
          file_url?: string
          thumbnail_url?: string | null
          file_name?: string
          file_size?: number
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          project_id: string
          company_id: string
          uploaded_by: string
          file_url: string
          file_name: string
          file_size: number
          file_type: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          company_id: string
          uploaded_by: string
          file_url: string
          file_name: string
          file_size: number
          file_type: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          company_id?: string
          uploaded_by?: string
          file_url?: string
          file_name?: string
          file_size?: number
          file_type?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          company_id: string
          project_id: string | null
          name: string
          type: 'project' | 'group'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          project_id?: string | null
          name: string
          type?: 'project' | 'group'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          project_id?: string | null
          name?: string
          type?: 'project' | 'group'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          chat_id: string
          user_id: string
          message: string
          attachments: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          user_id: string
          message: string
          attachments?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          user_id?: string
          message?: string
          attachments?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          project_id: string
          company_id: string
          reported_by: string
          type: 'start' | 'end' | 'progress'
          title: string
          content: string
          attachments: Json | null
          approved_by: string | null
          approved_at: string | null
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          company_id: string
          reported_by: string
          type: 'start' | 'end' | 'progress'
          title: string
          content: string
          attachments?: Json | null
          approved_by?: string | null
          approved_at?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          company_id?: string
          reported_by?: string
          type?: 'start' | 'end' | 'progress'
          title?: string
          content?: string
          attachments?: Json | null
          approved_by?: string | null
          approved_at?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          company_id: string
          user_id: string
          project_id: string | null
          title: string
          description: string | null
          start_datetime: string
          end_datetime: string
          all_day: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          project_id?: string | null
          title: string
          description?: string | null
          start_datetime: string
          end_datetime: string
          all_day?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          project_id?: string | null
          title?: string
          description?: string | null
          start_datetime?: string
          end_datetime?: string
          all_day?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}