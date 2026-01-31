# Publisher ナビバー・メニュー設計書 v2

## 1. ユーザータイプの定義

| タイプ | 説明 |
|--------|------|
| 👤 **読者（Reader）** | 本を購入・閲覧するユーザー |
| ✍️ **クリエイター（Creator）** | 著者・翻訳者・編集者（読者機能も使用可能） |
| 🔧 **管理者（Admin）** | プラットフォーム管理者 |
| 🔓 **未ログイン（Guest）** | ログイン前の状態 |

---

## 2. メニューパターン（5種類）

### パターンA: 読者向け
### パターンB: クリエイター向け
### パターンC: サポートページ（A+Bへのアクセス可能）
### パターンD: 未ログイン（FAQへのアクセスあり）
### パターンE: 管理画面
### パターンS: シンプル版（読書・編集に集中）

---

## 3. 全ページ一覧と分類（48ページ）

### 📚 読者向けページ（パターンA）
| # | ページ | パス | 説明 |
|---|--------|------|------|
| 1 | Browse | pages/browse.html | 作品を探す・検索 |
| 2 | Library | pages/library.html | 購入した本の一覧（本棚） |
| 3 | Checkout | pages/checkout.html | 購入手続き |
| 4 | Notifications | pages/notifications.html | 通知一覧 |
| 5 | Account Settings | pages/account-settings.html | アカウント設定 |
| 6 | Feedback Index | pages/feedback/index.html | フィードバック一覧（翻訳報告） |
| 7 | Feedback Report | pages/feedback/report.html | フィードバック報告（翻訳問題報告） |

### 📖 読書ページ（パターンS - シンプル版）
| # | ページ | パス | 説明 |
|---|--------|------|------|
| 8 | Reader | pages/reader.html | テキスト作品を読む |
| 9 | Manga-viewer | pages/manga-viewer.html | マンガを読む |

### ✍️ クリエイター向けページ（パターンB）
| # | ページ | パス | 説明 |
|---|--------|------|------|
| 10 | Dashboard | pages/dashboard.html | クリエイターダッシュボード |
| 11 | Upload | pages/upload.html | 作品アップロード入口 |
| 12 | Upload Work | pages/upload-work.html | 作品アップロード詳細 |
| 13 | Analytics | pages/analytics.html | 売上・閲覧分析 |
| 14 | Manga-translator | pages/manga-translator.html | マンガAI翻訳 |
| 15 | Translation-status | pages/translation-status.html | 翻訳進捗確認 |
| 16 | Translators Index | pages/translators/index.html | 翻訳者マーケットプレイス |
| 17 | Translators Register | pages/translators/register.html | 翻訳者として登録 |

### ✏️ 編集ページ（パターンS - シンプル版）
| # | ページ | パス | 説明 |
|---|--------|------|------|
| 18 | Editor | pages/editor.html | 作品編集 |

### 📝 ロール登録ページ（パターンB）
| # | ページ | パス | 説明 |
|---|--------|------|------|
| 19 | Register Author | pages/register-author.html | 著者として登録 |
| 20 | Register Editor | pages/register-editor.html | 編集者として登録 |
| 21 | Register Translator | pages/register-translator.html | 翻訳者として登録 |

### 🆘 サポートページ（パターンC）
| # | ページ | パス | 説明 |
|---|--------|------|------|
| 22 | FAQ | pages/support/faq.html | よくある質問 |
| 23 | Contact | pages/support/contact.html | お問い合わせ |
| 24 | Tickets | pages/support/tickets.html | サポートチケット |
| 25 | Troubleshoot | pages/support/troubleshoot.html | トラブルシューティング |

### 💳 決済結果ページ（パターンS - シンプル版）
| # | ページ | パス | 説明 |
|---|--------|------|------|
| 26 | Payment Success | pages/payment-success.html | 支払い成功 |
| 27 | Payment Cancel | pages/payment-cancel.html | 支払いキャンセル |

### 🔓 未ログインページ（パターンD）
| # | ページ | パス | 説明 |
|---|--------|------|------|
| 28 | Index (Top) | index.html | トップページ |
| 29 | Login | pages/login.html | ログイン |
| 30 | Register | pages/register.html | 新規登録 |

