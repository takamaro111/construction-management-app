-- Chat Messages テーブルのRLSポリシー
-- Supabase Dashboard → SQL Editor で実行

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Chat messages are viewable by chat members" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to their chats" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;

-- 1. チャットメンバーはメッセージを閲覧可能
CREATE POLICY "Chat messages are viewable by chat members" ON chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = chat_messages.chat_id
    AND chats.company_id = get_user_company_id()
  )
);

-- 2. ユーザーは自分の会社のチャットにメッセージを挿入可能
CREATE POLICY "Users can insert messages to their chats" ON chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = chat_messages.chat_id
    AND chats.company_id = get_user_company_id()
  )
  AND user_id = auth.uid()
);

-- 3. ユーザーは自分のメッセージを更新可能
CREATE POLICY "Users can update their own messages" ON chat_messages
FOR UPDATE USING (
  user_id = auth.uid()
) WITH CHECK (
  user_id = auth.uid()
);

-- 4. ユーザーは自分のメッセージを削除可能
CREATE POLICY "Users can delete their own messages" ON chat_messages
FOR DELETE USING (
  user_id = auth.uid()
);