# Publisher Platform 引き継ぎドキュメント

最終更新: 2025年12月5日

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
| API | http://localhost:8000/api/... |
| 管理画面 | http://localhost:8000/pages/admin/index.html |
| ユーザーダッシュボード | http://localhost:8000/pages/dashboard.html |
| 通知センター | http://localhost:8000/pages/notifications.html |

### GitHubリポジトリ

https://github.com/kenji-publishing/test-publishing-platform

---

## 5. データベース重要情報

### ⚠️ 主キーの型（UUID）

SQLを作成・実行する際は以下に注意：

| テーブル | 主キー | 型 |
|----------|--------|-----|
| users | user_id | UUID |
| works | work_id | UUID |
| notifications | notification_id | UUID |

**外部キーを設定する際は必ず UUID 型を使用してください。**

例：
```sql
-- ✅ 正しい
user_id UUID REFERENCES users(user_id)

-- ❌ 間違い（INTEGER型ではエラー）
user_id INTEGER REFERENCES users(user_id)
```

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

## 6. フォルダ構造

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
│   │   ├── notifications.js  # ★Phase 9A拡張
│   │   ├── reader-feedback.js
│   │   ├── support.js
│   │   ├── translator-marketplace.js
│   │   ├── users.js
│   │   ├── verification.js
│   │   ├── works.js
│   │   └── ...
│   └── migrations/        # DBマイグレーション
│       ├── 005_verification_requests.sql
│       ├── 006_dmca_reports.sql
│       ├── 007_translation_queue.sql
│       ├── 008_translator_marketplace.sql
│       ├── 009_reader_feedback.sql
│       ├── 010_support_system.sql
│       ├── 011_notification_center.sql  # ★Phase 9A新規
│       ├── phase8d_self_service.sql
│       └── phase8e_auto_response.sql
├── pages/
│   ├── admin/             # 管理者画面
│   ├── support/           # サポート画面
│   ├── feedback/          # 読者フィードバック
│   ├── translators/       # 翻訳者マーケット
│   ├── dev/               # 開発用ツール
│   ├── account-settings.html
│   ├── dashboard.html
│   ├── notifications.html  # ★Phase 9A新規
│   └── ...
├── js/
│   └── notification-badge.js  # ★Phase 9A新規
├── css/
│   └── style-new.css      # 共通スタイル
└── index.html             # トップページ
```

---

## 7. 完了済みフェーズ

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

---

## 8. Phase 9 通知センター詳細

### Phase 9A で作成したもの ✅

| ファイル | 説明 |
|----------|------|
| `backend/migrations/011_notification_center.sql` | 通知テーブル（notifications, notification_preferences） |
| `backend/routes/notifications.js` | 通知API（取得・既読化・設定） |
| `pages/notifications.html` | 通知一覧ページ |
| `js/notification-badge.js` | ヘッダーバッジ更新用共通コンポーネント |

### API エンドポイント

| メソッド | URL | 説明 |
|----------|-----|------|
| GET | /api/notifications | 通知一覧取得 |
| GET | /api/notifications/unread-count | 未読件数取得 |
| PUT | /api/notifications/:id/read | 既読にする |
| PUT | /api/notifications/read-all | すべて既読 |
| DELETE | /api/notifications/:id | 通知削除 |
| DELETE | /api/notifications/clear-all | 一括削除 |
| GET | /api/notifications/preferences | 通知設定取得 |
| PUT | /api/notifications/preferences | 通知設定更新 |
| POST | /api/notifications/create | 通知作成 |
| POST | /api/notifications/test | テスト通知作成 |

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

### デモモード

`?demo=true` をURLに追加するとログインなしでダミーデータ表示：
- http://localhost:8000/pages/notifications.html?demo=true

---

## 9. 今後の開発予定

| Phase | 内容 | 概要 |
|-------|------|------|
| **9B** | **ヘッダーバッジ統合** | **全ページで通知バッジを動的に更新** |
| 9C | 自動通知生成 | イベント発生時に自動で通知を作成 |
| 9D | 通知設定ページ | アカウント設定内に通知設定タブ追加 |
| 10 | Analytics | アクセス解析・レポート |
| 11 | Mobile Optimization | モバイル最適化 |
| 12 | Production Deploy | 本番環境デプロイ |

### Phase 9B 予定機能

- 全ページのヘッダーに `js/notification-badge.js` を読み込み
- 通知バッジのIDを統一（`notificationBadge`）
- 1分ごとに自動で未読数を更新

---

## 10. サーバー起動方法

### 手順

1. **PowerShellを開く**
   - Windowsキー → 「PowerShell」と入力 → Enter

2. **プロジェクトフォルダに移動**
   ```
   cd C:\Projects\test-publishing-platform\backend
   ```

3. **サーバーを起動**
   ```
   node server.js
   ```

4. **成功確認**
   以下のメッセージが表示されればOK：
   ```
   Server is running on port 8000
   PostgreSQL connected successfully
   ```

5. **ブラウザでアクセス**
   http://localhost:8000

### サーバー停止方法

PowerShellで `Ctrl + C` を押す

---

## 11. GitHubからの更新取得方法

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

4. **サーバーを再起動**（backendフォルダで）
   ```
   cd backend
   node server.js
   ```

---

## 12. 注意事項

### データベーススキーマの違い

当初の設計と実際のテーブル構造に差異があります：
- `work_type` → `content_type`
- `is_premium` → `is_free`
- `pending_review` ステータスは存在しない（draft, published, archived, suspended のみ）

### 決済はテストモード

本番環境では本番キーへの切り替えが必要です。

### AI翻訳チェック機能

現在は**未実装**（コスト削減のため）。  
資金に余裕ができてから追加可能。

### FAQ内の[要更新]マーカー

FAQデータの一部に `[要更新]` マーカーが含まれています。  
本番公開前に具体的な数値やURLに置き換えてください。

---

## 13. 新しいChatでの開始方法

1. このドキュメントの内容をClaudeに共有（またはアップロード）
2. 「Phase 9Bから続けてください」と伝える
3. 必要に応じて `git pull` で最新コードを取得
4. サーバーを起動して動作確認

---

## 14. 参考リンク

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

最終更新: 2025年12月5日
