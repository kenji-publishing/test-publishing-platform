# Publisher Platform 引き継ぎドキュメント

最終更新: 2025年12月6日

---

## ⚠️ 制作者へのメモ

**制作者はIT初心者です。**  
新しいChatで作業を引き継ぐ際は、以下の点を必ず守ってください：
- コマンドや手順は**ステップバイステップ**で説明
- 専門用語は**日本語で補足説明**を入れる
- 「〇〇を実行してください」だけでなく「どこで」「何を入力して」「どうなれば成功か」まで説明
- エラーが起きた場合の対処法も併せて説明

---

## 1. プロジェクト概要

### Publisher（パブリッシャー）とは

多言語オンライン出版プラットフォームです。  
作家、翻訳者、編集者、読者をつなぎ、世界中で作品を公開・販売できます。

### 対応言語（8言語）

日本語、英語、中国語、スペイン語、フランス語、ドイツ語、韓国語、アラビア語

### 収益分配モデル

| 役割 | 分配率 |
|------|--------|
| 著者 | 40〜70%（関与度による） |
| 翻訳者 | 20% |
| 編集者 | 10% |
| プラットフォーム | 30% |

### プロジェクトの目標

**低予算・少人数での運営**を実現するため、以下を自動化：
- FAQ・チケットによるサポート対応
- メール通知の自動送信
- セルフサービス機能（パスワードリセット、アカウント設定）
- 読者フィードバックによる品質管理（AIコストを抑える）

---

## 2. 技術スタック

### インストール済みソフトウェア

| ソフト | 用途 | バージョン |
|--------|------|----------|
| Node.js | サーバー実行環境 | v18以上推奨 |
| PostgreSQL | データベース | 16 |
| pgAdmin 4 | データベース管理ツール（GUI） | 最新版 |
| Git | バージョン管理 | 最新版 |
| VSCode | コードエディタ（推奨） | 最新版 |

### 使用技術

| 分類 | 技術 |
|------|------|
| バックエンド | Node.js / Express |
| データベース | PostgreSQL |
| フロントエンド | HTML / Bootstrap 5 / JavaScript |
| 決済 | Stripe / PayPal（テストモード） |
| AI翻訳 | Claude API（Anthropic） |

---

## 3. 接続しているMCPとAPI

### MCP（Model Context Protocol）

| MCP | 用途 |
|-----|------|
| GitHub MCP | GitHubリポジトリの操作（ファイル作成・更新） |

### 外部API

| API | 用途 | 備考 |
|-----|------|------|
| Stripe API | クレジットカード決済 | テストモード |
| PayPal API | PayPal決済 | テストモード |
| Claude API | AI翻訳 | 環境変数に設定必要 |

### 環境変数（backend/.env）

```
# データベース
DATABASE_URL=postgresql://postgres:password@localhost:5432/publisher_db

# Stripe（テストキー）
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# PayPal（サンドボックス）
PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx

# Claude API
ANTHROPIC_API_KEY=sk-ant-xxxxx

# サーバー
PORT=3000
BASE_URL=http://localhost:8000
```

---

## 4. ローカル環境情報

### ファイルパス

```
C:\Projects\test-publishing-platform\
```

### サーバーURL

| 用途 | URL |
|------|-----|
| フロントエンド | http://localhost:8000 |
| バックエンドAPI | http://localhost:3000/api/... |
| 管理画面 | http://localhost:8000/pages/admin/index.html |
| ユーザーダッシュボード | http://localhost:8000/pages/dashboard.html |
| 通知センター | http://localhost:8000/pages/notifications.html |

### GitHubリポジトリ

https://github.com/kenji-publishing/test-publishing-platform

---

## 5. テストユーザー

### ログイン情報

| 項目 | 値 |
|------|-----|
| メール | test@publisher.local |
| パスワード | Test1234 |

### テストユーザー作成方法（必要な場合）

1. PowerShellでハッシュを生成：
   ```powershell
   cd C:\Projects\test-publishing-platform
   node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('Test1234', 10));"
   ```

