-- Documents テーブルのRLSポリシー修正
-- Supabase Dashboard → SQL Editor で実行

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Documents are viewable by company members" ON documents;
DROP POLICY IF EXISTS "Users can insert documents for their company" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

-- 1. 同じ会社のメンバーは資料を閲覧可能
CREATE POLICY "Documents are viewable by company members" ON documents
FOR SELECT USING (
  company_id = get_user_company_id()
);

-- 2. ユーザーは自分の会社の資料を挿入可能
CREATE POLICY "Users can insert documents for their company" ON documents
FOR INSERT WITH CHECK (
  company_id = get_user_company_id() AND
  uploaded_by = auth.uid()
);

-- 3. ユーザーは自分がアップロードした資料を更新可能
CREATE POLICY "Users can update their own documents" ON documents
FOR UPDATE USING (
  company_id = get_user_company_id() AND
  uploaded_by = auth.uid()
) WITH CHECK (
  company_id = get_user_company_id() AND
  uploaded_by = auth.uid()
);

-- 4. ユーザーは自分がアップロードした資料を削除可能
CREATE POLICY "Users can delete their own documents" ON documents
FOR DELETE USING (
  company_id = get_user_company_id() AND
  uploaded_by = auth.uid()
);