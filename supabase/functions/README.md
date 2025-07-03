# Supabase Edge Functions

## 招待システムのセットアップ

### 1. Supabase CLIのインストール

```bash
npm install -g supabase
```

### 2. Supabaseプロジェクトとリンク

```bash
supabase link --project-ref [your-project-ref]
```

### 3. Edge Functionのデプロイ

```bash
# 招待機能をデプロイ
supabase functions deploy invite-member

# または全てのfunctionsをデプロイ
supabase functions deploy
```

### 4. 環境変数の設定

Supabaseダッシュボードで以下の環境変数を設定してください：

- `SUPABASE_URL`: プロジェクトのURL
- `SUPABASE_SERVICE_ROLE_KEY`: サービスロールキー（既に自動設定されています）

### 5. 権限の設定

Edge Functionが正しく動作するために、以下を確認してください：

1. **Authentication > Policies**で、`users`テーブルへの書き込み権限
2. **Authentication > Email Templates**で招待メールテンプレートの設定

## 使用方法

クライアントサイドから以下のように呼び出します：

```typescript
const { data, error } = await supabase.functions.invoke('invite-member', {
  body: {
    email: 'new-member@example.com',
    name: '新規メンバー',
    role: 'member',
    company_id: 'company-uuid',
    invited_by: 'inviter-uuid'
  }
})
```

## トラブルシューティング

### エラー: "User not allowed"
- サービスロールキーが正しく設定されているか確認
- Edge Functionの権限を確認

### エラー: "users_role_check"
- `role`フィールドは'admin'または'user'のみ受け付けます
- UIの'manager'と'member'は'user'として保存されます

### 招待メールが届かない
- Supabaseダッシュボードでメール設定を確認
- SMTP設定が必要な場合があります