2. pgAdmin 4のQuery Toolで以下を実行（ハッシュを置き換え）：
   ```sql
   INSERT INTO users (
       user_id, email, password_hash, first_name, last_name,
       pen_name, verified, email_verified, account_status, created_at, updated_at
   ) VALUES (
       gen_random_uuid(), 'test@publisher.local', '生成したハッシュ',
       'Test', 'User', 'TestAuthor', true, true, 'active', NOW(), NOW()
   );
   ```

---

## 6. データベース重要情報

### ⚠️ 主キーの型（UUID）

SQLを作成・実行する際は以下に注意：

| テーブル | 主キー | 型 |
|----------|--------|-----|
| users | user_id | UUID |
| works | work_id | UUID |
| notifications | notification_id | UUID |

**外部キーを設定する際は必ず UUID 型を使用してください。**

### データベース接続情報

- **ホスト**: localhost
- **ポート**: 5432
- **データベース名**: publisher_db
- **ユーザー**: postgres
- **パスワード**: （設定されていない可能性あり）

### SQLマイグレーション実行方法

1. pgAdmin 4 を開く
2. publisher_db を右クリック → 「Query Tool」
3. SQLファイルの内容をコピー&ペースト
4. ▶️（実行）ボタンをクリック
5. 成功メッセージを確認

---

## 7. フォルダ構造

```
test-publishing-platform/
├── backend/
│   ├── server.js          # メインサーバー
│   ├── config/
│   │   ├── db.js          # DB接続設定
│   │   └── email.js       # メールテンプレート
│   ├── routes/            # APIエンドポイント
│   │   ├── admin.js
│   │   ├── ai-translation.js
│   │   ├── auth.js
│   │   ├── auth-magic.js
│   │   ├── dmca.js
│   │   ├── finance.js
│   │   ├── moderation.js
│   │   ├── notifications.js  # ★Phase 9A/9C
│   │   ├── reader-feedback.js
│   │   ├── support.js
│   │   ├── translator-marketplace.js
│   │   ├── users.js
│   │   ├── verification.js
│   │   ├── works.js
│   │   └── ...
│   ├── services/          # ★Phase 9C新規
│   │   ├── notificationService.js      # 通知ヘルパー関数
│   │   └── notificationIntegration.js  # 統合ガイド
│   └── migrations/        # DBマイグレーション
│       ├── 011_notification_center.sql  # ★Phase 9A
│       └── ...
├── pages/
│   ├── admin/             # 管理者画面
│   ├── support/           # サポート画面
│   ├── feedback/          # 読者フィードバック
│   ├── translators/       # 翻訳者マーケット
│   ├── dev/               # 開発用ツール
│   ├── account-settings.html  # ★Phase 9Bバッジ追加
│   ├── dashboard.html         # ★Phase 9Bバッジ追加
│   ├── notifications.html     # ★Phase 9A
│   ├── translation-status.html # ★Phase 9Bバッジ追加
│   ├── upload-work.html       # ★Phase 9Bバッジ追加
│   └── ...
├── js/
│   ├── notification-badge.js      # ★Phase 9A（手動挿入用）
│   └── header-notification.js     # ★Phase 9B（自動挿入用）
├── css/
│   └── style-new.css      # 共通スタイル
└── index.html             # トップページ
```

---

## 8. 完了済みフェーズ

| Phase | 内容 | 状態 |
|-------|------|:----:|
| 1 | 基本セットアップ | ✅ |
| 2 | ユーザー認証（登録・ログイン・パスワードリセット） | ✅ |
| 3 | 作品管理（アップロード・編集・公開） | ✅ |
| 4 | 決済システム（Stripe/PayPal） | ✅ |
| 5 | AI翻訳（Claude API） | ✅ |
| 6 | 管理者ダッシュボード | ✅ |
| 6a | DMCA Manager（著作権侵害対応） | ✅ |
| 6b | 本人確認システム | ✅ |
| 6c | コンテンツモデレーション | ✅ |
| 6d | 財務レポート | ✅ |
| 7a | 翻訳キュー | ✅ |
| 7b | 翻訳者マーケットプレイス | ✅ |
| 7c | 読者フィードバック | ✅ |
| **8** | **サポートシステム（全5段階）** | ✅ |
| 8A | FAQ・チケットシステム（35項目） | ✅ |
| 8B | トラブルシューティングウィザード | ✅ |
| 8C | 条件付きお問い合わせ表示 | ✅ |
| 8D | セルフサービス機能（アカウント設定） | ✅ |
| 8E | 自動メール応答（6種類のテンプレート） | ✅ |
| **9A** | **通知センター - データベース・API・UI** | ✅ |
| **9B** | **通知バッジ - 4ページへの統合** | ✅ |
| **9C** | **自動通知生成 - ヘルパー関数・デモ機能** | ✅ |

