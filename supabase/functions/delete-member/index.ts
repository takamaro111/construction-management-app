import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteMemberRequest {
  user_id: string
  email: string
}

serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('メンバー削除要求受信')
    
    const requestData = await req.json()
    console.log('リクエストデータ:', requestData)
    
    const { user_id, email } = requestData as DeleteMemberRequest

    // 必須パラメータのチェック
    if (!user_id || !email) {
      return new Response(
        JSON.stringify({ 
          error: '必須パラメータが不足しています',
          details: { user_id: !!user_id, email: !!email }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // UUIDの形式チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(user_id)) {
      return new Response(
        JSON.stringify({ 
          error: 'user_idがUUID形式ではありません',
          details: { user_id }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Supabase管理者クライアントを作成
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('環境変数が設定されていません')
      return new Response(
        JSON.stringify({ error: '環境変数が設定されていません' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 削除対象ユーザーが存在するかチェック
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('id', user_id)
      .single()

    if (!user) {
      return new Response(
        JSON.stringify({ 
          error: 'ユーザーが見つかりません',
          details: { user_id }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    // メールアドレスの整合性チェック
    if (user.email !== email) {
      return new Response(
        JSON.stringify({ 
          error: 'メールアドレスが一致しません',
          details: { expected: user.email, provided: email }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log(`削除対象ユーザー: ${user.name} (${user.email})`)

    // ステップ1: usersテーブルからユーザーを削除
    const { error: deleteUserError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', user_id)

    if (deleteUserError) {
      console.error('usersテーブル削除エラー:', deleteUserError)
      return new Response(
        JSON.stringify({ 
          error: 'ユーザーテーブルからの削除に失敗しました',
          details: deleteUserError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log('usersテーブルから削除完了')

    // ステップ2: Supabase Authからユーザーを削除
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    if (deleteAuthError) {
      console.error('Auth削除エラー:', deleteAuthError)
      
      // usersテーブルからは削除済みなので、Auth削除失敗は警告として処理
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'ユーザーを削除しました（Auth削除で警告あり）',
          warning: deleteAuthError.message,
          user_name: user.name,
          email: user.email
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    console.log('Authから削除完了')

    // 削除完了ログ
    console.log('=== メンバー削除完了 ===')
    console.log('ユーザー名:', user.name)
    console.log('メールアドレス:', user.email)
    console.log('ユーザーID:', user_id)
    console.log('削除日時:', new Date().toISOString())
    console.log('=======================')

    // 成功レスポンス
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'メンバーを完全に削除しました',
        user_name: user.name,
        email: user.email,
        deleted_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'エラーが発生しました',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})