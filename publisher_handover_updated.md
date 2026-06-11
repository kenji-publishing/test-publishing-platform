# AuctLect Platform 引き継ぎドキュメント

最終更新: 2026年2月9日

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

多言語オンライン出版プラットフォーム「AuctLect」の開発プロジェクトです。

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

## 5. 今日の作業状況（2026-02-09）

### ✅ Pattern Cナビバー適用 — 6ページ完了

フィードバック報告ページ1ページ + クリエイター登録3ページ + 決済完了/キャンセル2ページに、Pattern Cナビバーを適用しました。全ページ共通で以下の3ステップを実施：

1. **CSS置換** — 旧navbar CSS → Pattern C CSS
2. **HTML置換** — 旧navbar HTML → Pattern C HTML
3. **JavaScript統合** — 旧navbar JS削除 + Pattern C JS追加（uiText 10キー×9言語、loadUserInfo、handleLogout等）

### 📋 完了ページ一覧

| # | ページ | 階層 | コミット | 変更量 |
|---|--------|------|----------|--------|
| 1 | feedback/report.html | pages/feedback/ | — | Pattern C適用 |
| 2 | register-author.html | pages/ | — | Pattern C適用 |
| 3 | register-editor.html | pages/ | — | Pattern C適用 |
| 4 | register-translator.html | pages/ | — | Pattern C適用 |
| 5 | payment-success.html | pages/ | — | Pattern C適用 |
| 6 | payment-cancel.html | pages/ | `da142dc` | +506/-10 |

### 🔧 各ページの修正ポイント

#### feedback/report.html（pages/feedback/階層）
- 旧navbar → Pattern C に置換
- パス: `../../` ベース（2階層深い）

#### register-author.html（pages/階層）
- 旧navbar → Pattern C に置換
- 著者登録フォーム機能は維持
- パス: `../` ベース

#### register-editor.html（pages/階層）
- 旧navbar → Pattern C に置換
- 編集者登録フォーム機能は維持
- パス: `../` ベース

#### register-translator.html（pages/階層）
- 旧navbar → Pattern C に置換
- 翻訳者登録フォーム機能は維持
- パス: `../` ベース

#### payment-success.html（pages/階層）
- 旧navbar → Pattern C に置換
- 決済完了表示機能は維持
- パス: `../` ベース

#### payment-cancel.html（pages/階層）
- 旧フローティング言語セレクター削除（CSS + HTML）
- 旧シンプルNavbar削除 → Pattern C に置換
- Cloudflare email-decode スクリプト除去
- メールリンク `support@publisher.com` をCloudflare難読化から復元
- ファイル末尾の切れた `pt.js` 行を修正・補完
- パス: `../` ベース

### ✅ GitHubへのPush — 全6ファイル完了

6ファイルすべてGitコマンドラインで個別にPush完了。

---

## 5-2. 前回の作業状況（2026-02-08）

### ✅ Pattern Cナビバー適用 — 5ページ完了

クリエイター向けページ4ページ + フィードバック管理ページ1ページに、Pattern Cナビバーを適用しました。全ページ共通で以下の3ステップを実施：

1. **CSS置換** — 旧navbar CSS → Pattern C CSS（約260行）
2. **HTML置換** — 旧navbar HTML → Pattern C HTML（約210行）
3. **JavaScript統合** — 旧navbar JS削除 + Pattern C JS追加（navUiText 10キー×9言語、loadUserInfo、handleLogout等）

### 📋 完了ページ一覧

| # | ページ | 階層 | コミット | 変更量 |
|---|--------|------|----------|--------|
| 1 | manga-translator.html | pages/ | `711e5df` | +695/-30 |
| 2 | translation-status.html | pages/ | `630974a` | +694行追加 |
| 3 | translators/index.html | pages/translators/ | `c58a136` | +686/-37 |
| 4 | translators/register.html | pages/translators/ | `583bfdc` | +692/-27 |
| 5 | feedback/index.html | pages/feedback/ | `b8ac316` | +678/-35 |

### 🔧 各ページの修正ポイント

#### manga-translator.html（pages/階層）
- `style-new.css` の読み込みを追加（元は未参照だった）
- 旧navbar（Bootstrap dropdown方式）→ Pattern C に置換
- 既存の翻訳機能（uiText + updateAllText）は維持
- パス: `../` ベース

