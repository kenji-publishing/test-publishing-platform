# Publisher Platform - Project Guide

## Overview
多言語対応の出版プラットフォーム。作家・翻訳者・編集者・読者をつなぐWebアプリケーション。
ユーザー（kenji）はIT初心者。日本語で会話すること。

## Tech Stack
- **Frontend:** HTML, CSS (Bootstrap 5.3), vanilla JavaScript (フレームワーク不使用)
- **Backend:** Node.js + Express (backend/ ディレクトリ)
- **Database:** PostgreSQL
- **Payments:** Stripe
- **AI Translation:** Anthropic Claude API
- **Fonts:** Noto Sans JP / Noto Serif JP (Google Fonts)
- **Icons:** Font Awesome 6.4.0

## i18n (国際化) - 9言語対応
EN, JA, ZH, ES, FR, DE, KO, AR, PT

### 2つのパターン
- **Pattern A** (`data-i18n` 属性 + 外部 `js/lang/*.js` ファイル): index.html, login, register 等で使用
- **Pattern C** (インライン `uiText` オブジェクト + `getL()` 関数): dashboard, upload, support 等で使用。各ページの `<script>` 内に9言語分のテキストを直接記述

### navbar.js グローバル関数
`js/navbar.js` が全ページ共通のナビバー機能を提供:
- `getCurrentLanguage()` - 現在の言語コード取得
- `getL(obj)` - 多言語オブジェクトから現在言語の値を取得
- `toggleUserDropdown(e)` - ユーザードロップダウン切替
- `handleLogout()` - ログアウト処理
- `loadUserInfo()` - ユーザー情報読込・表示
- `updateNavText()` - ナビバーテキスト更新

## Revenue Distribution (収益分配)
- Author: 40% / Translator: 20% / Editor: 10% / Platform: 30%

## Project Structure
```
test-publishing-platform/
├── index.html              # ランディングページ (Pattern A)
├── favicon.svg             # ブランドカラー #8B7355 白セリフ "P"
├── css/
│   ├── style-new.css       # メインスタイル
│   ├── navbar.css          # ナビバー共通CSS
│   └── mobile-fixes.css    # モバイル修正
├── js/
│   ├── navbar.js           # ナビバー共通JS (Pattern C)
│   ├── lang/               # 翻訳ファイル (9言語)
│   └── ...
├── pages/
│   ├── dashboard.html      # ダッシュボード (Analytics統合済)
│   ├── browse.html         # 作品ブラウズ
│   ├── library.html        # マイライブラリ
│   ├── my-works.html       # 自作品一覧
│   ├── profile.html        # プロフィール
│   ├── upload.html         # 作品アップロード
│   ├── editor.html         # エディター
│   ├── work-detail.html    # 作品詳細
│   ├── support/            # FAQ, トラブルシューティング, お問い合わせ, チケット
│   ├── feedback/           # フィードバック
│   ├── translators/        # 翻訳者向け
│   └── admin/              # 管理者向け
├── backend/
│   ├── server.js           # Express サーバー
│   ├── routes/             # API ルート (21ファイル)
│   ├── services/           # 通知サービス等
│   ├── middleware/         # 認証ミドルウェア
│   ├── migrations/         # SQL マイグレーション
│   └── config/             # DB, メール, 収益設定
└── services/
    └── emailService.js     # フロントエンドメールサービス
```

## Key Conventions
- 全ページに共通ナビバー (Pattern C HTML) + 統一フッター
- 各ページ固有のCSSはインライン `<style>` ブロックで記述 (navbar.css とは別)
- copyright: `&copy; 2025 Publisher`
- デモモード: バックエンド未接続時にダミーデータで動作
- RTL対応: アラビア語選択時に `dir="rtl"` を設定
- ユーザードロップダウンメニューに「My Works」リンクあり (menuMyWorks)
- Genres ページは削除済み (Browse で代替)
- Earnings ページは削除済み (Dashboard で代替)
- Analytics は Dashboard に統合済み

## Common Pitfalls
- ナビバーCSSを外部化する際、ページ固有CSSも消さないこと
- Pattern C ページで `}` の閉じ忘れ/余分な `}` に注意 (SyntaxError の原因)
- `menuMyWorks` の翻訳は全ページの uiText に含める必要あり
- ファイルによって uiText のパターンが異なる (`getL()`, `getNavL()`, `navGetL()` 等)
