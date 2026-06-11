# AuctLect ナビバー・メニュー設計書 v3

## 変更履歴
- **v3 (2026-01-30)**: パターンCをログイン状態対応に修正、PCナビバーとハンバーガーメニューの項目統一
- v2 (2026-01-28): 初版

---

## 1. 重要な設計原則

### ✅ 原則1: PCナビバーとハンバーガーメニューの項目は一致させる
ハンバーガーメニュー展開時に、PC画面に存在しない項目が出てくるのは混乱の原因となる。

### ✅ 原則2: ログイン状態による表示切り替え
同じページでも、ゲストとログインユーザーで表示するメニュー項目を変える。
**実装方法**: 1つのHTMLファイル内でJavaScriptにより動的に切り替え。

### ✅ 原則3: 必要な項目だけを表示
- ゲストには認証が必要な機能（Dashboard, Library, Upload等）を表示しない
- ログインユーザーには認証済み機能を表示

---

## 2. ユーザー状態の定義

| 状態 | 説明 | 判定方法 |
|------|------|----------|
| 🔓 **ゲスト** | 未ログイン | `isLoggedIn === false` |
| 👤 **ログイン済み** | アカウントあり（作品の有無に関わらず同じメニュー） | `isLoggedIn === true` |
| 🔧 **管理者** | プラットフォーム管理者 | `isAdmin === true` |

**注意**: 作品をアップロードしていないユーザーにもDashboard等を表示する。
Dashboardページ自体に「まだ作品がありません。最初の作品をアップロードしましょう！」と表示することで対応。

---

## 3. メニューパターン（5種類）

| パターン | 用途 | ログイン状態対応 |
|----------|------|------------------|
| **A** | 読者向けページ | ログイン必須 |
| **B** | クリエイター向けページ | ログイン必須 |
| **C** | サポートページ | ✅ ゲスト/ログインで切り替え |
| **D** | 公開ページ（トップ、利用規約等） | ✅ ゲスト/ログインで切り替え |
| **E** | 管理画面 | 管理者必須 |
| **S** | シンプル版（読書・編集） | 最小限メニュー |

---

## 4. パターンC: サポートページ（詳細設計）

**対象ページ**: faq.html, contact.html, tickets.html, troubleshoot.html

### 🔓 ゲスト（未ログイン）の場合

#### PCナビバー
```
[AuctLect Logo] | Browse | FAQ | 🌐 | [Sign In]
```

#### ハンバーガーメニュー（モバイル展開時）
```
Browse（作品を探す）
─────────────────────
FAQ（よくある質問）
Troubleshooting（トラブルシューティング）
Contact（お問い合わせ）
─────────────────────
Home（ホーム）
Sign In（ログイン）
```

**表示しないもの**: Dashboard, Library, Upload, My Tickets, Translation Tools, 通知ベル, ユーザードロップダウン

---

### 👤 ログイン済みの場合

#### PCナビバー
```
[AuctLect Logo] | Browse | Library | Dashboard | 🔔 | 🌐 | 👤▼
```