#### translation-status.html（pages/階層）
- 旧navbar（Bootstrap dropdown方式）→ Pattern C に置換
- 既存のステータス管理機能（loadTranslations等）は維持
- パス: `../` ベース

#### translators/index.html（pages/translators/階層）
- 旧navbar（簡素な3リンク構成）→ Pattern C に置換
- 翻訳者マーケットプレイス機能（検索・フィルタ・ソート）は維持
- パス: `../../` ベース（2階層深い）

#### translators/register.html（pages/translators/階層）
- 旧navbar（簡素な3リンク構成）→ Pattern C に置換
- 4ステップ翻訳者登録ウィザード機能は維持
- パス: `../../` ベース（2階層深い）

#### feedback/index.html（pages/feedback/階層）
- 旧navbar（Bootstrap dropdown + 簡易ログアウト）→ Pattern C に置換
- uiTextから旧navbar用6キー削除、updateAllText()から対応6行削除
- 旧logout()関数削除 → Pattern C handleLogout()に統合
- 翻訳フィードバック管理機能（loadFeedback、resolveFeedback等）は維持
- パス: `../../` ベース（2階層深い）

### ✅ GitHubへのPush — 全5ファイル完了

5ファイルすべてGitコマンドラインで個別にPush完了。

---

## 5-3. 前回の作業状況（2026-02-07）

### ✅ manga-viewer.html Reader風ナビバー＋ツールバー＋翻訳システム - 完了

manga-viewer.htmlにReader.htmlと同じデザインのPattern Cナビバーを適用し、ツールバーを分離、翻訳システムを再構築しました。style-new.cssを読み込まないページのため、必要なCSS/JS全てをファイル内に直接追加しています。

### 🔧 修正内容

1. **ナビバーをReader.htmlスタイルに変更**
   - CSS変数: `--viewer-*` → `--reader-*`（全25箇所）
   - HTML ID/クラス名: Reader準拠に統一（`-nav`サフィックス）
     - `userMenu` → `userMenuNav`, `user-menu` → `user-menu-nav` 等
   - JS関数名: Reader準拠に統一
     - `uiText` → `navbarUiText`
     - `updateUIText()` → `updateNavbarText()`
     - `toggleUserDropdown()` → `toggleUserDropdownNav()`
     - `handleLogout()` → `handleLogoutNav()`
     - `loadUserInfo()` → `loadUserInfoNav()`
   - Google Fonts追加（Noto Serif JP, Noto Sans JP）
   - `btn-soft-custom`, `btn-primary-custom` ボタンCSS追加

2. **ツールバーをNavbarから分離（Reader準拠）**
   - `viewer-header` → 固定 `viewer-toolbar`（`position: fixed`）
   - toolbar-left: ← Dashboard + 作品タイトル + 著者名
   - toolbar-right: 🔔通知 + ページ一覧 + 全画面 + 閉じる
   - ボタンクラス: `btn-viewer` → `btn-toolbar`

3. **ツールバー位置調整（Navbar下に配置）**
   - toolbar: `top: 72px`（navbar高さ分の下マージン）
   - viewer-container: `margin-top: 52px`, `height: calc(100vh - 118px)`
   - manga-page: `max-height: calc(100vh - 258px)`

4. **ハンバーガーメニュー修正**
   - 問題: `data-bs-toggle="collapse"` が機能しない
   - 原因: Bootstrap Bundle JSが未読み込み
   - 修正: `bootstrap.bundle.min.js` をscriptタグで追加

5. **翻訳システムの再構築（9言語対応）**
   - 問題: `changeLanguage()` と `currentLang` がグローバルで未定義のため、言語セレクターが機能しなかった
   - 追加した関数・データ:
     - `currentLang` — グローバル変数（localStorageから読み込み）
     - `mangaViewerText` — 19翻訳キー × 9言語のデータ
     - `tLocal(key)` — `translations.js`の`t()`を優先、なければローカルデータにフォールバック
     - `changeLanguage(lang)` — セレクター同期 → 翻訳適用 → イベント発火
     - `updatePageInfo()` — ページカウンター更新
   - 翻訳対象: Navbar、Toolbar、画面中央のコントロール全て

### ⚠️ manga-viewer.html固有の注意事項

