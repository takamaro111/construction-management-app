# 施工管理Webアプリケーション

施工現場の進捗・資料・写真・チャット・スケジュールなどを一括で管理し、複数現場を効率的に横断管理できるWebアプリケーション。

## 機能一覧

- 🏢 **会社単位でのマルチテナント管理**
- 👥 **ユーザー権限管理**（管理者・担当者・閲覧者）
- 📋 **案件管理**（一覧・ボード・カレンダー表示）
- 📸 **写真管理**（アップロード・メモ機能）
- 📄 **資料管理**（PDF・Excel等のファイル共有）
- 💬 **チャット機能**（プロジェクト単位・グループチャット）
- 📊 **報告機能**（開始・終了・進捗報告）
- 📅 **スケジュール管理**（メンバーの予定共有）
- 📑 **報告書自動生成**（PDF出力）

## 技術スタック

- **フロントエンド**: Next.js 15, TypeScript, Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL + Row Level Security)
- **認証**: Supabase Auth
- **UI**: Radix UI, Lucide Icons
- **状態管理**: React Query

## セットアップ手順

### 1. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# アプリケーション設定
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Supabaseのセットアップ

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. `supabase/migrations`フォルダ内のSQLファイルを順番に実行：
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 使い方

### 初回登録

1. `/auth/register`にアクセス
2. 会社情報と管理者情報を入力
3. メール認証を完了

### ログイン

1. `/auth/login`にアクセス
2. メールアドレスとパスワードでログイン

## データベース構造

- **companies**: 会社情報
- **users**: ユーザー情報（会社に紐付け）
- **projects**: プロジェクト（案件）情報
- **project_members**: プロジェクトメンバー
- **photos**: 写真データ
- **documents**: 資料データ
- **chats**: チャットルーム
- **chat_messages**: チャットメッセージ
- **reports**: 報告書
- **schedules**: スケジュール

## セキュリティ

- Supabase RLS（Row Level Security）により、会社間のデータ分離を実現
- JWTトークンに会社ID・ユーザーロールを含めて権限制御
- HTTPS通信を推奨

## 今後の実装予定

- プッシュ通知機能
- ファイルのバージョン管理
- 外部カレンダー連携
- モバイルアプリ対応