### 📄 静的ページ（パターンD）
| # | ページ | パス | 説明 |
|---|--------|------|------|
| 31 | Terms | pages/terms.html | 利用規約 |
| 32 | Privacy | pages/privacy.html | プライバシーポリシー |
| 33 | Content Guidelines | pages/content-guidelines.html | コンテンツガイドライン |
| 34 | Copyright Policy | pages/copyright-policy.html | 著作権ポリシー |
| 35 | Revenue Sharing | pages/revenue-sharing.html | 収益分配説明 |

### ⚠️ 確認ページ（パターンS - シンプル版）
| # | ページ | パス | 説明 |
|---|--------|------|------|
| 36 | Confirm Delete | pages/confirm-delete.html | アカウント削除確認 |

### 🔧 管理画面（パターンE）
| # | ページ | パス | 説明 |
|---|--------|------|------|
| 37 | Admin Index | pages/admin/index.html | 管理画面トップ |
| 38 | Admin Analytics | pages/admin/analytics.html | 管理者用分析 |
| 39 | Admin Feedback | pages/admin/feedback.html | フィードバック管理 |
| 40 | Admin Support | pages/admin/support.html | サポート管理 |

### 🛠️ 開発用・テスト用（対象外）
| # | ページ | パス | 説明 |
|---|--------|------|------|
| 41 | pages/index.html | pages/ | （用途不明） |
| 42 | Email Preview | pages/dev/email-preview.html | 開発用メールプレビュー |
| 43-48 | テスト用ファイル | - | terms_with_zh, privacy系など |

---

## 4. 各パターンの詳細設計

### 🔷 パターンA: 読者向け