- **style-new.cssを読み込まない**: ナビバー・ツールバーのCSSはファイル内に直接記述
- **CSS変数**: `--reader-*` 変数を使用（reader.htmlと同じ暖色系テーマ）
- **クラス名の競合回避**: navbar要素は `-nav` suffix付き（reader.htmlと同じルール）
- **オーバーレイのtop値**: `top: 72px`（navbar + ツールバー分のオフセット）
- **翻訳の二重構造**: `translations.js`（外部）+ `mangaViewerText`（内部フォールバック）の2段階

### ✅ GitHubへのPush - 完了

Gitコマンドラインを使用して安全にPush完了。コミット: `0c7fe3b`

---

## 5-4. 前々回の作業状況（2026-02-06）

### ✅ reader.html Pattern Cナビバー適用 - 完了

reader.htmlにPattern C（サポートページ向け）ナビバーを適用しました。style-new.cssを読み込まないページのため、必要なCSSをファイル内に直接追加しています。

### 🔧 修正内容

1. **Pattern C ナビバー HTML/CSS/JS 追加**
   - HTML: 行432-546（ナビバー構造、FAQ active状態）
   - CSS: 行343-428（`--reader-*`変数で適応）
   - JS: 行1168-1365（navbar専用scriptブロック）

2. **Navbar JavaScript関数追加**
   - `updateNavbarText()` — ナビバーの9言語テキスト更新
   - `toggleUserDropdownNav(event)` — ユーザードロップダウン開閉
   - `handleLogoutNav()` — 多言語ログアウト確認ダイアログ
   - `loadUserInfoNav()` — localStorage→表示名・メール反映

3. **言語セレクタ3つの相互同期**
   - Navbar PC (`languageSelector`)
   - Navbar Mobile (`languageSelectorMobile`)
   - ~~Reader toolbar (`langSelector`)~~ → 削除（Navbarに統合）
   - `changeLanguage()` → `updateAllText()` → `updateNavbarText()` の連動

4. **重複要素の削除**
   - reader-toolbar内のAuctLectロゴ（黒色）を削除（Navbarロゴと重複）
   - reader-toolbar内の言語セレクタ `langSelector` を削除（Navbarセレクタと重複）
   - JS参照4箇所もクリーンアップ

5. **Cloudflare汚染の除去**
   - `[email protected]` → `user@example.com` に復元（行431）
   - `email-decode.min.js` のscriptタグを削除（Consoleエラーの原因）

6. **ロゴ・言語セレクタのデザイン統一（checkout.html準拠）**
   - `.navbar-custom` — 白背景、border-bottom、box-shadow
   - `.navbar-brand` — Noto Serif JP書体、#8B7355ブラウン
   - `.language-selector` — 角丸8px、hover時アクセント色ボーダー
   - style-new.cssの変数を`--reader-*`変数に置換（テーマ切替対応）

7. **ツールバー位置の連鎖調整（56px → 66px）**
   - Navbar `padding: 1rem 0` 追加により高さが56px→約66pxに変更
   - 以下6箇所を連動して +10px 調整：

   | 要素 | 変更前 | 変更後 |
   |------|--------|--------|
   | reader-toolbar | `top: 56px` | `top: 66px` |
   | 設定/ブックマーク/検索パネル | `top: 111px` | `top: 121px` |
   | reader-main（本文） | `padding-top: 116px` | `padding-top: 126px` |
   | navbar-overlay | `top: 56px` | `top: 66px` |
   | user-menu（モバイル） | `top: 56px` | `top: 66px` |
   | navbar-collapse（モバイル） | `top: 56px` | `top: 66px` |

8. **ファイル末尾の修復**
   - 切断されていた行1156を復元
   - `</script>`, `</body>`, `</html>` の閉じタグ追加
   - `header-notification.js` の参照追加

### ⚠️ reader.html固有の注意事項

- **style-new.cssを読み込まない**: ナビバー・言語セレクタのCSSはファイル内に直接記述
- **Live Server対策**: 行1136の `'</' + 'body></' + 'html>'` は絶対に変更しないこと（Live ServerがWebSocketコードを誤挿入する問題の回避）
- **クラス名の競合回避**: navbar要素は `-nav` suffix付きのクラス名/IDを使用（`userMenuNav`, `user-menu-item-nav`, `logout-btn-nav` 等）
- **CSS変数**: `--reader-*` 変数を使用（テーマ切替 Light/Dark/Sepia に対応）
- **オーバーレイのtop値**: 他ページは `top: 56px` だが、reader.htmlは `top: 66px`（navbar padding追加のため）

### ✅ GitHubへのPush - 完了

