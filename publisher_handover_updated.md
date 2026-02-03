# Publisher Platform 引き継ぎドキュメント

最終更新: 2026年2月2日

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
\`\`\`
C:\Projects\test-publishing-platform
\`\`\`

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

## 5. 今日の作業状況（2026-02-02）

### ✅ Support 4ページ「Get Started」ボタン統一 - 完了

Support 4ページすべてにPattern C方式を適用し、「Sign In」+「Get Started」ボタンを統一しました。

| ページ | 状態 | 備考 |
|--------|:----:|------|
| contact.html | ✅ 完了 | Pattern C適用済み（前回完了） |
| faq.html | ✅ 完了 | Pattern C方式に変更、ボタン追加 |
| tickets.html | ✅ 完了 | Pattern C方式に変更、ボタン追加 |
| troubleshoot.html | ✅ 完了 | Pattern C方式に変更、ボタン追加、翻訳修正 |

### 🔧 各ページの修正内容

#### 共通の修正項目（faq, tickets, troubleshoot）

1. **Get Startedボタン追加**
   - PC: \`navbar-buttons-guest\`内に「Sign In」+「Get Started」の2ボタン
   - モバイル: ハンバーガーメニュー内に両ボタン

2. **Pattern C方式に統一**
   - 認証制御: \`body.logged-in\`クラスによるCSS制御
   - 旧方式（JSでインラインスタイル操作）から移行

3. **Auth Visibility CSS追加**
   \`\`\`css
   .auth-only { display: none !important; }
   .guest-only { display: block; }
   .guest-only.nav-item { display: list-item; }
   body.logged-in .auth-only { display: block !important; }
   body.logged-in .guest-only { display: none !important; }
   \`\`\`

4. **PC Navbar横並びCSS追加**
   - メニュー項目の折り返し防止
   - \`white-space: nowrap\`、\`flex-wrap: nowrap\`

5. **sticky-top対応**
   - \`html, body { overflow-x: hidden; }\` → \`body { overflow-x: hidden; }\`
   - \`html\`から除去することでsticky-topが正常に機能

6. **z-index階層修正**
   - \`.navbar-custom\`: 1050（最上位）
   - \`.navbar-collapse\`: 1045（メニュー）
   - \`.navbar-overlay\`: 1040（背景オーバーレイ）

7. **auth-only要素のインラインスタイル削除**
   - \`style="display: none;"\` → CSSで制御

#### troubleshoot.html 固有の修正

1. **翻訳問題修正**
   - 問題: 「Select Issue」「Details」「Solution」等が言語切替で英語のまま
   - 原因: \`languageChanged\`イベントで\`updateUIText()\`が呼ばれていなかった
   - 修正: イベントリスナーに\`updateUIText()\`を追加

2. **オーバーレイ配置修正**
   - \`navbar-overlay\`を\`<body>\`直下に移動
   - CSSをメディアクエリ外に移動

### 🧪 ログイン確認用Consoleコード

**ログイン状態にする:**
\`\`\`javascript
localStorage.setItem('token', 'test-token');
localStorage.setItem('user', JSON.stringify({display_name: 'Test User', email: 'test@publisher.local'}));
location.reload();
\`\`\`

**ログアウト状態に戻す:**
\`\`\`javascript
localStorage.removeItem('token');
localStorage.removeItem('user');
location.reload();
\`\`\`

---

## 5-2. 前回の作業状況（2026-02-01）

### 🔧 login.html パターンC適用（完了）

login.htmlにPattern C（未ログイン向け）のナビバーを適用完了。

### 🔧 contact.html 修正

1. 翻訳ファイル参照を修正（\`translations.js\` → \`js/lang/*.js\`）
2. Pattern Cナビバー適用
3. Get Startedボタン追加

---

## 5-3. 前々回の作業状況（2026-01-31）

### 🔧 GitHubとの同期を完了

長期間GitHubにアクセスできなかったため、ローカルの変更がGitHubに反映されていませんでした。
コンフリクト（競合）を解決し、ローカルの変更をGitHubにプッシュしました。

---

## 6. 次回の作業（2026-02-03以降）

### 🎯 パターンD（未ログイン）の残りページを修正

| ページ | パターン | 状態 |
|--------|:--------:|:----:|
| register.html | D | 📋 予定 |
| terms.html | D | 📋 予定 |
| privacy.html | D | 📋 予定 |
| content-guidelines.html | D | 📋 予定 |
| copyright-policy.html | D | 📋 予定 |
| revenue-sharing.html | D | 📋 予定 |

### 🎯 パターンA（読者向け）ページを修正

| ページ | パターン | 状態 |
|--------|:--------:|:----:|
| browse.html | A | 📋 予定 |
| checkout.html | A | 📋 予定 |
| notifications.html | A | 📋 予定 |
| account-settings.html | A | 📋 予定 |
| feedback/index.html | A | 📋 予定 |
| feedback/report.html | A | 📋 予定 |

### 🎯 各ページで確認する7項目

1. **ナビバー構造** - パターンに合ったメニュー項目があるか
2. **ハンバーガーメニュー** - モバイル時の展開メニュー内容
3. **言語セレクター位置** - PC/モバイルで適切な位置
4. **ユーザードロップダウン** - アカウントマークとメニュー
5. **翻訳機能** - 言語切替で全要素が翻訳されるか
6. **PC/モバイル統一** - PC画面とハンバーガーメニューの項目を統一
7. **モバイルスクロール** - ハンバーガーメニューがスクロール可能か

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

### パターンC: サポートページ（本日完了）

**対象:** faq, contact, tickets, troubleshoot

\`\`\`
ナビバー: [Logo] | Browse | Library | Dashboard | [🔔] | [🌐] | [👤▼]
Guest時: [Logo] | Browse | ... | [🌐] | [Sign In] [Get Started]

ハンバーガー:
├ Browse / Library  ← パターンAへ
├ Dashboard / Upload  ← パターンBへ
├ FAQ / Contact / My Tickets / Troubleshooting
├ Home
└ Sign In / Get Started (Guest時)
\`\`\`

---

## 8. ページ別パターン割り当て（全48ページ）

### サポートページ（パターンC）- 4ページ ✅ 完了
| ページ | 状態 |
|--------|:----:|
| contact.html | ✅ 完了 |
| faq.html | ✅ 完了 |
| tickets.html | ✅ 完了 |
| troubleshoot.html | ✅ 完了 |

### 未ログイン（パターンD）- 8ページ
| ページ | 状態 |
|--------|:----:|
| index.html | ✅ 完了 |
| login.html | ✅ 完了 |
| register.html | 📋 予定 |
| terms.html | 📋 予定 |
| privacy.html | 📋 予定 |
| content-guidelines.html | 📋 予定 |
| copyright-policy.html | 📋 予定 |
| revenue-sharing.html | 📋 予定 |

### 読者向け（パターンA）- 7ページ
| ページ | 状態 |
|--------|:----:|
| library.html | ✅ 完了 |
| browse.html | 📋 予定 |
| checkout.html | 📋 予定 |
| notifications.html | 📋 予定 |
| account-settings.html | 📋 予定 |
| feedback/index.html | 📋 予定 |
| feedback/report.html | 📋 予定 |

### クリエイター向け（パターンB）- 12ページ
| ページ | 状態 |
|--------|:----:|
| dashboard.html | ✅ 完了 |
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
| contact.html | ✅ | ✅ | ✅ 完了 |
| faq.html | ✅ | ✅ | ✅ 完了 |
| tickets.html | ✅ | ✅ | ✅ 完了 |
| troubleshoot.html | ✅ | ✅ | ✅ 完了 |
| dashboard.html | ✅ | ✅ | ✅ 完了 |
| index.html | ✅ | ✅ | ✅ 完了 |
| login.html | ✅ | ✅ | ✅ 完了 |
| その他ページ | ❌ | - | 📋 要対応 |

---

## 10. 今日作成・修正したファイル一覧（2026-02-02）

| ファイル | 状態 | 保存先 |
|----------|:----:|--------|
| faq.html | 修正完了 | \`C:\Projects\test-publishing-platform\pages\support\faq.html\` |
| tickets.html | 修正完了 | \`C:\Projects\test-publishing-platform\pages\support\tickets.html\` |
| troubleshoot.html | 修正完了 | \`C:\Projects\test-publishing-platform\pages\support\troubleshoot.html\` |
| publisher_handover_updated.md | 更新 | ダウンロード |

### 前回（2026-02-01）

| ファイル | 状態 | 保存先 |
|----------|:----:|--------|
| login.html | 修正完了 | \`C:\Projects\test-publishing-platform\pages\login.html\` |
| contact.html | 修正完了 | \`C:\Projects\test-publishing-platform\pages\support\contact.html\` |

### 前々回（2026-01-31）

| ファイル | 状態 | 保存先 |
|----------|:----:|--------|
| dashboard.html | 修正完了 | \`C:\Projects\test-publishing-platform\pages\dashboard.html\` |
| tickets.html | 修正完了 | \`C:\Projects\test-publishing-platform\pages\support\tickets.html\` |
| troubleshoot.html | 修正完了 | \`C:\Projects\test-publishing-platform\pages\support\troubleshoot.html\` |
| index.html | 修正完了 | \`C:\Projects\test-publishing-platform\index.html\` |

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

\`\`\`powershell
cd C:\Projects\test-publishing-platform
npm start
\`\`\`

**成功時の表示：**
\`\`\`
Server running on port 3000
Frontend server running on port 8000
\`\`\`

**停止：** \`Ctrl + C\`

---

## 13. ページ確認時の注意事項

### デモモード対応ページ

以下のページはURLに \`?demo=true\` を付けるとダミーデータで表示できます：
- account-settings.html
- tickets.html
- その他多数

### ブラウザキャッシュ
コード更新後に動作がおかしい場合：\`Ctrl + Shift + R\`

### Consoleエラーについて
\`file:///\` プロトコルでページを開くとCORSエラーが出ます。
必ず \`http://localhost:8000\` でアクセスしてください。

---

## 14. 注意事項

### Pattern C方式の認証制御（Support 4ページで統一済み）

\`\`\`javascript
// ログイン判定
const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');

if (token && userStr) {
    document.body.classList.add('logged-in');
} else {
    document.body.classList.remove('logged-in');
}
\`\`\`

\`\`\`css
/* CSSで表示/非表示を制御 */
.auth-only { display: none !important; }
body.logged-in .auth-only { display: block !important; }
body.logged-in .guest-only { display: none !important; }
\`\`\`

### z-index階層ルール

ナビバー関連のz-index階層：

| 要素 | z-index | 用途 |
|------|---------|------|
| \`.navbar-custom\` | 1050 | ナビバー本体（最上位） |
| \`.navbar-collapse\` | 1045 | ドロップダウンメニュー |
| \`.navbar-overlay\` | 1040 | 背景オーバーレイ |

### sticky-top対応

\`position: sticky\`を正常に機能させるため、\`overflow\`設定に注意：

\`\`\`css
/* ❌ NG - sticky-topが効かない */
html, body { overflow-x: hidden; }

/* ✅ OK - sticky-topが正常に動作 */
body { overflow-x: hidden; }
\`\`\`

### translations.js の分割について
- 元のtranslations.js（約250KB）は9つの言語別ファイルに分割済み
- 分割ファイルは \`js/lang/\` ディレクトリに配置
- HTMLファイルの移行が完了したら、古いtranslations.jsは削除予定

### 言語セレクターの配置ルール
- **デスクトップ**: ナビバー右側（通知ベルやユーザーメニューの横）
- **モバイル**: ハンバーガーメニューの横（\`d-lg-none\`クラス）
- クラス名は \`language-selector\` を使用

### ナビバーの標準パターン
すべてのページで以下を確認：
- \`sticky-top\` クラスがあること（スクロール時に上部固定）
- 9言語セレクターがナビバー内にあること
- ユーザーメニューがcollapseの外にあること（モバイルで常に表示）
- オーバーレイは \`top: 56px\`（ナビバーの下から）

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

### Claudeへのファイルアップロードサイズ制限
- 大きなHTMLファイル（約65KB以上）はアップロード時に切断される可能性がある
- 対策: 修正後のファイルを適用する前に、必ずファイル末尾（\`</html>\`の存在）を確認する

### 通知タブ・セキュリティ質問の動的コンテンツ
- 言語切り替え後、動的に生成されるコンテンツが切り替わらない場合がある
- 原因: JavaScriptで生成されるコンテンツがapplyTranslations()の対象外
- 対処: ページをリロード（F5）
- 優先度: 低（次フェーズで対応検討）
- **注**: analytics.html、troubleshoot.htmlでは \`languageChanged\` イベントで動的コンテンツも再描画するよう修正済み

---

## 17. ローカルに保存済み言語ファイル

**パス:** \`C:\Projects\test-publishing-platform\js\lang\\\`

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
| 3 | register.html | ✅ | ✅ | ✅ | 📋 予定 |
| 4 | upload.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 5 | contact.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 6 | faq.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 7 | tickets.html | ✅ | ✅ | ✅ | ✅ 完了 |
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
3. 新規ページ \`pages/review.html\` を作成

---

最終更新: 2026年2月2日