**対象ページ:** browse, library, checkout, notifications, account-settings, feedback/*

#### ナビバー（PC）
```
[Publisher Logo] | Browse | Library | [🔔通知] | [🌐言語] | [👤ユーザー▼]
```

#### ハンバーガーメニュー（モバイル展開時）
```
Browse（作品を探す）
Library（ライブラリ）
─────────────────────
Upload Work（作品をアップロード）  ← クリエイターへの入口
Dashboard（ダッシュボード）
─────────────────────
Feedback（翻訳の問題を報告）  ← 翻訳報告
─────────────────────
FAQ（よくある質問）
Contact（お問い合わせ）
```

#### ユーザードロップダウン
```
[👤 ユーザーアバター]
[ユーザー名]
[メールアドレス]
─────────────────────
Account Settings（アカウント設定）
Creator Dashboard（クリエイターダッシュボード）
─────────────────────
Log Out（ログアウト）
```

---

### 🔶 パターンB: クリエイター向け

**対象ページ:** dashboard, upload, upload-work, analytics, manga-translator, translation-status, translators/*, register-author, register-editor, register-translator

#### ナビバー（PC）
```
[Publisher Logo] | Dashboard | My Works | Analytics | [🔔通知] | [🌐言語] | [👤ユーザー▼]
```

#### ハンバーガーメニュー（モバイル展開時）
```
Dashboard（ダッシュボード）
My Works（作品管理）
Analytics（分析）
Upload（アップロード）
─────────────────────
Translation Tools（翻訳ツール）
  ├ Manga Translator（マンガ翻訳）
  ├ Translation Status（翻訳状況）
  └ Find Translators（翻訳者を探す）
─────────────────────
Browse（作品を探す）
Library（ライブラリ）
─────────────────────
FAQ（よくある質問）
Contact（お問い合わせ）
```

#### ユーザードロップダウン
```
[👤 ユーザーアバター]
[ユーザー名]
[メールアドレス]
─────────────────────
Account Settings（アカウント設定）
My Library（ライブラリ）
─────────────────────
Log Out（ログアウト）
```

---

### 🟢 パターンC: サポートページ

**対象ページ:** faq, contact, tickets, troubleshoot

#### ナビバー（PC）
```
[Publisher Logo] | Browse | Library | Dashboard | [🔔通知] | [🌐言語] | [👤ユーザー▼]
```

#### ハンバーガーメニュー（モバイル展開時）
```
Browse（作品を探す）          ← パターンAへのアクセス
Library（ライブラリ）
─────────────────────
Dashboard（ダッシュボード）   ← パターンBへのアクセス
Upload（アップロード）
─────────────────────
FAQ（よくある質問）
Contact（お問い合わせ）
My Tickets（チケット）
Troubleshooting（トラブルシューティング）
─────────────────────
Home（トップページ）
```

#### ユーザードロップダウン
```
（パターンAと同じ）
```

---

### 🔲 パターンD: 未ログイン

**対象ページ:** index, login, register, terms, privacy, content-guidelines, copyright-policy, revenue-sharing

#### ナビバー（PC）
```
[Publisher Logo] | Browse | Features | About | [🌐言語] | [Sign In] [Sign Up]
```

#### ハンバーガーメニュー（モバイル展開時）
```
Browse（作品を探す）
Features（特徴）
About（概要）
─────────────────────
FAQ（よくある質問）           ← FAQへのアクセス追加
Contact（お問い合わせ）
─────────────────────
Terms（利用規約）
Privacy（プライバシー）
─────────────────────
Sign In（ログイン）
Sign Up（新規登録）
```

---

### 🔧 パターンE: 管理画面

**対象ページ:** admin/*

#### ナビバー（PC）
```
[Publisher Logo] [ADMIN] | Dashboard | Users | Content | Support | [🌐言語] | [👤管理者▼]
```

#### サイドバー or ハンバーガー
```
Dashboard（ダッシュボード）
─────────────────────
Users（ユーザー管理）
Content（コンテンツ管理）
Feedback（フィードバック管理）
Support（サポート管理）
Analytics（分析）
─────────────────────
Settings（設定）
```

---

### ⚡ パターンS: シンプル版

**対象ページ:** reader, manga-viewer, editor, payment-success, payment-cancel, confirm-delete

#### ナビバー（最小限）
```
[← 戻る] | [タイトル/ページ名] | [🌐言語] | [👤ユーザー]
```

- フルスクリーン表示を優先
- メニュー項目は最小限
- 「戻る」ボタンで前のページに戻れる

---

## 5. ページ別パターン一覧（実装用）

| # | ページ | パス | パターン | 優先度 |
|---|--------|------|:--------:|:------:|
| 1 | library.html | pages/ | A | ✅完了 |
| 2 | tickets.html | pages/support/ | C | 📋要確認 |
| 3 | contact.html | pages/support/ | C | ✅完了 |
| 4 | faq.html | pages/support/ | C | ✅完了 |
| 5 | browse.html | pages/ | A | 🔴高 |
| 6 | dashboard.html | pages/ | B | 🔴高 |
| 7 | index.html | / | D | 🔴高 |
| 8 | notifications.html | pages/ | A | 🟡中 |
| 9 | account-settings.html | pages/ | A | 🟡中 |
| 10 | checkout.html | pages/ | A | 🟡中 |
| 11 | upload.html | pages/ | B | 🟡中 |
| 12 | analytics.html | pages/ | B | 🟡中 |
| 13 | troubleshoot.html | pages/support/ | C | 🟡中 |
| 14 | login.html | pages/ | D | 🟡中 |
| 15 | register.html | pages/ | D | 🟡中 |
| 16 | feedback/index.html | pages/feedback/ | A | 🟢低 |
| 17 | feedback/report.html | pages/feedback/ | A | 🟢低 |
| 18 | manga-translator.html | pages/ | B | 🟢低 |
| 19 | translation-status.html | pages/ | B | 🟢低 |
| 20 | translators/index.html | pages/translators/ | B | 🟢低 |
| 21 | translators/register.html | pages/translators/ | B | 🟢低 |
| 22 | upload-work.html | pages/ | B | 🟢低 |
| 23 | register-author.html | pages/ | B | 🟢低 |
| 24 | register-editor.html | pages/ | B | 🟢低 |
| 25 | register-translator.html | pages/ | B | 🟢低 |
| 26 | reader.html | pages/ | S | 🟢低 |
| 27 | manga-viewer.html | pages/ | S | 🟢低 |
| 28 | editor.html | pages/ | S | 🟢低 |
| 29 | payment-success.html | pages/ | S | 🟢低 |
| 30 | payment-cancel.html | pages/ | S | 🟢低 |
| 31 | confirm-delete.html | pages/ | S | 🟢低 |
| 32 | terms.html | pages/ | D | 🟢低 |
| 33 | privacy.html | pages/ | D | 🟢低 |
| 34 | content-guidelines.html | pages/ | D | 🟢低 |
| 35 | copyright-policy.html | pages/ | D | 🟢低 |
| 36 | revenue-sharing.html | pages/ | D | 🟢低 |
| 37-40 | admin/* | pages/admin/ | E | 🔵別途 |

---

## 6. 翻訳キー一覧（9言語対応）

### 共通ナビゲーション
```javascript
navBrowse: { en: 'Browse', ja: '作品を探す', ... }
navLibrary: { en: 'Library', ja: 'ライブラリ', ... }
navDashboard: { en: 'Dashboard', ja: 'ダッシュボード', ... }
navUpload: { en: 'Upload', ja: 'アップロード', ... }
navAnalytics: { en: 'Analytics', ja: '分析', ... }
navMyWorks: { en: 'My Works', ja: '作品管理', ... }
```

### ユーザーメニュー
```javascript
menuAccountSettings: { en: 'Account Settings', ja: 'アカウント設定', ... }
menuDashboard: { en: 'Creator Dashboard', ja: 'クリエイターダッシュボード', ... }
menuLibrary: { en: 'My Library', ja: 'ライブラリ', ... }
menuLogout: { en: 'Log Out', ja: 'ログアウト', ... }
logOutConfirm: { en: 'Are you sure you want to log out?', ja: 'ログアウトしますか？', ... }
```

### サポート
```javascript
navFAQ: { en: 'FAQ', ja: 'よくある質問', ... }
navContact: { en: 'Contact', ja: 'お問い合わせ', ... }
navTickets: { en: 'My Tickets', ja: 'チケット', ... }
navTroubleshoot: { en: 'Troubleshooting', ja: 'トラブルシューティング', ... }
```

### 翻訳ツール
```javascript
navTranslationTools: { en: 'Translation Tools', ja: '翻訳ツール', ... }
navMangaTranslator: { en: 'Manga Translator', ja: 'マンガ翻訳', ... }
navTranslationStatus: { en: 'Translation Status', ja: '翻訳状況', ... }
navFindTranslators: { en: 'Find Translators', ja: '翻訳者を探す', ... }
```

### フィードバック
```javascript
navFeedback: { en: 'Feedback', ja: 'フィードバック', ... }
navReportIssue: { en: 'Report Translation Issue', ja: '翻訳の問題を報告', ... }
```

### 認証
```javascript
navSignIn: { en: 'Sign In', ja: 'ログイン', ... }
navSignUp: { en: 'Sign Up', ja: '新規登録', ... }
```

---

## 7. 将来の検討事項

### 📝 読者レビュー機能
現在、作品に対する読者レビューを書けるページが見当たりません。以下のいずれかで対応を検討：

1. **既存ページに追加**
   - `reader.html` または `manga-viewer.html` に「レビューを書く」ボタンを追加
   - 読了後にレビュー投稿フォームを表示

2. **新規ページを作成**
   - `pages/review.html` - レビュー投稿ページ
   - `pages/reviews/[work_id].html` - 作品別レビュー一覧

3. **Library内で対応**
   - `library.html` で購入済み作品にレビューアイコンを追加

**推奨:** reader.html / manga-viewer.html で読了後にレビューを促すのが自然

---

## 8. 実装時の注意点（重要）

### 📋 各ページで確認する7項目チェックリスト

| # | 項目 | 確認内容 |
|---|------|----------|
| 1 | **ナビバー構造** | パターンに合ったメニュー項目があるか |
| 2 | **ハンバーガーメニュー** | モバイル時の展開メニュー内容が正しいか |
| 3 | **言語セレクター位置** | PC: ナビバー右側 / モバイル: ハンバーガー横 |
| 4 | **ユーザードロップダウン** | アカウントマークとメニューが表示されるか |
| 5 | **翻訳機能** | 言語切替で全要素が翻訳されるか |
| 6 | **PC/モバイル統一** | PC画面とハンバーガーメニューの項目が一致しているか |
| 7 | **モバイルスクロール** | ハンバーガーメニューが長い時にスクロールできるか |

### ⚠️ PC画面とハンバーガーメニューの統一

**問題:** PC画面のナビバーとハンバーガーメニューで表示項目が異なると、ユーザーが混乱する

**解決策:** 
- PC用とモバイル用で別々の`<ul>`を作らない
- 1つの`<ul>`にまとめて、`auth-only`/`guest-only`クラスで表示制御
- 共通項目（Browse, Support等）はクラスなしで常に表示

**悪い例（重複が発生）:**
```html
<!-- PC用 -->
<ul class="d-none d-lg-flex guest-only">
    <li>Browse</li>
</ul>
<ul class="d-none d-lg-flex auth-only">
    <li>Browse</li>  <!-- 重複！ -->
    <li>Library</li>
</ul>
```

**良い例（統一）:**
```html
<!-- PC/モバイル共通 -->
<ul class="navbar-nav">
    <li>Browse</li>  <!-- 共通：常に表示 -->
    <li class="auth-only">Library</li>  <!-- ログイン時のみ -->
    <li class="guest-only">Sign In</li>  <!-- 未ログイン時のみ -->
</ul>
```

### ⚠️ モバイルハンバーガーメニューのスクロール対応

**問題:** メニュー項目が多いと、画面下部の項目が見えない・タップできない

**解決策:** 以下のCSSを適用

```css
@media (max-width: 991.98px) {
    /* メニューが開いている時はfixed表示 */
    .navbar-collapse.show,
    .navbar-collapse.collapsing {
        position: fixed;
        top: 56px;  /* ナビバーの高さ */
        left: 0;
        right: 0;
        background: var(--color-bg-card);
        border-bottom: 1px solid var(--color-border);
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 1040;
        max-height: 70vh;  /* 画面の70%まで */
        overflow-y: auto;  /* スクロール可能に */
        padding: 0.5rem 1rem;
    }
    
    /* メニュー背景オーバーレイ */
    .navbar-overlay {
        display: none;
        position: fixed;
        top: 56px;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1030;
    }
    
    .navbar-overlay.show {
        display: block;
    }
    
    /* メニューが開いている時にbodyのスクロールを無効化 */
    body.menu-open {
        overflow: hidden;
    }
}
```

**JavaScript（オーバーレイ制御）:**
```javascript
const navbarCollapse = document.getElementById('navbarNav');
const navbarOverlay = document.getElementById('navbarOverlay');

