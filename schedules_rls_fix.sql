-- Schedules テーブルのRLSポリシー
-- Supabase Dashboard → SQL Editor で実行

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Schedules are viewable by company members" ON schedules;
DROP POLICY IF EXISTS "Users can insert schedules for their company" ON schedules;
DROP POLICY IF EXISTS "Users can update their schedules" ON schedules;
DROP POLICY IF EXISTS "Users can delete their schedules" ON schedules;

-- 1. 同じ会社のメンバーはスケジュールを閲覧可能
CREATE POLICY "Schedules are viewable by company members" ON schedules
FOR SELECT USING (
  company_id = get_user_company_id()
);

-- 2. ユーザーは自分の会社のスケジュールを挿入可能
CREATE POLICY "Users can insert schedules for their company" ON schedules
FOR INSERT WITH CHECK (
  company_id = get_user_company_id() AND
  created_by = auth.uid()
);

-- 3. ユーザーは自分が作成したスケジュールを更新可能
CREATE POLICY "Users can update their schedules" ON schedules
FOR UPDATE USING (
  company_id = get_user_company_id() AND
  (created_by = auth.uid() OR assigned_to = auth.uid())
) WITH CHECK (
  company_id = get_user_company_id()
);

-- 4. ユーザーは自分が作成したスケジュールを削除可能
CREATE POLICY "Users can delete their schedules" ON schedules
FOR DELETE USING (
  company_id = get_user_company_id() AND
  created_by = auth.uid()
);