#### ハンバーガーメニュー（モバイル展開時）
```
Browse（作品を探す）
Library（ライブラリ）
─────────────────────
Dashboard（ダッシュボード）
Upload（アップロード）
Translation Tools（翻訳ツール）▶
  ├ Manga Translator（マンガ翻訳）
  ├ Translation Status（翻訳状況）
  └ Find Translators（翻訳者を探す）
─────────────────────
FAQ（よくある質問）
Troubleshooting（トラブルシューティング）
Contact（お問い合わせ）
My Tickets（マイチケット）
─────────────────────
Home（ホーム）
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

## 5. パターンD: 公開ページ（詳細設計）

**対象ページ**: index.html, login.html, register.html, terms.html, privacy.html, content-guidelines.html, copyright-policy.html, revenue-sharing.html

### 🔓 ゲスト（未ログイン）の場合

#### PCナビバー
```
[AuctLect Logo] | Browse | Features | About | 🌐 | [Sign In] [Sign Up]
```

#### ハンバーガーメニュー（モバイル展開時）
```
Browse（作品を探す）
Features（特徴）
About（概要）
─────────────────────
FAQ（よくある質問）
Contact（お問い合わせ）
─────────────────────
Terms（利用規約）
Privacy（プライバシー）
─────────────────────
Sign In（ログイン）
Sign Up（新規登録）
```

---

### 👤 ログイン済みの場合

#### PCナビバー
```
[AuctLect Logo] | Browse | Library | Dashboard | 🔔 | 🌐 | 👤▼
```

#### ハンバーガーメニュー（モバイル展開時）
```
Browse（作品を探す）
Library（ライブラリ）
─────────────────────
Dashboard（ダッシュボード）
Upload（アップロード）
─────────────────────
FAQ（よくある質問）
Contact（お問い合わせ）
─────────────────────
Home（ホーム）
```

---

## 6. パターンA: 読者向けページ（ログイン必須）

**対象ページ**: browse.html, library.html, checkout.html, notifications.html, account-settings.html, feedback/*

#### PCナビバー
```
[AuctLect Logo] | Browse | Library | 🔔 | 🌐 | 👤▼
```

#### ハンバーガーメニュー（モバイル展開時）
```
Browse（作品を探す）
Library（ライブラリ）
─────────────────────
Upload Work（作品をアップロード）
Dashboard（ダッシュボード）
─────────────────────
Feedback（翻訳の問題を報告）
─────────────────────
FAQ（よくある質問）
Contact（お問い合わせ）
```

#### ユーザードロップダウン
```
Account Settings（アカウント設定）
Creator Dashboard（クリエイターダッシュボード）
─────────────────────
Log Out（ログアウト）
```

---

## 7. パターンB: クリエイター向けページ（ログイン必須）

**対象ページ**: dashboard.html, upload.html, upload-work.html, analytics.html, manga-translator.html, translation-status.html, translators/*, register-author.html, register-editor.html, register-translator.html

#### PCナビバー
```
[AuctLect Logo] | Dashboard | My Works | Analytics | 🔔 | 🌐 | 👤▼
```

#### ハンバーガーメニュー（モバイル展開時）
```
Dashboard（ダッシュボード）
My Works（作品管理）
Analytics（分析）
Upload（アップロード）
─────────────────────
Translation Tools（翻訳ツール）▶
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
Account Settings（アカウント設定）
My Library（ライブラリ）
─────────────────────
Log Out（ログアウト）
```

---

## 8. JavaScript実装パターン

```javascript
// ログイン状態を取得
const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

