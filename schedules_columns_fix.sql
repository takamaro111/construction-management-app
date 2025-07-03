-- Schedulesテーブルに不足しているカラムを追加
-- Supabase Dashboard → SQL Editor で実行

-- 1. 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Users can create their own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can update their own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can delete their own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can view schedules" ON schedules;

-- 2. created_byカラムを追加
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- 3. assigned_toカラムを追加
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);

-- 4. statusカラムを追加
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'suspended')) DEFAULT 'pending';

-- 5. priorityカラムを追加
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium';

-- 6. カラム名の修正（既存のカラム名を変更）
ALTER TABLE schedules RENAME COLUMN start_datetime TO start_date;
ALTER TABLE schedules RENAME COLUMN end_datetime TO end_date;

-- 7. user_idカラムを削除（created_byとassigned_toで管理するため）
ALTER TABLE schedules DROP COLUMN IF EXISTS user_id;