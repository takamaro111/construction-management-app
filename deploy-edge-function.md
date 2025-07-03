# Edge Function デプロイ手順

## 1. Supabaseプロジェクトとリンク

以下のコマンドを実行して、あなたのSupabaseプロジェクトとリンクしてください：

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

**YOUR_PROJECT_REF** を実際のプロジェクトReference IDに置き換えてください。

## 2. ログイン

Supabaseアカウントにログインします：

```bash
npx supabase login
```

ブラウザが開くので、Supabaseアカウントでログインしてください。

## 3. Edge Functionのデプロイ

以下のコマンドでEdge Functionをデプロイします：

```bash
npx supabase functions deploy invite-member
```

## 4. 動作確認

デプロイが成功したら、Supabaseダッシュボードで確認できます：
1. **Edge Functions** セクションに移動
2. `invite-member` 関数が表示されていることを確認

## 5. テスト

アプリケーションのメンバー管理画面から：
1. 「メンバーを招待」ボタンをクリック
2. 必要な情報を入力
3. 招待を送信

## トラブルシューティング

### エラー: "Project ref not found"
- プロジェクトReference IDが正しいか確認
- `npx supabase projects list` で利用可能なプロジェクトを確認

### エラー: "Not authenticated"
- `npx supabase login` を再実行
- アクセストークンの有効期限を確認

### エラー: "Function already exists"
- 既存の関数を更新する場合は問題ありません
- 完全に再作成したい場合は `npx supabase functions delete invite-member` を実行してから再デプロイ

## 環境変数の確認

Supabaseダッシュボードで以下が自動設定されていることを確認：
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

これらは自動的に設定されるため、通常は追加設定不要です。