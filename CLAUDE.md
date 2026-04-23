# Publisher Platform - Project Guide

## Overview
多言語対応の出版プラットフォーム。作家・翻訳者・編集者・読者をつなぐWebアプリケーション。
ユーザー（kenji）はIT初心者。日本語で会話すること。

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
                                ├─ Novel Translator
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
├── favicon.svg             # ブランドカラー #8B7355 白セリフ "P"
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
│   ├── novel-translator.html  # 小説翻訳ウィザード
│   ├── notifications.html  # 通知センター（14種類）
│   ├── checkout.html       # 決済 (Stripe/PayPal)
│   ├── support/            # FAQ, トラブルシューティング
│   ├── feedback/           # フィードバック
│   ├── translators/        # 翻訳者一覧・登録
│   ├── editors/            # 編集者一覧
│   └── admin/              # 管理者向け
├── backend/
│   ├── server.js           # Express サーバー
│   ├── routes/             # API ルート (21ファイル)
│   ├── services/           # 通知サービス等
│   ├── middleware/         # 認証ミドルウェア (authenticate/authorize)
│   ├── migrations/         # SQL マイグレーション
│   └── config/             # DB, メール, 収益設定
└── services/
    └── emailService.js     # フロントエンドメールサービス
```

## Key Conventions
- ナビバー・フッターは navbar.js が動的生成（38ページ共通）
- 各ページは `<div id="navbar-container"></div>` と `<div id="footer-container"></div>` のみ記述
- 各ページ固有のCSSはインライン `<style>` ブロックで記述
- copyright: `&copy; 2025 Publisher`
- デモモード: バックエンド未接続時にダミーデータで動作
- RTL対応: アラビア語選択時に `dir="rtl"` を設定
- 変更完了後は毎回 Git Commit + Push する

## Common Pitfalls
- ナビバーの変更は navbar.js の1箇所のみ。各ページのHTMLを直接編集しないこと
- 新言語追加時、Privacy/Terms等のlang-contentページは手動でコンテンツブロック追加が必要
- i18n.js の languageChanged イベントの detail は `{ language: 'ja' }` 形式
- ページ固有の getL() が残っているページ（library, reader, my-works等）は削除しないこと
- 古い language-switcher.js / translations-base.js は削除済み。復活させないこと
