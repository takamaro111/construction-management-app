-- RLSセキュリティ警告の修正
-- companiesとusersテーブルのRLSを確実に有効化

-- companiesテーブルのRLS有効化
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- usersテーブルのRLS有効化  
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- companiesテーブルのポリシーを再設定（既存のポリシーがあれば削除してから作成）
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;

-- companiesテーブル：閲覧ポリシー
CREATE POLICY "companies_select_policy" ON public.companies
  FOR SELECT USING (
    CASE 
      WHEN auth.uid() IS NULL THEN false
      ELSE id = (
        SELECT company_id 
        FROM public.users 
        WHERE id = auth.uid()
      )
    END
  );

-- companiesテーブル：新規登録ポリシー（会社登録時のみ許可）
CREATE POLICY "companies_insert_policy" ON public.companies
  FOR INSERT WITH CHECK (true);

-- companiesテーブル：更新ポリシー
CREATE POLICY "companies_update_policy" ON public.companies
  FOR UPDATE USING (
    id = (
      SELECT company_id 
      FROM public.users 
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- usersテーブルのポリシーを再設定
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;

-- usersテーブル：閲覧ポリシー（同じ会社のユーザーのみ）
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT USING (
    CASE 
      WHEN auth.uid() IS NULL THEN false
      ELSE company_id = (
        SELECT company_id 
        FROM public.users 
        WHERE id = auth.uid()
      )
    END
  );

-- usersテーブル：新規登録ポリシー
CREATE POLICY "users_insert_policy" ON public.users
  FOR INSERT WITH CHECK (true);

-- usersテーブル：更新ポリシー
CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE USING (
    -- 自分のプロフィールまたは管理者が同じ会社のユーザーを更新
    id = auth.uid() OR (
      company_id = (
        SELECT company_id 
        FROM public.users 
        WHERE id = auth.uid()
          AND role = 'admin'
      )
    )
  );

-- usersテーブル：削除ポリシー（管理者のみ）
CREATE POLICY "users_delete_policy" ON public.users
  FOR DELETE USING (
    company_id = (
      SELECT company_id 
      FROM public.users 
      WHERE id = auth.uid()
        AND role = 'admin'
    )
    AND id != auth.uid() -- 自分自身は削除できない
  );

-- ヘルパー関数の確認・再作成
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;