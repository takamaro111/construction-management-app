import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResetPasswordRequest {
  email: string
}

serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('パスワードリセット要求受信')
    
    const requestData = await req.json()
    console.log('リクエストデータ:', requestData)
    
    const { email } = requestData as ResetPasswordRequest

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'メールアドレスが必要です' }),
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
      .select('id, name')
      .eq('email', email)
      .single()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'ユーザーが見つかりません' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    // 新しい一時パスワードを生成
    const newTempPassword = crypto.randomUUID().substring(0, 16)
    console.log('新しい一時パスワード生成:', newTempPassword)

    // パスワードを更新
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newTempPassword }
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

    console.log('パスワード更新成功')

    // メール送信ログ
    const emailContent = `
【GENBA】パスワードリセットのお知らせ

${user.name}様

パスワードリセットのご要求を承りました。

■新しいログイン情報
ログインURL: ${supabaseUrl}/auth/login
メールアドレス: ${email}
新しい一時パスワード: ${newTempPassword}

■ログイン手順
1. 上記URLにアクセス
2. メールアドレスと新しいパスワードでログイン
3. ログイン後、パスワードの変更をお願いします

※このメールは自動送信されています。
※一時パスワードは他人に共有しないでください。

GENBA運営チーム
    `.trim()

    console.log('=== パスワードリセット メール送信ログ ===')
    console.log('宛先:', email)
    console.log('件名: 【GENBA】パスワードリセットのお知らせ')
    console.log('内容:')
    console.log(emailContent)
    console.log('=====================================')

    // 成功レスポンス
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'パスワードがリセットされました',
        temp_password: newTempPassword,
        email: email
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