# Vercelデプロイ手順

## 概要
この施工管理アプリをVercelにデプロイして、開発環境と同じ完全な機能を提供します。

## Vercelの利点
✅ **完全な機能サポート**
- 動的ルート（`/dashboard/projects/[id]`）が使用可能
- サーバーサイドレンダリング
- API Routes対応
- Middleware機能（認証チェック）
- リアルタイム更新

✅ **開発環境と同一**
- ローカル開発と全く同じ動作
- 全機能が利用可能

## デプロイ手順

### 方法1: Vercel CLIを使用（推奨）

1. **Vercel CLIのインストール**
```bash
npm i -g vercel
```

2. **プロジェクトディレクトリで実行**
```bash
vercel
```

3. **プロンプトに従って設定**
- ログイン（初回のみ）
- プロジェクト設定を確認
- 環境変数設定

### 方法2: GitHubと連携

1. **GitHubにリポジトリをプッシュ**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

2. **Vercelダッシュボード**
- [vercel.com](https://vercel.com)にアクセス
- 「New Project」をクリック
- GitHubリポジトリを選択
- 「Import」をクリック

### 方法3: 直接アップロード

1. **プロジェクトフォルダを圧縮**
- node_modulesとoutフォルダを除外
- ZIPファイルを作成

2. **Vercelダッシュボード**
- 「New Project」→「Upload」
- ZIPファイルをアップロード

## 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定：

```
NEXT_PUBLIC_SUPABASE_URL=https://drhcinwdqwcosbjxwzfl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyaGNpbndkcXdjb3NianF3emZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4OTQ4ODEsImV4cCI6MjA1MTQ3MDg4MX0.aOLgJdBKxI_b7YLsZdOz7WnxqRjpgJ9DhFHrMVQ
```

### 設定方法
1. Vercelプロジェクトダッシュボード
2. 「Settings」タブ
3. 「Environment Variables」
4. 各変数を追加
5. 「Save」をクリック

## 本番環境での追加設定

### カスタムドメイン
1. 「Settings」→「Domains」
2. カスタムドメインを追加
3. DNSレコードを設定

### 本番用Supabase設定（推奨）
クライアント専用のSupabaseプロジェクトを作成：
1. [supabase.com](https://supabase.com)で新規プロジェクト作成
2. データベーススキーマを移行
3. 環境変数を更新

## デプロイ後の確認

### 機能チェックリスト
- [ ] ユーザー登録・ログイン
- [ ] プロジェクト一覧表示
- [ ] プロジェクト詳細ページ（動的ルート）
- [ ] 写真アップロード・圧縮
- [ ] 報告書作成（日報・月報）
- [ ] スケジュール管理
- [ ] メンバー管理
- [ ] リアルタイムチャット

### トラブルシューティング

**ビルドエラーの場合**
- TypeScriptエラー: 型定義を確認
- 依存関係エラー: package.jsonを確認

**環境変数エラー**
- Vercelダッシュボードで環境変数が正しく設定されているか確認
- 変数名のスペルミスをチェック

**認証エラー**
- Supabase URLとAnon Keyが正しいか確認
- Supabaseダッシュボードで認証設定を確認

## 継続的デプロイ

GitHubと連携している場合：
- `main`ブランチへのプッシュで自動デプロイ
- プルリクエストでプレビューデプロイ

## サポート

問題が発生した場合：
1. Vercelのビルドログを確認
2. ブラウザの開発者ツールでエラーを確認
3. Supabaseのログを確認

---

**Vercelなら開発環境と同じ完全な機能でデプロイできます！** 🚀