-- Supabaseストレージのポリシー設定
-- これらのSQLをSupabaseのSQLエディタで実行してください

-- photosバケットの読み取りポリシーを作成
CREATE POLICY "Photos are publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'photos');

-- photosバケットへのアップロードポリシーを作成（認証されたユーザーのみ）
CREATE POLICY "Authenticated users can upload photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'photos' 
  AND auth.role() = 'authenticated'
);

-- photosバケットの削除ポリシーを作成（自分がアップロードしたもののみ削除可能）
CREATE POLICY "Users can delete own photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 既存のポリシーがある場合は削除してから上記を実行
-- DROP POLICY IF EXISTS "Photos are publicly readable" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;