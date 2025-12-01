# Publisher Platform - プロジェクト引き継ぎドキュメント

作成日: 2025年12月1日
最終更新: 2025年12月1日

---

## 1. プロジェクト概要

### Publisherとは
多言語オンライン出版プラットフォーム。著者、翻訳者、編集者、読者をつなぎ、新しい才能の発掘に焦点を当てています。日本語マンガが主要な収益源として期待されています。

### 収益分配モデル
- **著者**: 40-70%（パフォーマンスに応じて変動）
- **翻訳者**: 20%
- **編集者**: 10%
- **プラットフォーム**: 30%

### 対応言語（8言語）
日本語、英語、中国語、スペイン語、フランス語、ドイツ語、韓国語、アラビア語

---

## 2. 技術スタック

### バックエンド
- **Node.js** + **Express.js**
- **PostgreSQL 17** - データベース
- **JWT** - 認証

### フロントエンド
- **HTML/CSS/JavaScript**
- **Bootstrap 5** - UIフレームワーク
- **Bootstrap Icons** - アイコン

### 外部API
- **Stripe** - 決済処理
- **PayPal** - 決済処理
- **OpenAI API** - コンテンツモデレーション
- **Claude API (Anthropic)** - AI翻訳サービス

---

## 3. ローカル環境

### インストール済みソフトウェア
- **Node.js** - JavaScriptランタイム
- **PostgreSQL 17** - データベース
- **pgAdmin 4** - PostgreSQL GUI管理ツール
- **Git** - バージョン管理
- **Visual Studio Code** (推定) - コードエディタ

### プロジェクトパス
```
C:\Projects\test-publishing-platform\
```

### GitHubリポジトリ
```
https://github.com/kenji-publishing/test-publishing-platform
```

### ローカルサーバー
- **バックエンドAPI**: http://localhost:3000
- **フロントエンド**: http://localhost:8000

### データベース接続
- **ホスト**: localhost
- **ポート**: 5432
- **データベース名**: publisher_platform
- **ユーザー**: postgres

---

## 4. MCP (Model Context Protocol) 接続

Claude Desktopに以下のMCPが設定されています：

1. **GitHub MCP** - GitHubリポジトリの操作
2. **Filesystem MCP** - ローカルファイルシステムへのアクセス

---

## 5. フォルダ構造

```
C:\Projects\test-publishing-platform\
├── backend/
│   ├── config/
│   │   └── database.js          # DB接続設定
│   ├── routes/
│   │   ├── admin.js             # 管理者API
│   │   ├── auth.js              # 認証API
│   │   ├── auth-magic.js        # マジックリンク認証
│   │   ├── dmca.js              # DMCA API ★新規
│   │   ├── finance.js           # 財務API
│   │   ├── moderation.js        # コンテンツ審査API
│   │   ├── notifications.js     # 通知API
│   │   ├── payments.js          # 決済API
│   │   ├── users.js             # ユーザーAPI
│   │   ├── verification.js      # 本人確認API
│   │   └── works.js             # 作品API
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_notification_settings.sql
│   │   ├── 003_add_interactions.sql
│   │   ├── 004_add_user_preferences.sql
│   │   ├── 005_verification_requests.sql
│   │   ├── 006_dmca_reports.sql  # DMCA ★新規
│   │   └── test_works_data.sql  # テストデータ
│   ├── server.js                # メインサーバー
│   └── .env                     # 環境変数
├── pages/
│   ├── admin/
│   │   └── index.html           # 管理ダッシュボード ★更新
│   ├── author/                  # 著者用ページ
│   ├── legal/                   # 法的ページ
│   ├── dashboard.html           # ユーザーダッシュボード
│   ├── login.html               # ログイン
│   ├── register.html            # 登録
│   ├── works.html               # 作品一覧
│   └── ...
├── css/
│   └── style-new.css            # メインスタイル
├── js/
│   ├── main.js
│   └── i18n.js                  # 多言語対応
└── locales/                     # 翻訳ファイル
    ├── ja.json
    ├── en.json
    └── ...
```

---

## 6. データベーステーブル

### 主要テーブル
| テーブル名 | 説明 |
|-----------|------|
| users | ユーザー情報 |
| works | 作品情報 |
| chapters | 章（チャプター） |
| transactions | 取引履歴 |
| payouts | 支払い履歴 |
| earnings | 収益記録 |
| verification_requests | 本人確認申請 |
| notifications | 通知 |
| dmca_reports | DMCA報告 ★新規 |
| dmca_actions | DMCA対応履歴 ★新規 |
| dmca_counter_notices | 異議申立 ★新規 |

### worksテーブルの重要なカラム
- `content_type`: ENUM ('text', 'manga', 'art')
- `status`: ENUM ('draft', 'published', 'archived', 'suspended')
- `is_free`: boolean（無料かどうか）
- `language`: 言語コード
- `original_language`: 原語

### テストユーザー
| メール | 役割 | ペンネーム |
|--------|------|-----------|
| author@publisher.com | 著者 | J.A. Writer |
| translator@publisher.com | 翻訳者 | - |
| editor@publisher.com | 編集者 | - |

### テスト作品
| タイトル | タイプ | ステータス |
|---------|--------|-----------|
| 月光の剣士 | text | draft |
| Tokyo Dreams | text | published |
| 星空のメロディ | manga | draft |

---

## 7. 管理ダッシュボード機能

