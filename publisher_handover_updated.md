# Publisher Platform 引き継ぎドキュメント

最終更新: 2026年1月30日

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

多言語オンライン出版プラットフォーム「Publisher」の開発プロジェクトです。

| 項目 | 内容 |
|------|------|
| 対応言語 | 日本語、英語、中国語、スペイン語、フランス語、ドイツ語、韓国語、アラビア語、ポルトガル語（9言語） |
| 収益分配 | 著者40-70%、翻訳者20%、編集者10%、プラットフォーム30% |
| 目標 | 低予算・少人数での運営（FAQ・通知・セルフサービスの自動化） |

---

## 2. 環境情報

### ファイルパス
```
C:\Projects\test-publishing-platform
```

### サーバーURL

| 用途 | URL |
|------|-----|
| フロントエンド | http://localhost:8000 または http://127.0.0.1:5500 (Live Server) |
| バックエンドAPI | http://localhost:3000/api/... |
| 管理画面 | http://localhost:8000/pages/admin/index.html |

### GitHubリポジトリ
https://github.com/kenji-publishing/test-publishing-platform

### テストユーザー

| 項目 | 値 |
|------|-----|
| メール | test@publisher.local |
| パスワード | Test1234 |

---

## 3. 技術スタック

| 分類 | 技術 |
|------|------|
| バックエンド | Node.js / Express |
| データベース | PostgreSQL 16 |
| フロントエンド | HTML / Bootstrap 5 / JavaScript |
| 決済 | Stripe / PayPal（テストモード） |
| AI翻訳 | Claude API |
| 多言語対応 | js/lang/*.js / language-switcher.js（9言語） |

---

## 4. 開発進捗

### 完了済みフェーズ

| Phase | 内容 | 状態 |
|-------|------|:----:|
| 1-7 | 基本機能・認証・決済・AI翻訳・管理画面 | ✅ |
| 8 | サポートシステム（FAQ・チケット・自動メール） | ✅ |
| 9 | 通知センター | ✅ |
| 10 | アナリティクス | ✅ |
| 11 | モバイル最適化 | ✅ |
| 12 | 多言語対応（9言語）| 🔄 **進行中** |
| 13 | ナビバー・メニュー統一 | 🔄 **進行中** |

---

## 5. 今日の作業状況（2026-01-30）

### 🔧 faq.html のナビバー・メニュー修正（完了）

contact.htmlを参考に、faq.htmlに以下の5つの項目を適用：

| 項目 | 内容 | 状態 |
|------|------|:----:|
| ナビバー構造 | パターンCに合ったメニュー項目 | ✅ 完了 |
| ハンバーガーメニュー | モバイル時の展開メニュー内容 | ✅ 完了 |
| 言語セレクター位置 | PC/モバイルで適切な位置に配置 | ✅ 完了 |
| ユーザードロップダウン | アカウントマークとメニュー表示 | ✅ 完了 |
| 翻訳機能 | 言語切替で全要素が翻訳される | ✅ 完了 |

### 追加修正

| 問題 | 対応内容 | 状態 |
|------|----------|:----:|
| Browseが2つ表示 | PC/モバイルでBrowseを1つに統合 | ✅ 完了 |
| PC/モバイルメニュー不一致 | PC画面のナビバーとハンバーガーメニューを統一 | ✅ 完了 |
| モバイルメニュースクロール | position: fixed + max-height: 70vh で対応済み | ✅ 完了 |

### PC画面（ログアウト時）の表示項目
```
Browse | Support▼（FAQ, Troubleshooting, Contact） | Home | Sign In
```

### PC画面（ログイン時）の表示項目
```
Browse | Library | Dashboard | Upload | Translation Tools▼ | Support▼ | Home | [ユーザーアイコン]
```

**修正ファイル:** `pages/support/faq.html`（ローカル保存済み）

---

## 5-2. 前回の作業状況（2026-01-28）

### 🔧 tickets.html の修正（完了）

| 問題 | 内容 | 状態 |
|------|------|:----:|
| アカウントマークがない | library.htmlと同様のユーザーメニューを追加 | ✅ 修正済 |
| PC表示 | ナビバー右側にユーザーアイコン＋名前＋ドロップダウン | ✅ 修正済 |
| モバイル表示 | 丸いユーザーアイコンボタンを追加 | ✅ 修正済 |
| ハンバーガーメニュー | library.htmlと統一（Browse/Library/Dashboard/FAQ） | ✅ 修正済 |
| 多言語対応 | メニュー項目も9言語対応 | ✅ 修正済 |
| オーバーレイ問題 | ナビバーの下から（top: 56px） | ✅ 修正済 |

**修正ファイル:** `pages/support/tickets.html`

### 📋 ナビバー・メニュー設計書の作成

全48ページを5つのパターン＋シンプル版に分類した設計書を作成しました。

**作成ファイル:** `navbar-menu-design-v2.md`

---

## 6. 次回の作業（2026-01-31）

### 🎯 残りのサポートページに5項目＋統一を適用

faq.htmlと同様に、以下のページを修正：

| ページ | パターン | 状態 |
|--------|:--------:|:----:|
| contact.html | C | 📋 参考元（完了済み） |
| faq.html | C | ✅ 完了 |
| tickets.html | C | 📋 要確認 |
| troubleshoot.html | C | 📋 予定 |

### 🎯 各ページで確認する7項目

1. **ナビバー構造** - パターンに合ったメニュー項目があるか
2. **ハンバーガーメニュー** - モバイル時の展開メニュー内容
3. **言語セレクター位置** - PC/モバイルで適切な位置
4. **ユーザードロップダウン** - アカウントマークとメニュー
5. **翻訳機能** - 言語切替で全要素が翻訳されるか
6. **PC/モバイル統一** - PC画面とハンバーガーメニューの項目を統一
7. **モバイルスクロール** - ハンバーガーメニューがスクロール可能か

### 🎯 その後、メニュー設計に基づいて各ページを更新

優先順位：
1. **dashboard.html** → パターンBの基準を作成
2. **index.html** → パターンDの基準を作成
3. **browse.html** → パターンA適用

---

## 7. ナビバー・メニュー設計（5パターン＋シンプル版）

### パターン一覧

| パターン | 対象ユーザー | ページ数 | 主な特徴 |
|:--------:|-------------|:--------:|----------|
| **A** | 読者向け | 7 | Browse/Library中心、Feedbackあり |
| **B** | クリエイター向け | 12 | Dashboard/Analytics/翻訳ツール |
| **C** | サポートページ | 4 | A+Bへのアクセス可能 |
| **D** | 未ログイン | 8 | Sign In/Up、FAQへのアクセス |
| **E** | 管理画面 | 4 | Admin専用 |
| **S** | シンプル版 | 6 | 読書・編集に集中（最小限メニュー） |

### パターンA: 読者向け

**対象:** browse, library, checkout, notifications, account-settings, feedback/*

```
ナビバー: [Logo] | Browse | Library | [🔔] | [🌐] | [👤▼]

ハンバーガー:
├ Browse / Library
├ Upload Work / Dashboard  ← クリエイターへの入口
├ Feedback  ← 翻訳問題報告
└ FAQ / Contact

ユーザーメニュー:
├ Account Settings
├ Creator Dashboard
└ Log Out
```

### パターンB: クリエイター向け

**対象:** dashboard, upload, upload-work, analytics, manga-translator, translation-status, translators/*, register-*

```
ナビバー: [Logo] | Dashboard | My Works | Analytics | [🔔] | [🌐] | [👤▼]

ハンバーガー:
├ Dashboard / My Works / Analytics / Upload
├ Translation Tools (Manga Translator, Translation Status, Find Translators)
├ Browse / Library  ← 読者機能への入口
└ FAQ / Contact

ユーザーメニュー:
├ Account Settings
├ My Library
└ Log Out
```

### パターンC: サポートページ

**対象:** faq, contact, tickets, troubleshoot

```
ナビバー: [Logo] | Browse | Library | Dashboard | [🔔] | [🌐] | [👤▼]

ハンバーガー:
├ Browse / Library  ← パターンAへ
├ Dashboard / Upload  ← パターンBへ
├ FAQ / Contact / My Tickets / Troubleshooting
└ Home
```

### パターンD: 未ログイン

**対象:** index, login, register, terms, privacy, content-guidelines, copyright-policy, revenue-sharing

```
ナビバー: [Logo] | Browse | Features | About | [🌐] | [Sign In] [Sign Up]

ハンバーガー:
├ Browse / Features / About
├ FAQ / Contact  ← サポートへのアクセス
├ Terms / Privacy
└ Sign In / Sign Up
```

### パターンE: 管理画面

**対象:** admin/*

```
ナビバー: [Logo] [ADMIN] | Dashboard | Users | Content | Support | [🌐] | [👤▼]
```

### パターンS: シンプル版

**対象:** reader, manga-viewer, editor, payment-success, payment-cancel, confirm-delete

```
ナビバー: [← 戻る] | [タイトル] | [🌐] | [👤]
```
- フルスクリーン表示を優先
- メニュー項目は最小限

---

## 8. ページ別パターン割り当て（全48ページ）

### 読者向け（パターンA）- 7ページ
| ページ | 状態 |
|--------|:----:|
| library.html | ✅ 完了 |
| browse.html | 🔜 次回 |
| checkout.html | 📋 予定 |
| notifications.html | 📋 予定 |
| account-settings.html | 📋 予定 |
| feedback/index.html | 📋 予定 |
| feedback/report.html | 📋 予定 |

### クリエイター向け（パターンB）- 12ページ
| ページ | 状態 |
|--------|:----:|
| dashboard.html | 🔜 次回 |
| upload.html | ✅ 完了 |
| upload-work.html | 📋 予定 |
| analytics.html | 📋 予定 |
| manga-translator.html | 📋 予定 |
| translation-status.html | 📋 予定 |
| translators/index.html | 📋 予定 |
| translators/register.html | 📋 予定 |
| register-author.html | 📋 予定 |
| register-editor.html | 📋 予定 |
| register-translator.html | 📋 予定 |
| editor.html | 📋 予定（パターンS） |

### サポートページ（パターンC）- 4ページ
| ページ | 状態 |
|--------|:----:|
| contact.html | ✅ 完了（参考元） |
| faq.html | ✅ 完了 |
| tickets.html | 📋 要確認 |
| troubleshoot.html | 📋 予定 |

### 未ログイン（パターンD）- 8ページ
| ページ | 状態 |
|--------|:----:|
| index.html | 🔜 次回 |
| login.html | 📋 予定 |
| register.html | 📋 予定 |
| terms.html | 📋 予定 |
| privacy.html | 📋 予定 |
| content-guidelines.html | 📋 予定 |
| copyright-policy.html | 📋 予定 |
| revenue-sharing.html | 📋 予定 |

### 管理画面（パターンE）- 4ページ
| ページ | 状態 |
|--------|:----:|
| admin/index.html | 📋 別途対応 |
| admin/analytics.html | 📋 別途対応 |
| admin/feedback.html | 📋 別途対応 |
| admin/support.html | 📋 別途対応 |

### シンプル版（パターンS）- 6ページ
| ページ | 状態 |
|--------|:----:|
| reader.html | 📋 予定 |
| manga-viewer.html | 📋 予定 |
| editor.html | 📋 予定 |
| payment-success.html | 📋 予定 |
| payment-cancel.html | 📋 予定 |
| confirm-delete.html | 📋 予定 |

---

## 9. アカウントマーク対応状況

| ページ | アカウントマーク | オーバーレイ修正 | 状態 |
|--------|:---------------:|:---------------:|:----:|
| library.html | ✅ | ✅ | ✅ 完了 |
| upload.html | ✅ | ✅ | ✅ 完了 |
| contact.html | ✅ | ✅ | ✅ 完了（参考元） |
| faq.html | ✅ | ✅ | ✅ 完了 |
| tickets.html | ✅ | ✅ | 📋 要確認 |
| その他ページ | ❌ | - | 📋 要対応 |

---

## 10. 今日作成・修正したファイル一覧（2026-01-30）

| ファイル | 状態 | 保存先 |
|----------|:----:|--------|
| faq.html | 修正完了 | `C:\Projects\test-publishing-platform\pages\support\faq.html` |
| publisher_handover_updated.md | 更新 | ダウンロード |
| navbar-menu-design-v2.md | 更新 | ダウンロード |

### 前回（2026-01-28）

| ファイル | 状態 | 保存先 |
|----------|:----:|--------|
| tickets.html | 修正済み | `C:\Projects\test-publishing-platform\pages\support\tickets.html` |
| navbar-menu-design-v2.md | 新規作成 | ダウンロード済み |

**注意:** ローカル保存のみ。GitHubへのプッシュは未実施。

---

## 11. 対応言語（9言語）

| コード | 言語 | フラグ | RTL |
|--------|------|--------|:---:|
| ja | 日本語 | 🇯🇵 | - |
| en | English | 🇬🇧 | - |
| zh | 中文 | 🇨🇳 | - |
| es | Español | 🇪🇸 | - |
| fr | Français | 🇫🇷 | - |
| de | Deutsch | 🇩🇪 | - |
| ko | 한국어 | 🇰🇷 | - |
| ar | العربية | 🇸🇦 | ✅ |
| pt | Português | 🇧🇷 | - |

---

## 12. サーバー起動方法

```powershell
cd C:\Projects\test-publishing-platform
npm start
```

**成功時の表示：**
```
Server running on port 3000
Frontend server running on port 8000
```

**停止：** `Ctrl + C`

---

## 13. ページ確認時の注意事項

### デモモード対応ページ

以下のページはURLに `?demo=true` を付けるとダミーデータで表示できます：
- account-settings.html
- tickets.html
- その他多数

### ブラウザキャッシュ
コード更新後に動作がおかしい場合：`Ctrl + Shift + R`

### Consoleエラーについて
`file:///` プロトコルでページを開くとCORSエラーが出ます。
必ず `http://localhost:8000` でアクセスしてください。

---

## 14. 注意事項

### translations.js の分割について
- 元のtranslations.js（約250KB）は9つの言語別ファイルに分割済み
- 分割ファイルは `js/lang/` ディレクトリに配置
- HTMLファイルの移行が完了したら、古いtranslations.jsは削除予定

### 言語セレクターの配置ルール
- **デスクトップ**: ナビバー右側（通知ベルやユーザーメニューの横）
- **モバイル**: ハンバーガーメニューの横（`d-lg-none`クラス）
- クラス名は `language-selector` を使用

### ナビバーの標準パターン
すべてのページで以下を確認：
- `sticky-top` クラスがあること（スクロール時に上部固定）
- 9言語セレクターがナビバー内にあること
- ユーザーメニューがcollapseの外にあること（モバイルで常に表示）
- オーバーレイは `top: 56px`（ナビバーの下から）

### GitHub API のファイルサイズ制限
- 大きなファイル（100KB以上）は一度にプッシュできない場合あり
- 分割して少しずつプッシュすることで解決

---

## 15. 主要機能一覧

| 機能 | 説明 | 関連ファイル |
|------|------|-------------|
| 多言語対応 | 9言語切り替え | js/lang/*.js, js/lang/translations-base.js, js/language-switcher.js |
| 領収書発行 | 9言語対応、PDF保存可 | backend/services/receipt-generator.js |
| GDPR対応 | データ削除リクエスト | pages/account-settings.html |
| FAQ | 33件×9言語 | pages/support/faq.html |
| サポートチケット | 問い合わせ管理 | pages/support/tickets.html |
| ライブラリ | 読者の本棚 | pages/library.html |

---

## 16. 既知の問題

### 通知タブ・セキュリティ質問の動的コンテンツ
- 言語切り替え後、動的に生成されるコンテンツが切り替わらない場合がある
- 原因: JavaScriptで生成されるコンテンツがapplyTranslations()の対象外
- 対処: ページをリロード（F5）
- 優先度: 低（次フェーズで対応検討）
- **注**: analytics.htmlでは `languageChanged` イベントで動的コンテンツも再描画するよう修正済み

### tickets.html 要確認（2026-01-28発生、1/30時点で未確認）
- 状況: アカウントマーク追加後の動作確認が未完了
- 対処: 次回セッションで確認予定

---

## 17. ローカルに保存済み言語ファイル

**パス:** `C:\Projects\test-publishing-platform\js\lang\`

| 言語 | ファイル | サイズ | 状態 |
|------|---------|--------|:----:|
| 🇯🇵 日本語 | ja.js | ~28KB | ✅ |
| 🇬🇧 英語 | en.js | ~25KB | ✅ |
| 🇨🇳 中国語 | zh.js | ~22KB | ✅ |
| 🇪🇸 スペイン語 | es.js | ~28KB | ✅ |
| 🇫🇷 フランス語 | fr.js | ~29KB | ✅ |
| 🇩🇪 ドイツ語 | de.js | ~28KB | ✅ |
| 🇰🇷 韓国語 | ko.js | ~28KB | ✅ |
| 🇸🇦 アラビア語 | ar.js | ~34KB | ✅ |
| 🇧🇷 ポルトガル語 | pt.js | ~28KB | ✅ |
| 📦 ベース | translations-base.js | - | ✅ |

---

## 18. 更新不要ファイル（独自実装）

| ファイル | パス | 理由 |
|----------|------|------|
| confirm-delete.html | pages/ | 独自uiText実装、translations.js不使用 |
| content-guidelines.html | pages/ | 独自uiText実装、translations.js不使用 |
| copyright-policy.html | pages/ | 独自uiText実装、translations.js不使用 |
| editor.html | pages/ | 独自uiText実装、translations.js不使用 |
| manga-translator.html | pages/ | 独自uiText実装、translations.js不使用 |
| manga-viewer.html | pages/ | 独自uiText実装、translations.js不使用 |
| payment-cancel.html | pages/ | 独自uiText実装、translations.js不使用 |
| payment-success.html | pages/ | 独自uiText実装、translations.js不使用 |
| privacy.html | pages/ | 独自uiText実装、translations.js不使用 |
| reader.html | pages/ | 独自uiText実装、translations.js不使用 |
| register-author.html | pages/ | 独自uiText実装、translations.js不使用 |
| register-editor.html | pages/ | 独自uiText実装、translations.js不使用 |
| register-translator.html | pages/ | 独自uiText実装、translations.js不使用 |
| revenue-sharing.html | pages/ | 独自uiText実装、translations.js不使用 |
| terms.html | pages/ | 独自uiText実装、translations.js不使用 |
| terms_with_zh.html | pages/ | 独自uiText実装、translations.js不使用 |
| translation-status.html | pages/ | 独自uiText実装、translations.js不使用 |
| library.html | pages/ | 独自uiText実装、translations.js不使用 |
| upload.html | pages/ | 独自uiText実装、translations.js不使用 |

---

## 19. 多言語テスト完了ページ

| # | ページ | ナビバー固定 | 言語セレクター | 翻訳 | 状態 |
|---|--------|:------------:|:--------------:|:----:|:----:|
| 1 | index.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 2 | login.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 3 | register.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 4 | upload.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 5 | contact.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 6 | faq.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 7 | tickets.html | ✅ | ✅ | ✅ | 📋 要確認 |
| 8 | troubleshoot.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 9 | dashboard.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 10 | browse.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 11 | checkout.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 12 | notifications.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 13 | account-settings.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 14 | analytics.html | ✅ | ✅ | ✅ | ✅ 完了 |

---

## 20. 将来の検討事項

### 📝 読者レビュー機能
現在、作品に対する読者レビューを書けるページがない。以下のいずれかで対応を検討：

1. **reader.html / manga-viewer.html** に読了後のレビュー投稿機能を追加（推奨）
2. **library.html** で購入済み作品にレビューアイコンを追加
3. 新規ページ `pages/review.html` を作成

---

最終更新: 2026年1月30日
