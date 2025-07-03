# メール送信機能の設定

メンバー招待時に自動的にログイン情報をメールで送信する機能を設定できます。

## 設定方法

### 1. Resend（推奨）を使用する場合

[Resend](https://resend.com) は開発者向けのメール送信サービスです。

#### ステップ1: Resendアカウント作成
1. https://resend.com にアクセス
2. 無料アカウントを作成（月100通まで無料）
3. APIキーを取得

#### ステップ2: ドメイン設定（オプション）
1. Resendダッシュボードでドメインを追加
2. DNS設定を行う（独自ドメインを使用する場合）

#### ステップ3: Supabaseに環境変数を設定
1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクト → Settings → Edge Functions → Environment variables
3. 以下の環境変数を追加：

```
EMAIL_SERVICE=resend
RESEND_API_KEY=re_xxxxxxxxxx（ResendのAPIキー）
FROM_EMAIL=noreply@yourdomain.com（送信者メールアドレス）
NEXT_PUBLIC_APP_URL=https://yourdomain.com（本番環境のURL）
```

### 2. Gmail SMTP を使用する場合

#### ステップ1: Googleアカウント設定
1. Googleアカウントで2段階認証を有効化
2. アプリパスワードを生成

#### ステップ2: Supabaseに環境変数を設定
```
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password（アプリパスワード）
FROM_EMAIL=your-email@gmail.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 3. 他のSMTPプロバイダーを使用する場合

#### 対応プロバイダー例
- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`
- **Amazon SES**: `email-smtp.region.amazonaws.com:587`

#### 設定例（SendGrid）
```
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 現在の状態

現在は **ログ出力のみ** の状態です。実際にメールを送信するには上記の設定が必要です。

### ログの確認方法
1. Supabase Dashboard → Functions → invite-member → Logs
2. メンバー招待実行後、ログでメール内容を確認できます

### メール内容例
```
【GENBA】メンバー招待のお知らせ

田中太郎様

GENBAへのメンバー招待をお送りいたします。

■ログイン情報
ログインURL: https://yourdomain.com/auth/login
メールアドレス: tanaka@example.com
一時パスワード: abc123def456

■初回ログイン手順
1. 上記URLにアクセス
2. メールアドレスとパスワードでログイン
3. 初回ログイン後、パスワードの変更をお願いします

※このメールは自動送信されています。
※一時パスワードは他人に共有しないでください。

GENBA運営チーム
```

## トラブルシューティング

### メールが送信されない場合
1. Supabase Functions のログを確認
2. 環境変数が正しく設定されているか確認
3. APIキーの権限を確認
4. 送信者メールアドレスがドメイン認証済みか確認

### Resendでメールが届かない場合
1. スパムフォルダを確認
2. Resendダッシュボードで配信状況を確認
3. 受信者のメールアドレスが正しいか確認

### Gmail SMTPでエラーが発生する場合
1. 2段階認証が有効になっているか確認
2. アプリパスワードを正しく生成したか確認
3. 「安全性の低いアプリのアクセス」設定を確認

## 費用について

### Resend
- 無料プラン: 月100通まで
- 有料プラン: $20/月で50,000通

### Gmail SMTP
- 無料（Googleアカウントが必要）
- 1日の送信制限: 500通

### その他のプロバイダー
- SendGrid: 月100通まで無料
- Mailgun: 月5,000通まで無料（初月のみ）

## 推奨設定

小規模〜中規模のチーム（月100人以下の招待）: **Resend無料プラン**
大規模なチーム: **Resend有料プラン** または **SendGrid**