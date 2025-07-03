-- documentsテーブルにmemoカラムを追加
-- Supabase Dashboard → SQL Editor で実行

ALTER TABLE documents ADD COLUMN IF NOT EXISTS memo TEXT;