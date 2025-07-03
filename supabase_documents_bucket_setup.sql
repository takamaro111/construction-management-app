-- Documents バケット用のストレージポリシー
-- Supabase Dashboard → SQL Editor で実行

-- 1. documentsバケットへのアップロード許可
CREATE POLICY "Users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. documentsバケットからの読み取り許可（全員）
CREATE POLICY "Documents are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');

-- 3. documentsバケットからのファイル削除許可
CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);