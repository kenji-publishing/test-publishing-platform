# AuctLect Platform - Project Guide

## Overview
多言語対応の出版プラットフォーム。作家・翻訳者・編集者・読者をつなぐWebアプリケーション。
ユーザー（kenji）はIT初心者。日本語で会話すること。

- **サービス名: AuctLect**（旧名 Publisher。ドメイン取得不可のため2026年6月に改名）
- **運営会社: K's Publisher Ltd**（登記上の会社名はPublisherのまま。変更しないこと）
- バックエンド内部識別子（publisher_db, publisher-backend, デモ用@publisher.comメール等）は互換性のため旧名のまま

## Tech Stack
- **Frontend:** HTML, CSS (Bootstrap 5.3), vanilla JavaScript (フレームワーク不使用)
- **Backend:** Node.js + Express (backend/ ディレクトリ)
- **Database:** PostgreSQL
- **Payments:** Stripe + PayPal
- **AI Translation:** Anthropic Claude API
- **Fonts:** Noto Sans JP / Noto Serif JP (Google Fonts)
- **Icons:** Font Awesome 6.4.0

## i18n (国際化) - 10言語対応
EN, JA, ZH, ES, FR, DE, KO, AR, PT, IT

### 翻訳システム（大規模改修済み）
- **i18n.js** - 翻訳エンジン。`js/lang/*.json` から翻訳データを読み込み、`data-i18n` 属性で自動適用
- **js/lang/*.json** - 各言語の翻訳データ（10ファイル: en.json〜it.json）
- **js/lang/*.js** - フォールバック用翻訳データ（file://プロトコルでJSON読込不可時に使用）
- **navbar.js** - ナビバーとフッターを動的生成。ナビバー翻訳も内蔵
- 新言語追加: JSONファイル1つ + JSファイル1つ + i18n.js/navbar.jsに言語コード追加

### 削除済み（旧システム）
- ~~language-switcher.js~~ → i18n.js に置き換え
- ~~translations-base.js~~ → JSON に置き換え
- ~~header-notification.js~~ → Messages に統合
- ~~各ページのインラインuiTextナビバーキー~~ → navbar.js に統合

### 特殊なページ（lang-contentパターン）
Privacy Policy, Terms, Content Guidelines, Copyright Policy, Confirm Delete, Revenue Sharing は `data-lang` 属性のlang-contentブロックで各言語の全文を保持。`showLanguageContent()` + `languageChanged` イベントで切替。

### navbar.js グローバル関数
`js/navbar.js` が全ページ共通のナビバー・フッターを動的生成:
- `renderNavbar(options)` - ナビバーHTML生成（activePage指定可能）
- `renderFooter(options)` - フッターHTML生成
- `getCurrentLanguage()` - 現在の言語コード取得
- `getL(obj)` - 多言語オブジェクトから現在言語の値を取得
- `toggleUserDropdown(e)` - ユーザードロップダウン切替
- `handleLogout()` - ログアウト処理
- `loadUserInfo()` - ユーザー情報読込・表示
- `updateNavText()` - ナビバーテキスト更新
- `updateMessageBadge()` - 未読メッセージバッジ更新
- `detectPathPrefix()` - URLからパスプレフィックス自動判定

## Navbar構成
```
Browse | Library | Dashboard | Tools ▼ | Support ▼ | Messages
                                │           │
                                ├─ Upload Work
                                ├─ ──────────
                                ├─ Manga Translator
                                ├─ Manga Editor
                                ├─ Novel Translator
                                ├─ AI Editor
                                ├─ Translation Status
                                ├─ Find Translators
                                └─ Find Editors
                                            │
                                            ├─ FAQ
                                            └─ Troubleshooting
```
- Home、Contact、My Tickets は削除済み
- Upload は Tools ドロップダウン内に移動
- Messages はナビバー項目（通知タブ統合済み）
- ベルアイコンは削除済み（Messagesに統合）

## Revenue Distribution (収益分配)
| パターン | Author | Translator | Editor | Platform |
|---|---|---|---|---|
| 自国語・自分で編集 | 70% | - | - | 30% |
| 自国語・編集者あり | 60% | - | 10% | 30% |
| 多国語・翻訳者+編集者 | 40% | 20% | 10% | 30% |
| 多国語・AI翻訳 | 70% | - | - | 30% |

## CSS構成（大規模改修済み）
```
css/
├── variables.css      # 色・フォント・サイズの変数一元管理
├── style-new.css      # メインスタイル
├── components.css     # ボタン・カード・モーダル等の共通パーツ
├── navbar.css         # ナビバー・フッター共通CSS
└── mobile-fixes.css   # モバイル修正
```

## Project Structure
```
test-publishing-platform/
├── index.html              # ランディングページ
├── favicon.svg             # ブランドカラー #8B7355 白セリフ "A"
├── CLAUDE.md               # このファイル
├── css/
│   ├── variables.css       # CSS変数（色・フォント・サイズ）
│   ├── style-new.css       # メインスタイル
│   ├── components.css      # 共通コンポーネント
│   ├── navbar.css          # ナビバー・フッターCSS
│   └── mobile-fixes.css    # モバイル修正
├── js/
│   ├── navbar.js           # ナビバー・フッター動的生成 + 翻訳
│   ├── i18n.js             # 翻訳エンジン
│   └── lang/               # 翻訳ファイル (10言語 JSON+JS)
├── pages/
│   ├── dashboard.html      # ダッシュボード (Analytics+コラボレーション)
│   ├── browse.html         # 作品ブラウズ
│   ├── library.html        # マイライブラリ
│   ├── my-works.html       # 自作品一覧
│   ├── messages.html       # メッセージ + 通知タブ
│   ├── profile.html        # プロフィール
│   ├── upload.html         # 作品アップロード (価格設定+AI明記+コラボ指定)
│   ├── editor.html         # エディター
│   ├── work-detail.html    # 作品詳細 (翻訳/編集依頼ボタン)
│   ├── agreements.html     # 同意書 (3テンプレート+期限+進捗報告)
│   ├── manga-translator.html  # マンガ翻訳ウィザード
│   ├── manga-editor.html      # マンガエディター（テキスト編集）
│   ├── novel-translator.html  # 小説翻訳ウィザード
│   ├── ai-editor.html         # AI校正・校閲ウィザード
│   ├── notifications.html  # 通知センター（14種類）
│   ├── checkout.html       # 決済 (Stripe/PayPal)
│   ├── support/            # FAQ, トラブルシューティング
│   ├── feedback/           # フィードバック
│   ├── translators/        # 翻訳者一覧・登録
│   ├── editors/            # 編集者一覧
│   └── admin/              # 管理者向け
│   ├── login.html          # ログイン
│   ├── magic-login.html    # メールでログイン（パスワード不要）
│   ├── reset-password.html # パスワードの再設定（magic-loginとは別物）
│   ├── revenue-sharing.html # 収益分配の説明
│   ├── confirm-delete.html # 退会の最終確認
│   ├── support/            # FAQ, トラブルシューティング
│   ├── feedback/           # フィードバック
│   ├── translators/        # 翻訳者一覧・登録
│   ├── editors/            # 編集者一覧
│   └── admin/              # 管理者向け
├── backend/
│   ├── server.js           # Express サーバー
│   ├── routes/             # API ルート
│   │   └── ses-webhook.js  # SESの不達通知を受ける（署名検証あり）
│   ├── services/           # 通知・収益分配・OSS申告・SNS署名検証
│   ├── middleware/         # 認証ミドルウェア (authenticate/authorize)
│   ├── migrations/         # SQL マイグレーション
│   ├── scripts/
│   │   └── oss-return.js   # EU OSS 四半期申告用データの書き出し
│   └── config/             # DB, メール, 収益, VAT税率
│       └── vatRates.js     # VAT税率表。VAT_REGISTERED=false の間は常に0%
├── deploy/                 # 本番サーバーに置くもの
│   ├── nginx-auctlect.conf # 本体（certbotが443ブロックを追記済み。cpだけで上書きしない）
│   ├── nginx-hooks.conf    # hooks.auctlect.com（Cloudflareを通さないwebhook専用）
│   ├── backup-db.sh        # 日次バックアップ（毎日 02:30 UTC）
│   └── health-check.sh     # 健康診断（毎日 02:40 UTC・基準超過時のみ通知）
└── services/
    └── emailService.js     # フロントエンドメールサービス
```

## 運用の仕組み（本番で動いているもの）
| 何 | いつ | 通知先 |
|---|---|---|
| DBバックアップ（`backup-db.sh`） | 毎日 02:30 UTC | 失敗時のみ info@auctlect.com |
| 健康診断（`health-check.sh`） | 毎日 02:40 UTC | 基準超過時のみ |
| Lightsailスナップショット | 毎日 03:00 UTC | — |
| 月次の控えをkenjiさんのPCへ | 毎月1日 | 定期タスク |
| メール不達の検知 | 随時 | 管理者＋info@auctlect.com |

- **メールは 受信=Microsoft 365 / 送信=AWS SES**。`mail.auctlect.com` のDNSは送信用で、消すと通知が止まる
- **VATは現在未登録**。EU圏の購入は `checkEuSaleAllowed()` が機械的にブロック中
- 管理者アカウントは2つ（Google と Microsoft）。片方を失っても運営できるようにしてある

## Key Conventions
- ナビバー・フッターは navbar.js が動的生成（38ページ共通）
- 各ページは `<div id="navbar-container"></div>` と `<div id="footer-container"></div>` のみ記述
- 各ページ固有のCSSはインライン `<style>` ブロックで記述
- copyright: `&copy; 2025 AuctLect`
- デモモード: バックエンド未接続時にダミーデータで動作
- RTL対応: アラビア語選択時に `dir="rtl"` を設定
- 変更完了後は毎回 Git Commit + Push する

## アセットのキャッシュ（?v= バージョン付け）
CSS/JS/画像を更新したとき、読者のブラウザが古いファイルを使い続けないようにする仕組み。

**フロントエンドのファイル（HTML/CSS/JS/翻訳）を変更したら、コミット前に必ず実行:**
```
node tools/bump-assets.js          # 全HTMLの ?v= を今の日時に付け直す
node tools/bump-assets.js --check  # 付け忘れがないか確認（変更しない）
```
- HTML は常に no-cache、`?v=` 付きアセットは1年キャッシュ（nginx: `map $arg_v`）
- `?v=` 無しのリクエストは今までどおり毎回確認するので、付け忘れても固まらない
- 翻訳JSON（js/lang/*.json）はHTMLに書かれていないため、i18n.js が
  自分の script src に付いた `?v=` を読み取ってJSONにも引き継ぐ（`_assetVersion`）
- **i18n.js の `_detectBasePath()` は script src の文字列置換でパスを作る。**
  クエリを外さずに置換すると `js/lang/?v=...` になり全翻訳が壊れる（対策済み・削除しないこと）

## Common Pitfalls
- ナビバーの変更は navbar.js の1箇所のみ。各ページのHTMLを直接編集しないこと
- 新言語追加時、Privacy/Terms等のlang-contentページは手動でコンテンツブロック追加が必要
- i18n.js の languageChanged イベントの detail は `{ language: 'ja' }` 形式
- ページ固有の getL() が残っているページ（library, reader, my-works等）は削除しないこと
- **同じ文言が4か所にあることがある。1か所直しても読み込み順で古い方が勝つ。**
  ① ページ内の `uiText`（getL経由） ② `js/lang/*.json` ③ `js/lang/*.js`（フォールバック）
  ④ HTMLの `data-i18n` 既定値。文言を変えたら4つとも grep して揃えること
  （例: upload.html の `aiDisclosureDesc`）
- **`getL()` の値は `textContent` で入ることが多い。** `&mdash;` 等のHTML実体を書くと
  そのまま文字として表示される。実体ではなく実際の文字（—、’）を使うこと
- 言語の保存キーは **`preferredLanguage`**（`language` ではない）
- 古い language-switcher.js / translations-base.js は削除済み。復活させないこと