---

## 9. Phase 9 通知センター詳細

### Phase 9A: 通知センター基盤 ✅

| ファイル | 説明 |
|----------|------|
| `backend/migrations/011_notification_center.sql` | 通知テーブル（notifications, notification_preferences） |
| `backend/routes/notifications.js` | 通知API（取得・既読化・設定） |
| `pages/notifications.html` | 通知一覧ページ（デモモード対応） |
| `js/notification-badge.js` | ヘッダーバッジ更新用コンポーネント（手動挿入） |

### Phase 9B: 通知バッジ統合 ✅

| ファイル | 説明 |
|----------|------|
| `js/header-notification.js` | 自動挿入型通知ベルコンポーネント |

**バッジ追加済みページ（4ページ）:**

| ページ | 実装方法 |
|--------|----------|
| dashboard.html | 手動バッジ + notification-badge.js |
| upload-work.html | 手動バッジ + notification-badge.js |
| translation-status.html | header-notification.js（自動挿入） |
| account-settings.html | header-notification.js（自動挿入） |

### Phase 9C: 自動通知生成 ✅

| ファイル | 説明 |
|----------|------|
| `backend/services/notificationService.js` | 通知ヘルパー関数（8種類） |
| `backend/services/notificationIntegration.js` | 既存ルートへの統合ガイド |

**通知ヘルパー関数:**

| 関数 | 用途 |
|------|------|
| `notifySale()` | 売上通知 |
| `notifyTranslationComplete()` | 翻訳完了通知 |
| `notifyTranslationRequest()` | 翻訳依頼通知 |
| `notifyComment()` | コメント通知 |
| `notifyFeedback()` | フィードバック通知 |
| `notifyTicketReply()` | チケット返信通知 |
| `notifySystem()` | システム通知 |
| `notifyAccount()` | アカウント通知 |

---

## 10. 通知API エンドポイント

### 基本API

| メソッド | URL | 説明 |
|----------|-----|------|
| GET | /api/notifications | 通知一覧取得 |
| GET | /api/notifications/unread-count | 未読件数取得 |
| PUT | /api/notifications/:id/read | 既読にする |
| PUT | /api/notifications/read-all | すべて既読 |
| DELETE | /api/notifications/:id | 通知削除 |
| DELETE | /api/notifications/clear-all | 一括削除 |

### 設定API

| メソッド | URL | 説明 |
|----------|-----|------|
| GET | /api/notifications/preferences | 通知設定取得 |
| PUT | /api/notifications/preferences | 通知設定更新 |
| GET | /api/notifications/types | 通知タイプ一覧 |

### デモ・テストAPI ★Phase 9C

| メソッド | URL | 説明 |
|----------|-----|------|
| POST | /api/notifications/demo/generate-all | 全タイプのデモ通知を一括生成（9件） |
| POST | /api/notifications/demo/generate | 指定タイプのデモ通知を生成 |
| POST | /api/notifications/test | 単一テスト通知作成 |

### 通知タイプ

| タイプ | アイコン | 説明 |
|--------|---------|------|
| sale | 💰 | 作品購入通知 |
| translation_complete | 🌐 | 翻訳完了 |
| translation_request | 📤 | 翻訳依頼 |
| comment | 💬 | コメント |
| feedback | ⭐ | 読者フィードバック |
| system | 🔔 | システム通知 |
| ticket_reply | 🎧 | サポート返信 |
| account | 👤 | アカウント関連 |

---

## 11. デモ通知の生成方法

