-- Reportsテーブルの修正とRLSポリシー
-- Supabase Dashboard → SQL Editor で実行

-- 1. 既存のRLSポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Reports are viewable by company members" ON reports;
DROP POLICY IF EXISTS "Users can insert reports for their company" ON reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON reports;

-- 2. 必要なカラムを追加（存在しない場合）
ALTER TABLE reports ADD COLUMN IF NOT EXISTS weather TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS temperature DECIMAL(4,1);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS workers INTEGER DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_date DATE;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS work_progress INTEGER DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS issues TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS next_actions TEXT;

-- 3. RLSポリシーを作成

-- 同じ会社のメンバーは報告書を閲覧可能
CREATE POLICY "Reports are viewable by company members" ON reports
FOR SELECT USING (
  company_id = get_user_company_id()
);

-- ユーザーは自分の会社の報告書を挿入可能
CREATE POLICY "Users can insert reports for their company" ON reports
FOR INSERT WITH CHECK (
  company_id = get_user_company_id() AND
  reported_by = auth.uid()
);

-- ユーザーは自分が作成した報告書を更新可能
CREATE POLICY "Users can update their own reports" ON reports
FOR UPDATE USING (
  company_id = get_user_company_id() AND
  reported_by = auth.uid()
) WITH CHECK (
  company_id = get_user_company_id() AND
  reported_by = auth.uid()
);

-- ユーザーは自分が作成した報告書を削除可能
CREATE POLICY "Users can delete their own reports" ON reports
FOR DELETE USING (
  company_id = get_user_company_id() AND
  reported_by = auth.uid()
);