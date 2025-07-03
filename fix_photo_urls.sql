-- データベースのURLを完全にクリーンアップ

-- 1. 現在のレコードを確認
SELECT id, file_name, file_url, length(file_url) as url_length 
FROM photos 
WHERE file_name = 'article-806-1.jpg';

-- 2. URLを完全に正しい形式で更新（一行で記述）
UPDATE photos SET file_url = 'https://drhcinwdqwcosbjxwzfl.supabase.co/storage/v1/object/public/photos/313596e6-5d29-443c-a371-2604181ddf63/175121067621-oh4thw68u.jpg' WHERE file_name = 'article-806-1.jpg';

-- 3. 更新後の確認
SELECT id, file_name, file_url, length(file_url) as url_length 
FROM photos 
WHERE file_name = 'article-806-1.jpg';

-- 4. もし他にも不正なURLがある場合は確認
SELECT file_name, file_url 
FROM photos 
WHERE file_url LIKE '%\r%' OR file_url LIKE '%\n%' OR file_url LIKE '%  %';