### 方法1: ブラウザコンソールから

1. ログイン後、任意のページで開発者ツールを開く（F12）
2. Consoleタブで `allow pasting` と入力してEnter
3. 以下を貼り付けてEnter:

```javascript
fetch('http://localhost:3000/api/notifications/demo/generate-all', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(data => console.log(data))
```

4. `{success: true, count: 9, ...}` と表示されれば成功
5. 通知ページ（notifications.html）で確認

### 方法2: デモモード（ログイン不要）

URL: `http://localhost:8000/pages/notifications.html?demo=true`

ダミーデータで通知UIを確認できます。

---

## 12. 今後の開発予定

| Phase | 内容 | 概要 |
|-------|------|------|
| **9D** | **通知設定ページ** | account-settings.html内に通知設定タブ追加 |
| 9E | 残りページへのバッジ追加 | my-works, earnings, editor等 |
| 10 | Analytics | アクセス解析・レポート |
| 11 | Mobile Optimization | モバイル最適化 |
| 12 | Production Deploy | 本番環境デプロイ |

---

## 13. サーバー起動方法

### 手順

1. **PowerShellを開く**
   - Windowsキー → 「PowerShell」と入力 → Enter

2. **プロジェクトフォルダに移動**
   ```
   cd C:\Projects\test-publishing-platform
   ```

3. **サーバーを起動**
   ```
   npm start
   ```

4. **成功確認**
   以下のメッセージが表示されればOK：
   ```
   Server running on port 3000
   Frontend server running on port 8000
   ```

5. **ブラウザでアクセス**
   - フロントエンド: http://localhost:8000
   - ログイン: http://localhost:8000/pages/login.html

### サーバー停止方法

PowerShellで `Ctrl + C` を押す

---

## 14. GitHubからの更新取得方法

### 手順

1. **PowerShellを開く**

2. **プロジェクトフォルダに移動**
   ```
   cd C:\Projects\test-publishing-platform
   ```

3. **最新コードを取得**
   ```
   git pull
   ```

4. **サーバーを再起動**
   ```
   npm start
   ```

---

## 15. 注意事項

### フロントエンドとバックエンドのポート

| 用途 | ポート | 備考 |
|------|--------|------|
| フロントエンド | 8000 | HTMLページの配信 |
| バックエンドAPI | 3000 | APIリクエストの処理 |

**APIを直接呼ぶ場合は `localhost:3000` を使用してください。**

### データベーススキーマの違い

当初の設計と実際のテーブル構造に差異があります：
- `work_type` → `content_type`
- `is_premium` → `is_free`
- `role` カラムは users テーブルに存在しない

### 決済はテストモード

本番環境では本番キーへの切り替えが必要です。

### AI翻訳チェック機能

現在は**未実装**（コスト削減のため）。  
資金に余裕ができてから追加可能。

### FAQ内の[要更新]マーカー

FAQデータの一部に `[要更新]` マーカーが含まれています。  
本番公開前に具体的な数値やURLに置き換えてください。

---

## 16. 新しいChatでの開始方法

1. このドキュメントの内容をClaudeに共有（またはアップロード）
2. 「Phase 9Dから続けてください」と伝える
3. 必要に応じて `git pull` で最新コードを取得
4. サーバーを起動して動作確認

---

## 17. 参考リンク

| 項目 | URL |
|------|-----|
| GitHubリポジトリ | https://github.com/kenji-publishing/test-publishing-platform |
| 管理画面 | http://localhost:8000/pages/admin/index.html |
| ユーザー画面 | http://localhost:8000/pages/dashboard.html |
| **通知センター** | **http://localhost:8000/pages/notifications.html** |
| 通知センター（デモ） | http://localhost:8000/pages/notifications.html?demo=true |
| FAQページ | http://localhost:8000/pages/support/faq.html |
| トラブルシューティング | http://localhost:8000/pages/support/troubleshoot.html |
| アカウント設定 | http://localhost:8000/pages/account-settings.html |
| メールプレビュー（開発用） | http://localhost:8000/pages/dev/email-preview.html |

---

最終更新: 2025年12月6日
