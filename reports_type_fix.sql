-- Reports テーブルのtype制約を修正
-- Supabase Dashboard → SQL Editor で実行

-- 1. 既存のCHECK制約を削除
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_type_check;

-- 2. 新しいCHECK制約を追加（日本語の値を含む）
ALTER TABLE reports ADD CONSTRAINT reports_type_check 
CHECK (type IN ('start', 'end', 'progress', '日報', '週報', '月報'));