Gitコマンドラインを使用して安全にPush完了。

---

## 5-5. 前々回の作業状況（2026-02-02）

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

## 5-6. 前々回の作業状況（2026-02-01）

### 🔧 login.html パターンC適用（完了）

login.htmlにPattern C（未ログイン向け）のナビバーを適用完了。

### 🔧 contact.html 修正

1. 翻訳ファイル参照を修正（\`translations.js\` → \`js/lang/*.js\`）
2. Pattern Cナビバー適用
3. Get Startedボタン追加

---

## 5-7. 前々々回の作業状況（2026-01-31）

### 🔧 GitHubとの同期を完了

長期間GitHubにアクセスできなかったため、ローカルの変更がGitHubに反映されていませんでした。
コンフリクト（競合）を解決し、ローカルの変更をGitHubにプッシュしました。

---

## 6. 次回の作業（2026-02-10以降）

### 🎯 パターンS（シンプル版）の残りページを修正

| ページ | パターン | 状態 |
|--------|:--------:|:----:|
| reader.html | S（C適用） | ✅ 完了 |
| manga-viewer.html | S（C適用） | ✅ 完了 |
| editor.html | S | 📋 予定 |
| payment-success.html | S（C適用） | ✅ 完了 |
| payment-cancel.html | S（C適用） | ✅ 完了 |
| confirm-delete.html | S | 📋 予定 |

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
| feedback/report.html | A | ✅ 完了 |

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
| feedback/index.html | ✅ 完了 |
| feedback/report.html | ✅ 完了 |

### クリエイター向け（パターンB）- 12ページ
| ページ | 状態 |
|--------|:----:|
| dashboard.html | ✅ 完了 |
| upload.html | ✅ 完了 |
| upload-work.html | 📋 予定 |
| analytics.html | 📋 予定 |
| manga-translator.html | ✅ 完了 |
| translation-status.html | ✅ 完了 |
| translators/index.html | ✅ 完了 |
| translators/register.html | ✅ 完了 |
| register-author.html | ✅ 完了 |
| register-editor.html | ✅ 完了 |
| register-translator.html | ✅ 完了 |
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
| reader.html | ✅ 完了（Pattern C適用）|
| manga-viewer.html | ✅ 完了（Pattern C適用）|
| editor.html | 📋 予定 |
| payment-success.html | ✅ 完了（Pattern C適用）|
| payment-cancel.html | ✅ 完了（Pattern C適用）|
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
| reader.html | ✅ | ✅ | ✅ 完了 |
| manga-viewer.html | ✅ | ✅ | ✅ 完了 |
| manga-translator.html | ✅ | ✅ | ✅ 完了 |
| translation-status.html | ✅ | ✅ | ✅ 完了 |
| translators/index.html | ✅ | ✅ | ✅ 完了 |
| translators/register.html | ✅ | ✅ | ✅ 完了 |
| feedback/index.html | ✅ | ✅ | ✅ 完了 |
| feedback/report.html | ✅ | ✅ | ✅ 完了 |
| register-author.html | ✅ | ✅ | ✅ 完了 |
| register-editor.html | ✅ | ✅ | ✅ 完了 |
| register-translator.html | ✅ | ✅ | ✅ 完了 |
| payment-success.html | ✅ | ✅ | ✅ 完了 |
| payment-cancel.html | ✅ | ✅ | ✅ 完了 |
| その他ページ | ❌ | - | 📋 要対応 |

---

## 10. 今日作成・修正したファイル一覧（2026-02-09）

| ファイル | 状態 | 保存先 |
|----------|:----:|--------|
| feedback/report.html | 修正完了 | `C:\Projects\test-publishing-platform\pages\feedback\report.html` |
| register-author.html | 修正完了 | `C:\Projects\test-publishing-platform\pages\register-author.html` |
| register-editor.html | 修正完了 | `C:\Projects\test-publishing-platform\pages\register-editor.html` |
| register-translator.html | 修正完了 | `C:\Projects\test-publishing-platform\pages\register-translator.html` |
| payment-success.html | 修正完了 | `C:\Projects\test-publishing-platform\pages\payment-success.html` |
| payment-cancel.html | 修正完了 | `C:\Projects\test-publishing-platform\pages\payment-cancel.html` |
| publisher_handover_updated.md | 更新 | ダウンロード |

### 前回（2026-02-08）

| ファイル | 状態 | 保存先 |
|----------|:----:|--------|
| manga-translator.html | 修正完了 | `C:\Projects\test-publishing-platform\pages\manga-translator.html` |
| translation-status.html | 修正完了 | `C:\Projects\test-publishing-platform\pages\translation-status.html` |
| translators/index.html | 修正完了 | `C:\Projects\test-publishing-platform\pages\translators\index.html` |
| translators/register.html | 修正完了 | `C:\Projects\test-publishing-platform\pages\translators\register.html` |
| feedback/index.html | 修正完了 | `C:\Projects\test-publishing-platform\pages\feedback\index.html` |
| publisher_handover_updated.md | 更新 | ダウンロード |

### 前回（2026-02-07）

| ファイル | 状態 | 保存先 |
|----------|:----:|--------|
| manga-viewer.html | 修正完了 | `C:\Projects\test-publishing-platform\pages\manga-viewer.html` |
| publisher_handover_updated.md | 更新 | ダウンロード |

### 前回（2026-02-06）

| ファイル | 状態 | 保存先 |
|----------|:----:|--------|
| reader.html | 修正完了 | \`C:\Projects\test-publishing-platform\pages\reader.html\` |
| publisher_handover_updated.md | 更新 | ダウンロード |

### 前々回（2026-02-02）

| ファイル | 状態 | 保存先 |
|----------|:----:|--------|
| faq.html | 修正完了 | \`C:\Projects\test-publishing-platform\pages\support\faq.html\` |
| tickets.html | 修正完了 | \`C:\Projects\test-publishing-platform\pages\support\tickets.html\` |
| troubleshoot.html | 修正完了 | \`C:\Projects\test-publishing-platform\pages\support\troubleshoot.html\` |

### 前々回（2026-02-01）

| ファイル | 状態 | 保存先 |
|----------|:----:|--------|
| login.html | 修正完了 | \`C:\Projects\test-publishing-platform\pages\login.html\` |
| contact.html | 修正完了 | \`C:\Projects\test-publishing-platform\pages\support\contact.html\` |

### さらに前（2026-01-31）

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
- オーバーレイは `top: 56px`（ナビバーの下から）。ただしreader.htmlは `top: 66px`（navbar padding追加のため）、manga-viewer.htmlは `top: 72px`（navbar + ツールバー分）

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

### GitHub API経由のファイルアップロード問題
- **現象**: JavaScript含むHTMLファイルをGitHub API経由でアップロードすると、バックスラッシュ `\` が `\\` に二重化される
- **原因**: APIのBase64変換時にエスケープ処理が追加される
- **対策**: **Gitコマンドラインを使用してPushする**（API経由でのHTMLファイルアップロードは禁止）

### Cloudflareによるコード汚染
- **現象**: GitHub Pages等Cloudflare経由でHTMLをダウンロードすると、メールアドレスが `[email protected]` に難読化され、`email-decode.min.js` が注入される
- **対策**: Cloudflare経由でダウンロードしたHTMLをそのまま再アップロードしないこと。ローカルのGitリポジトリのファイルを正とする

### GitHubへの安全なPush手順
\`\`\`bash
cd C:\Projects\test-publishing-platform
git add ファイル名
git commit -m "変更内容の説明"
git pull origin main
git push origin main
\`\`\`
- **重要**: `git pull` → `git push` の順番を守ること
- Vim画面が開いたら `:wq` + Enterで閉じる
- Excelファイルが開いていると `Unlink of file` エラーが出るので、事前に閉じる

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
| 15 | reader.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 16 | manga-viewer.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 17 | manga-translator.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 18 | translation-status.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 19 | translators/index.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 20 | translators/register.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 21 | feedback/index.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 22 | feedback/report.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 23 | register-author.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 24 | register-editor.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 25 | register-translator.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 26 | payment-success.html | ✅ | ✅ | ✅ | ✅ 完了 |
| 27 | payment-cancel.html | ✅ | ✅ | ✅ | ✅ 完了 |

---

## 20. 将来の検討事項

### 📝 読者レビュー機能
現在、作品に対する読者レビューを書けるページがない。以下のいずれかで対応を検討：

1. **reader.html / manga-viewer.html** に読了後のレビュー投稿機能を追加（推奨）
2. **library.html** で購入済み作品にレビューアイコンを追加
3. 新規ページ \`pages/review.html\` を作成

---

最終更新: 2026年2月9日
