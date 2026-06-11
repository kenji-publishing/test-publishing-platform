# AuctLect メール通知サービス

## 概要

ログアウト中のユーザーにも重要な通知をメールで届けるサービスです。  
9言語対応（英語、日本語、中国語、スペイン語、フランス語、ドイツ語、韓国語、アラビア語、ポルトガル語）

---

## セットアップ

### 1. パッケージインストール

```bash
npm install nodemailer --save
```

### 2. ファイル配置

`emailService.js` を以下に配置：
```
C:\Projects\test-publishing-platform\services\emailService.js
```

### 3. 環境変数設定

`.env` ファイルに以下を追加：

```env
# SMTP設定（Gmail例）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 送信元
SMTP_FROM=noreply@publisher.com

# サイトURL
SITE_URL=http://localhost:8000
```

> **Gmail使用時の注意**: Googleアカウントで「アプリパスワード」を生成してください。  
> 設定 → セキュリティ → 2段階認証 → アプリパスワード

---

## 使用方法

### 基本的なインポート

```javascript
const emailService = require('./services/emailService');
```

### 作品購入通知

```javascript
await emailService.sendSaleNotification(
    'author@example.com',  // 送信先
    'Magic Academy Adventure',  // 作品名
    '$9.80',  // 金額
    'ja'  // 言語
);
```

### 翻訳完了通知

```javascript
await emailService.sendTranslationCompleteNotification(
    'author@example.com',
    'Digital Dreams',  // 作品名
    'English',  // 翻訳言語
    'ja'
);
```

### フィードバック通知

```javascript
await emailService.sendFeedbackNotification(
    'author@example.com',
    'Starlight Symphony',  // 作品名
    '5',  // 評価
    'ja'
);
```

### コメント通知

```javascript
await emailService.sendCommentNotification(
    'author@example.com',
    'Digital Dreams',  // 作品名
    'ja'
);
```

### ウェルカムメール

```javascript
await emailService.sendWelcomeEmail(
    'newuser@example.com',
    'Kenji',  // ユーザー名
    'ja'
);
```

---

## 既存APIとの統合例

### 購入処理 (routes/purchase.js)

```javascript
const emailService = require('../services/emailService');

router.post('/purchase', async (req, res) => {
    try {
        // 購入処理...
        const purchase = await processPurchase(req.body);
        
        // 通知を作成
        await createNotification({
            user_id: purchase.author_id,
            notification_type: 'sale',
            params: { work: purchase.work_title, amount: purchase.author_earnings }
        });
        
        // メール通知を送信
        const author = await getUser(purchase.author_id);
        if (author.email_notifications_enabled) {
            await emailService.sendSaleNotification(
                author.email,
                purchase.work_title,
                `$${purchase.author_earnings}`,
                author.preferred_language || 'en'
            );
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### ユーザー登録 (routes/auth.js)

```javascript
const emailService = require('../services/emailService');

router.post('/register', async (req, res) => {
    try {
        // ユーザー登録処理...
        const user = await createUser(req.body);
        
        // ウェルカムメールを送信
        await emailService.sendWelcomeEmail(
            user.email,
            user.firstName || user.email,
            req.body.preferredLanguage || 'en'
        );
        
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

---

## 対応している通知タイプ

| タイプ | 関数 | 説明 |
|--------|------|------|
| `sale` | `sendSaleNotification()` | 作品購入 |
| `translation_complete` | `sendTranslationCompleteNotification()` | 翻訳完了 |
| `feedback` | `sendFeedbackNotification()` | 読者フィードバック |
| `comment` | `sendCommentNotification()` | 新しいコメント |
| `welcome` | `sendWelcomeEmail()` | ウェルカムメール |

---

## メール通知設定（ユーザー側）

ユーザーがメール通知のオン/オフを設定できるようにするため、  
`users` テーブルに以下のカラムを追加することをお勧めします：

```sql
ALTER TABLE users ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN preferred_language VARCHAR(5) DEFAULT 'en';
```

---

## テスト

```javascript
// テストスクリプト
const emailService = require('./services/emailService');

async function testEmail() {
    const result = await emailService.sendSaleNotification(
        'test@example.com',
        'テスト作品',
        '$10.00',
        'ja'
    );
    console.log(result);
}

testEmail();
```

---

## SMTPプロバイダー別設定

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Amazon SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
```

---

## 本番環境での注意

1. **レート制限**: 大量送信時はキューシステム（Bull, Agenda等）の導入を検討
2. **バウンス処理**: 無効なメールアドレスの処理を実装
3. **ログ記録**: 送信履歴をデータベースに保存
4. **SPF/DKIM設定**: メールの到達率向上のため設定を推奨
