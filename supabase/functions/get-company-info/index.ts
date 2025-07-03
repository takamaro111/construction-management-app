import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('会社情報取得要求受信')
    
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

    // 会社情報を取得
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, name, email, is_approved, created_at')
      .order('created_at', { ascending: false })

    if (companiesError) {
      console.error('会社情報取得エラー:', companiesError)
      return new Response(
        JSON.stringify({ 
          error: '会社情報の取得に失敗しました',
          details: companiesError.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // ユーザー情報を取得
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, company_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (usersError) {
      console.error('ユーザー情報取得エラー:', usersError)
      return new Response(
        JSON.stringify({ 
          error: 'ユーザー情報の取得に失敗しました',
          details: usersError.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // レスポンス
    return new Response(
      JSON.stringify({ 
        success: true,
        companies: companies || [],
        users: users || [],
        summary: {
          total_companies: companies?.length || 0,
          total_users: users?.length || 0,
          approved_companies: companies?.filter(c => c.is_approved).length || 0
        }
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