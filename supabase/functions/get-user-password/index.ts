import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GetPasswordRequest {
  user_id: string
  email: string
}

serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('パスワード取得要求受信')
    
    const requestData = await req.json()
    console.log('リクエストデータ:', requestData)
    
    const { user_id, email } = requestData as GetPasswordRequest

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

    // ユーザーが存在するかチェック
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role')
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

    console.log(`パスワード取得対象ユーザー: ${user.name} (${user.email})`)

    // Supabase Authからユーザー情報を取得
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(user_id)

    if (authError) {
      console.error('Auth情報取得エラー:', authError)
      return new Response(
        JSON.stringify({ 
          error: 'Auth情報の取得に失敗しました',
          details: authError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    if (!authUser.user) {
      return new Response(
        JSON.stringify({ 
          error: 'Authユーザーが見つかりません',
          details: { user_id }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    // 注意: 実際のパスワードはハッシュ化されており、取得できません
    // しかし、一時パスワードや管理者が設定したパスワードなどの情報は
    // user_metadataやapp_metadataに保存されている可能性があります

    const userMetadata = authUser.user.user_metadata || {}
    const appMetadata = authUser.user.app_metadata || {}
    
    // ユーザーのメタデータから一時パスワードや管理者設定パスワードを探す
    let currentPassword = null
    
    // 最近のパスワードリセットによる一時パスワードをチェック
    if (userMetadata.temp_password) {
      currentPassword = userMetadata.temp_password
    } else if (userMetadata.admin_set_password) {
      currentPassword = userMetadata.admin_set_password
    } else if (appMetadata.temp_password) {
      currentPassword = appMetadata.temp_password
    }

    // パスワードが見つからない場合は、新しい一時パスワードを生成してリセット
    if (!currentPassword) {
      console.log('既存のパスワード情報が見つからないため、新しい一時パスワードを生成します')
      
      const newTempPassword = crypto.randomUUID().substring(0, 16)
      
      // パスワードを更新し、メタデータに保存
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        { 
          password: newTempPassword,
          user_metadata: {
            ...userMetadata,
            temp_password: newTempPassword,
            password_set_by_admin: true,
            password_set_at: new Date().toISOString()
          }
        }
      )

      if (updateError) {
        console.error('パスワード更新エラー:', updateError)
        return new Response(
          JSON.stringify({ 
            error: 'パスワードの更新に失敗しました',
            details: updateError.message 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }

      currentPassword = newTempPassword
      console.log('新しい一時パスワードを生成・設定しました')
    }

    // ログ記録
    console.log('=== パスワード取得ログ ===')
    console.log('取得者: 管理者')
    console.log('対象ユーザー:', user.name)
    console.log('メールアドレス:', user.email)
    console.log('取得日時:', new Date().toISOString())
    console.log('=========================')

    // 成功レスポンス
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'パスワードを取得しました',
        current_password: currentPassword,
        user_name: user.name,
        email: user.email,
        is_temp_password: true,
        last_updated: new Date().toISOString()
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