### Phase 1: ダッシュボード基盤 ✅
- 統計表示（ユーザー数、作品数、収益、タスク）
- 最近のアクティビティ
- クイックアクション
- システム状態表示

### Phase 2: ユーザー管理 ✅
- ユーザー一覧表示
- 検索・フィルター
- ユーザー詳細モーダル
- ステータス変更（アクティブ/停止/BAN）

### Phase 3: 本人確認審査 ✅
- 申請一覧表示
- 統計表示（保留中/承認済/却下）
- 承認・却下機能
- 申請詳細モーダル

### Phase 4: コンテンツ審査 ✅
- 作品一覧表示
- ステータス別フィルター（下書き/公開中/停止）
- タイプ別フィルター（テキスト/マンガ/アート）
- 公開・停止・下書き戻し機能
- 作品詳細モーダル（章一覧含む）

### Phase 5: 財務・支払い管理 ✅
- 収益レポート（総収益/今月/今週）
- 収益分配モデル表示
- 売上トップ作品
- 支払い一覧・処理・キャンセル

### Phase 6: DMCA Manager ✅ 【新規完了】
- 著作権侵害報告の一覧表示
- 統計表示（新規/審査中/対応済/却下/異議申立）
- 優先度フィルター（緊急/高/通常/低）
- 検索機能
- ステータス変更（審査開始/コンテンツ削除/却下）
- 報告詳細モーダル（法的宣言、異議申立、対応履歴）
- アクションノート追加機能
- 優先度変更機能
- コンテンツ削除実行（作品の停止連動）

---

## 8. 残りの開発項目

### Phase 7: Translation Queue（翻訳キュー管理）
- 翻訳依頼一覧
- 翻訳者への割り当て
- 進捗管理
- 品質レビュー

### Phase 8: Support System（FAQ・チケット）
- FAQ管理（作成・編集・削除）
- サポートチケット一覧
- チケット対応・返信
- ステータス管理

### Phase 9: Notification Center（通知管理）
- システム通知の作成
- 対象ユーザー選択
- 送信履歴
- 通知テンプレート

---

## 9. サーバー起動方法

### バックエンド起動
```powershell
cd C:\Projects\test-publishing-platform\backend
node server.js
```

### フロントエンド（別のPowerShellウィンドウで）
```powershell
cd C:\Projects\test-publishing-platform
npx http-server -p 8000
```

### pgAdmin 4でSQL実行（マイグレーション）
1. pgAdmin 4を起動
2. Servers → PostgreSQL 17 → Databases → publisher_platform
3. 右クリック → Query Tool
4. `backend/migrations/006_dmca_reports.sql`の内容を貼り付けて▶ボタンで実行

---

## 10. GitHubワークフロー

### 最新コードを取得
```powershell
cd C:\Projects\test-publishing-platform
git pull
```

### 変更をプッシュ（Claude経由で行う場合が多い）
GitHub MCPを使用してファイルを直接更新

---

## 11. API エンドポイント一覧

### 認証
- POST /api/auth/register
- POST /api/auth/login

### 管理者
- GET /api/admin/stats
- GET /api/admin/users

### 本人確認
- GET /api/verification/admin/stats
- GET /api/verification/admin/requests
- PATCH /api/verification/admin/requests/:id/approve
- PATCH /api/verification/admin/requests/:id/reject

### コンテンツ審査
- GET /api/moderation/admin/stats
- GET /api/moderation/admin/works
- GET /api/moderation/admin/works/:id
- PATCH /api/moderation/admin/works/:id/approve
- PATCH /api/moderation/admin/works/:id/reject

### 財務
- GET /api/finance/admin/stats
- GET /api/finance/admin/payouts
- PATCH /api/finance/admin/payouts/:id/process
- PATCH /api/finance/admin/payouts/:id/cancel

### DMCA ★新規
- POST /api/dmca/submit（公開：報告提出）
- POST /api/dmca/counter-notice（公開：異議申立提出）
- GET /api/dmca/admin/stats
- GET /api/dmca/admin/reports
- GET /api/dmca/admin/reports/:id
- PATCH /api/dmca/admin/reports/:id/status
- PATCH /api/dmca/admin/reports/:id/priority
- POST /api/dmca/admin/reports/:id/action
- POST /api/dmca/admin/reports/:id/takedown
- PATCH /api/dmca/admin/reports/:id/reject

---

## 12. 注意事項

### データベーススキーマの違い
当初の設計と実際のテーブル構造に差異があります：
- `work_type` → `content_type`
- `is_premium` → `is_free`
- `pending_review` ステータスは存在しない（draft, published, archived, suspended のみ）

### PostgreSQL パスワード
Kenjiさんの環境ではパスワードが設定されていない可能性があります。pgAdmin 4でのGUI操作を推奨。

### Phase 6実行後の追加手順
1. `git pull`で最新コードを取得
2. pgAdmin 4で`006_dmca_reports.sql`を実行してテーブルを作成
3. バックエンドを再起動

---

## 13. 次回の開始方法

1. このドキュメントの内容をClaudeに共有
2. 「Phase 7: Translation Queueから続けてください」と伝える
3. 必要に応じてgit pullで最新コードを取得

---

## 14. 参考リンク

- **GitHubリポジトリ**: https://github.com/kenji-publishing/test-publishing-platform
- **管理画面**: http://localhost:8000/pages/admin/index.html
- **ユーザー画面**: http://localhost:8000/pages/dashboard.html

---

最終更新: 2025年12月1日