navbarCollapse.addEventListener('show.bs.collapse', function() {
    document.body.classList.add('menu-open');
    if (navbarOverlay) navbarOverlay.classList.add('show');
});

navbarCollapse.addEventListener('hide.bs.collapse', function() {
    document.body.classList.remove('menu-open');
    if (navbarOverlay) navbarOverlay.classList.remove('show');
});

// オーバーレイクリックでメニューを閉じる
if (navbarOverlay) {
    navbarOverlay.addEventListener('click', function() {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) bsCollapse.hide();
    });
}
```

### ⚠️ ログイン状態のテスト方法

実際にログインせずにログイン状態をシミュレートする方法：

```javascript
// ログイン状態にする
function simulateLogin() {
    document.querySelectorAll('.auth-only').forEach(el => {
        el.style.display = '';
    });
    document.querySelectorAll('.guest-only').forEach(el => {
        el.style.display = 'none';
    });
    
    // ユーザー情報を設定
    const userName = document.getElementById('userName');
    const userDisplayName = document.getElementById('userDisplayName');
    const userEmail = document.getElementById('userEmail');
    if (userName) userName.textContent = 'Test User';
    if (userDisplayName) userDisplayName.textContent = 'Test User';
    if (userEmail) userEmail.textContent = 'test@example.com';
    
    console.log('✅ ログイン状態にしました');
}
simulateLogin();

// ゲスト状態に戻す
function simulateLogout() {
    document.querySelectorAll('.guest-only').forEach(el => {
        el.style.display = '';
    });
    document.querySelectorAll('.auth-only').forEach(el => {
        el.style.display = 'none';
    });
    console.log('✅ ゲスト状態にしました');
}
simulateLogout();
```

---

## 9. 実装の進め方

### Step 1: 基準パターンを確立
1. ✅ library.html（パターンA完成）
2. ✅ contact.html（パターンC完成 - 参考元）
3. ✅ faq.html（パターンC完成）
4. 📋 tickets.html（パターンC - 要確認）
5. 🔜 dashboard.html（パターンB基準）
6. 🔜 index.html（パターンD基準）

### Step 2: 高優先度ページを実装
7. browse.html（パターンA）
8. notifications.html（パターンA）
9. account-settings.html（パターンA）

### Step 3: クリエイター向けページ
10. upload.html（パターンB）
11. analytics.html（パターンB）

### Step 4: サポートページ
12. troubleshoot.html（パターンC）

### Step 5: 残りのページ
13. その他全ページ

---

最終更新: 2026年1月30日
