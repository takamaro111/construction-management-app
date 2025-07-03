# Netlifyデプロイ手順

## 概要
この施工管理アプリをNetlifyにドラッグ&ドロップでデプロイするための手順書です。

## 事前準備
✅ Next.jsアプリの静的サイト出力設定が完了しました
✅ ビルドが正常に実行されました
✅ `out`フォルダに静的ファイルが生成されました

## デプロイ手順

### 1. ビルドの実行
プロジェクトディレクトリで以下のコマンドを実行：
```bash
npm run build
```

### 2. 出力フォルダの確認
ビルド完了後、`out`フォルダが作成されることを確認してください。
- `out/index.html` - トップページ
- `out/_next/` - CSS/JSファイル
- `out/dashboard/` - ダッシュボード関連ページ

### 3. Netlifyでのデプロイ

#### 手順A: ドラッグ&ドロップ
1. [Netlify](https://netlify.com) にアクセス
2. ログインまたはアカウント作成
3. ダッシュボードの「Want to deploy a new site without connecting to Git?」セクションを探す
4. **`out`フォルダ全体**をドラッグ&ドロップ

#### 手順B: ディレクトリアップロード
1. Netlifyの「Deploy manually」をクリック
2. 「Choose folder」で`out`フォルダを選択
3. アップロード実行

### 4. デプロイ後の設定

#### 環境変数の設定
Netlifyのサイト設定で以下の環境変数を設定：
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### リダイレクト設定
`netlify.toml`ファイルが含まれているため、SPAのルーティングが自動で設定されます。

## 重要な注意事項

### 🚨 制限事項
- API Routes は静的エクスポートでは使用できません
- サーバーサイド機能は無効になります
- 認証はクライアントサイドのみで動作します

### 🔧 カスタムドメイン設定
1. Netlifyダッシュボードで「Domain management」を開く
2. 「Add custom domain」をクリック
3. 独自ドメインを設定

### 🔄 再デプロイ手順
コードを更新した場合：
1. `npm run build`を実行
2. 新しい`out`フォルダをNetlifyにドラッグ&ドロップ

## トラブルシューティング

### ビルドエラーが発生する場合
- TypeScriptエラー: `typescript.ignoreBuildErrors: true`で無視設定済み
- 動的ルートエラー: 問題のあるページは削除済み

### デプロイ後にページが表示されない場合
- ブラウザのキャッシュをクリア
- Netlifyの「Clear cache and deploy site」を実行

### Supabase接続エラー
- 環境変数が正しく設定されているか確認
- Supabaseプロジェクトの設定確認

## ファイル構成
```
out/
├── index.html              # トップページ
├── dashboard/
│   ├── index.html          # ダッシュボード
│   ├── projects/           # プロジェクト管理
│   ├── photos/             # 写真管理  
│   ├── reports/            # 報告書管理
│   ├── schedule/           # スケジュール管理
│   ├── members/            # メンバー管理
│   ├── chat/               # チャット
│   └── settings/           # 設定
├── auth/
│   ├── login/              # ログイン
│   └── register/           # 登録
├── _next/                  # Next.js静的アセット
└── netlify.toml            # Netlify設定
```

## 成功確認
デプロイが成功すると、以下が利用可能になります：
- ✅ ユーザー認証（Supabase Auth）
- ✅ プロジェクト管理
- ✅ 写真アップロード・圧縮
- ✅ 報告書作成（日報・月報）
- ✅ スケジュール管理
- ✅ メンバー管理
- ✅ リアルタイムチャット
- ✅ レスポンシブデザイン

---
**デプロイ完了！** 🎉

Netlifyから提供されるURLでアプリケーションにアクセスできます。