function updateNavigation() {
    // ゲスト用要素
    const guestElements = document.querySelectorAll('.guest-only');
    // ログインユーザー用要素
    const authElements = document.querySelectorAll('.auth-only');
    
    if (isLoggedIn) {
        guestElements.forEach(el => el.style.display = 'none');
        authElements.forEach(el => el.style.display = '');
    } else {
        guestElements.forEach(el => el.style.display = '');
        authElements.forEach(el => el.style.display = 'none');
    }
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', updateNavigation);
```

### HTML側の実装
```html
<!-- ゲスト用（未ログイン時のみ表示） -->
<li class="nav-item guest-only">
    <a href="login.html">Sign In</a>
</li>

<!-- ログインユーザー用（ログイン時のみ表示） -->
<li class="nav-item auth-only" style="display: none;">
    <a href="dashboard.html">Dashboard</a>
</li>
```

---

## 9. Dashboardページの追加要件

作品をアップロードしていないユーザーがDashboardを開いた場合、以下のメッセージを表示：

```
┌─────────────────────────────────────────────────┐
│  📚 まだ作品がありません                         │
│                                                 │
│  最初の作品をアップロードしましょう！             │
│                                                 │
│  [作品をアップロード] ボタン                      │
└─────────────────────────────────────────────────┘
```

翻訳キー:
```javascript
dashboard: {
    noWorks: {
        en: "You don't have any works yet",
        ja: "まだ作品がありません"
    },
    uploadFirst: {
        en: "Upload your first work to get started!",
        ja: "最初の作品をアップロードしましょう！"
    },
    uploadButton: {
        en: "Upload Work",
        ja: "作品をアップロード"
    }
}
```

---

## 10. 実装チェックリスト

### パターンC（サポートページ）各ページの確認項目

#### ゲスト状態で確認
- [ ] PCナビバー: Browse, FAQ, 🌐, [Sign In] のみ表示
- [ ] ハンバーガー: Browse, FAQ, Troubleshooting, Contact, Home, Sign In のみ表示
- [ ] Dashboard, Library, Upload, My Tickets が非表示
- [ ] 通知ベル非表示
- [ ] ユーザードロップダウン非表示

#### ログイン状態で確認
- [ ] PCナビバー: Browse, Library, Dashboard, 🔔, 🌐, 👤 表示
- [ ] ハンバーガー: 全項目表示（Browse, Library, Dashboard, Upload, Translation Tools, FAQ, Troubleshooting, Contact, My Tickets, Home）
- [ ] Sign In 非表示
- [ ] ユーザードロップダウン表示・動作

---

## 11. 全ページ一覧と分類（48ページ）

| # | ページ | パス | パターン | ログイン対応 |
|---|--------|------|:--------:|:------------:|
| 1 | browse.html | pages/ | A | 必須 |
| 2 | library.html | pages/ | A | 必須 |
| 3 | checkout.html | pages/ | A | 必須 |
| 4 | notifications.html | pages/ | A | 必須 |
| 5 | account-settings.html | pages/ | A | 必須 |
| 6 | feedback/index.html | pages/feedback/ | A | 必須 |
| 7 | feedback/report.html | pages/feedback/ | A | 必須 |
| 8 | dashboard.html | pages/ | B | 必須 |
| 9 | upload.html | pages/ | B | 必須 |
| 10 | upload-work.html | pages/ | B | 必須 |
| 11 | analytics.html | pages/ | B | 必須 |
| 12 | manga-translator.html | pages/ | B | 必須 |
| 13 | translation-status.html | pages/ | B | 必須 |
| 14 | translators/index.html | pages/translators/ | B | 必須 |
| 15 | translators/register.html | pages/translators/ | B | 必須 |
| 16 | register-author.html | pages/ | B | 必須 |
| 17 | register-editor.html | pages/ | B | 必須 |
| 18 | register-translator.html | pages/ | B | 必須 |
| 19 | faq.html | pages/support/ | C | ✅ 切替 |
| 20 | contact.html | pages/support/ | C | ✅ 切替 |
| 21 | tickets.html | pages/support/ | C | ✅ 切替 |
| 22 | troubleshoot.html | pages/support/ | C | ✅ 切替 |
| 23 | index.html | / | D | ✅ 切替 |
| 24 | login.html | pages/ | D | ✅ 切替 |
| 25 | register.html | pages/ | D | ✅ 切替 |
| 26 | terms.html | pages/ | D | ✅ 切替 |
| 27 | privacy.html | pages/ | D | ✅ 切替 |
| 28 | content-guidelines.html | pages/ | D | ✅ 切替 |
| 29 | copyright-policy.html | pages/ | D | ✅ 切替 |
| 30 | revenue-sharing.html | pages/ | D | ✅ 切替 |
| 31 | reader.html | pages/ | S | - |
| 32 | manga-viewer.html | pages/ | S | - |
| 33 | editor.html | pages/ | S | - |
| 34 | payment-success.html | pages/ | S | - |
| 35 | payment-cancel.html | pages/ | S | - |
| 36 | confirm-delete.html | pages/ | S | - |
| 37-40 | admin/* | pages/admin/ | E | 管理者 |

---

最終更新: 2026年1月30日
