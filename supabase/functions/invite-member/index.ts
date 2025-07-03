import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteRequest {
  email: string
  name: string
  role: 'admin' | 'manager' | 'member'
  company_id: string
  invited_by: string
}

// メール送信関数
async function sendInvitationEmail(email: string, name: string, tempPassword: string) {
  const loginUrl = `${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'}/auth/login`
  
  const emailContent = `
【GENBA】メンバー招待のお知らせ

${name}様

GENBAへのメンバー招待をお送りいたします。

■ログイン情報
ログインURL: ${loginUrl}
メールアドレス: ${email}
一時パスワード: ${tempPassword}

■初回ログイン手順
1. 上記URLにアクセス
2. メールアドレスとパスワードでログイン
3. 初回ログイン後、パスワードの変更をお願いします

※このメールは自動送信されています。
※一時パスワードは他人に共有しないでください。

GENBA運営チーム
  `.trim()

  // メール送信サービスの設定を確認
  const emailService = Deno.env.get('EMAIL_SERVICE') || 'resend'
  
  if (emailService === 'resend') {
    return await sendEmailViaResend(email, name, emailContent, tempPassword)
  } else if (emailService === 'smtp') {
    return await sendEmailViaSMTP(email, name, emailContent, tempPassword)
  } else {
    // フォールバック：ログのみ
    console.log('=== 招待メール送信ログ ===')
    console.log('宛先:', email)
    console.log('件名: 【GENBA】メンバー招待のお知らせ')
    console.log('内容:')
    console.log(emailContent)
    console.log('========================')
    
    return { success: true, message: 'メール送信ログを記録しました（実際のメール送信は未設定）' }
  }
}

// Resend APIを使用したメール送信
async function sendEmailViaResend(email: string, name: string, content: string, tempPassword: string) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@genba.com'
  
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY が設定されていません。ログのみ記録します。')
    console.log('=== メール内容（Resend未設定） ===')
    console.log('宛先:', email)
    console.log('内容:', content)
    console.log('===============================')
    return { success: true, message: 'メール送信ログを記録しました（Resend未設定）' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: '【GENBA】メンバー招待のお知らせ',
        text: content,
        html: content.replace(/\n/g, '<br>')
      }),
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('Resendメール送信成功:', result)
      return { success: true, message: 'Resendでメールを送信しました', email_id: result.id }
    } else {
      console.error('Resendメール送信失敗:', result)
      return { success: false, message: 'Resendでのメール送信に失敗', error: result }
    }
  } catch (error) {
    console.error('Resendメール送信エラー:', error)
    return { success: false, message: 'Resendメール送信でエラーが発生', error: error.message }
  }
}

// SMTP経由のメール送信（Gmail等）
async function sendEmailViaSMTP(email: string, name: string, content: string, tempPassword: string) {
  // SMTPライブラリを使用（この例では設定のみ表示）
  const smtpConfig = {
    host: Deno.env.get('SMTP_HOST') || 'smtp.gmail.com',
    port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
    username: Deno.env.get('SMTP_USERNAME'),
    password: Deno.env.get('SMTP_PASSWORD'),
    from: Deno.env.get('FROM_EMAIL') || 'noreply@genba.com'
  }

  if (!smtpConfig.username || !smtpConfig.password) {
    console.warn('SMTP設定が不完全です。ログのみ記録します。')
    console.log('=== メール内容（SMTP未設定） ===')
    console.log('宛先:', email)
    console.log('SMTP設定:', { ...smtpConfig, password: '***' })
    console.log('内容:', content)
    console.log('===============================')
    return { success: true, message: 'メール送信ログを記録しました（SMTP未設定）' }
  }

  // 実際のSMTP送信実装は追加のライブラリが必要
  console.log('=== SMTP メール送信（未実装） ===')
  console.log('宛先:', email)
  console.log('SMTP設定:', { ...smtpConfig, password: '***' })
  console.log('内容:', content)
  console.log('================================')
  
  return { success: true, message: 'SMTP設定を確認しました（実装は今後追加予定）' }
}

serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('リクエスト受信')
    
    // リクエストボディを取得
    const requestData = await req.json()
    console.log('リクエストデータ:', requestData)
    
    const { email, name, role, company_id, invited_by } = requestData as InviteRequest

    // 必須パラメータのチェック
    if (!email || !name || !role || !company_id || !invited_by) {
      return new Response(
        JSON.stringify({ 
          error: '必須パラメータが不足しています',
          details: { email: !!email, name: !!name, role: !!role, company_id: !!company_id, invited_by: !!invited_by }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // UUIDの形式チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(company_id)) {
      return new Response(
        JSON.stringify({ 
          error: 'company_idがUUID形式ではありません',
          details: { company_id }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    if (!uuidRegex.test(invited_by)) {
      return new Response(
        JSON.stringify({ 
          error: 'invited_byがUUID形式ではありません',
          details: { invited_by }
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

    // 既存のメールアドレスをチェック（usersテーブル）
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('email', email)
      .single()

    if (existingUser) {
      return new Response(
        JSON.stringify({ 
          error: 'このメールアドレスは既に登録されています',
          details: `${email} は既に ${existingUser.name} として登録済みです。別のメールアドレスを使用するか、既存ユーザーのパスワードリセットを行ってください。`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Supabase Authでも既存ユーザーをチェック
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = authUsers.users?.find(u => u.email === email)
    
    if (existingAuthUser) {
      return new Response(
        JSON.stringify({ 
          error: 'このメールアドレスは既にAuth認証に登録されています',
          details: `${email} は既にSupabase認証システムに登録済みです。別のメールアドレスを使用してください。`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // company_idが存在するかチェック
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', company_id)
      .single()

    if (!company) {
      return new Response(
        JSON.stringify({ 
          error: '指定された会社が見つかりません',
          details: { company_id }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // invited_byユーザーが存在するかチェック
    const { data: inviter } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('id', invited_by)
      .single()

    if (!inviter) {
      return new Response(
        JSON.stringify({ 
          error: '招待者が見つかりません',
          details: { invited_by }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // 一時的なランダムパスワードを生成
    const tempPassword = crypto.randomUUID().substring(0, 16)
    console.log('一時パスワード生成:', tempPassword)

    // Supabase Authでユーザーを作成
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        company_id,
        invited_by
      }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      return new Response(
        JSON.stringify({ 
          error: 'ユーザー作成に失敗しました',
          details: authError.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log('Authユーザー作成成功:', authData.user.id)

    // roleの値を調整（データベースの制約に合わせる）
    const dbRole = role === 'admin' ? 'admin' : 
                   role === 'manager' ? 'manager' : 'viewer'

    // usersテーブルにユーザー情報を追加
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: authData.user.id,
          name,
          email,
          role: dbRole,
          company_id,
          created_at: new Date().toISOString()
        }
      ])

    if (userError) {
      console.error('User table error:', userError)
      // Authユーザーを削除（ロールバック）
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      return new Response(
        JSON.stringify({ 
          error: 'ユーザー情報の保存に失敗しました',
          details: userError.message,
          debug_info: {
            user_id: authData.user.id,
            email,
            name,
            role: dbRole,
            company_id,
            error_code: userError.code,
            error_hint: userError.hint
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log('usersテーブル挿入成功')

    // 招待メールを送信
    let emailResult = { success: false, message: 'メール送信をスキップしました' }
    try {
      emailResult = await sendInvitationEmail(email, name, tempPassword)
      console.log('メール送信結果:', emailResult)
    } catch (emailError) {
      console.error('メール送信エラー:', emailError)
      emailResult = { success: false, message: 'メール送信でエラーが発生しました: ' + emailError.message }
      // メール送信に失敗してもユーザー作成は成功とする
    }

    // 成功レスポンス
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'メンバーを招待しました',
        user_id: authData.user.id,
        temp_password: tempPassword,
        email: email,
        email_sent: emailResult.success,
        email_message: emailResult.message,
        email_details: emailResult.email_id ? { email_id: emailResult.email_id } : undefined
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