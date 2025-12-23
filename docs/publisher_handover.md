# Publisher Platform 引き継ぎドキュメント

最終更新: 2025年12月23日

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
| 対応言語 | 日本語、英語、中国語、スペイン語、フランス語、ドイツ語、韓国語、アラビア語、**ポルトガル語** |
| 収益分配 | 著者40-70%、翻訳者20%、編集者10%、プラットフォーム30% |
| 目標 | 低予算・少人数での運営（FAQ・通知・セルフサービスの自動化） |

---

## 2. 環境情報

### ファイルパス
```
C:\Projects\test-publishing-platform\
```

### サーバーURL

| 用途 | URL |
|------|-----|
| フロントエンド | http://localhost:8000 |
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

---

## 4. 開発進捗

### 完了済みフェーズ

| Phase | 内容 | 状態 |
|-------|------|:----:|
| 1-7 | 基本機能・認証・決済・AI翻訳・管理画面 | ✅ |
| 8 | サポートシステム（FAQ・チケット・自動メール） | ✅ |
| 9 | 通知センター | ✅ |
| 10 | アナリティクス | ✅ |
| 11A | モバイルレイアウト最適化 | ✅ |
| 11B | タッチ操作最適化 | ✅ |
| 11C | パフォーマンス最適化 | ✅ |
| 12-1 | 9言語対応（ポルトガル語追加） | ✅ |

### 現在のフェーズ: Phase 12 多言語対応

| ステップ | 内容 | 状態 |
|----------|------|:----:|
| 12-1 | 9言語対応（ポルトガル語追加） | ✅ |
| **12-2** | **翻訳データの整備** | **→ 次** |
| 12-3 | 言語切り替え機能の完成 | ⬜ |

### Phase 12-1 完了内容

- ✅ `translations.js` を9言語対応に拡張
  - 新規追加: 韓国語(ko)、アラビア語(ar)、ポルトガル語(pt)
  - 既存: 英語(en)、日本語(ja)、中国語(zh)、スペイン語(es)、フランス語(fr)、ドイツ語(de)
- ✅ `language-switcher.js` を更新
  - 9言語対応
  - RTL（右から左）対応（アラビア語）
  - 言語セレクターHTML生成機能
  - ブラウザ言語自動検出

---

## 5. 対応言語一覧

| コード | 言語 | ネイティブ名 | フラグ | RTL |
|--------|------|-------------|--------|:---:|
| en | English | English | 🇬🇧 | - |
| ja | Japanese | 日本語 | 🇯🇵 | - |
| zh | Chinese | 中文 | 🇨🇳 | - |
| es | Spanish | Español | 🇪🇸 | - |
| fr | French | Français | 🇫🇷 | - |
| de | German | Deutsch | 🇩🇪 | - |
| ko | Korean | 한국어 | 🇰🇷 | - |
| ar | Arabic | العربية | 🇸🇦 | ✅ |
| pt | Portuguese | Português | 🇧🇷 | - |

---

## 6. 重要なファイル

### 多言語関連

| ファイル | サイズ | 用途 |
|----------|--------|------|
| `js/translations.js` | 31KB | 翻訳データ（9言語） |
| `js/language-switcher.js` | 11KB | 言語切り替え機能 |

### CSSファイル

| ファイル | サイズ | 用途 |
|----------|--------|------|
| `css/style-new.css` | 13KB | メインスタイル |
| `css/mobile-fixes.css` | 30KB | モバイル最適化 |

### JavaScriptファイル

| ファイル | サイズ | 用途 |
|----------|--------|------|
| `js/utils.js` | 11KB | 共通ユーティリティ |
| `js/lazy-loader.js` | 10KB | 画像遅延読み込み |
| `js/header-notification.js` | 10KB | ヘッダー通知 |

---

## 7. サーバー起動方法

### 起動手順

1. **PowerShellを開く**
2. **プロジェクトフォルダに移動**
   ```
   cd C:\Projects\test-publishing-platform
   ```
3. **最新コードを取得**
   ```
   git pull
   ```
4. **サーバーを起動**
   ```
   npm start
   ```
5. **成功確認** - 以下が表示されればOK：
   ```
   Server running on port 3000
   Frontend server running on port 8000
   ```

### 停止方法
PowerShellで `Ctrl + C`

---

## 8. 言語切り替えの使い方

### HTMLでの使用例

```html
<!-- 翻訳対象の要素に data-i18n 属性を追加 -->
<span data-i18n="nav.dashboard">Dashboard</span>

<!-- プレースホルダーの翻訳 -->
<input data-i18n-placeholder="common.search" placeholder="Search">

<!-- 言語セレクター -->
<select class="language-selector">
    <option value="en">🇬🇧 English</option>
    <option value="ja">🇯🇵 日本語</option>
    <!-- ... -->
</select>

<!-- スクリプト読み込み順序（重要） -->
<script src="js/translations.js"></script>
<script src="js/language-switcher.js"></script>
```

---

## 9. 新しいChatでの開始方法

1. このドキュメントをClaudeにアップロード
2. 「Phase 12-2から続けてください」と伝える
3. `git pull` で最新コードを取得
4. サーバーを起動して動作確認

---

## 10. 参考リンク

| 項目 | URL |
|------|-----|
| GitHubリポジトリ | https://github.com/kenji-publishing/test-publishing-platform |
| 管理画面 | http://localhost:8000/pages/admin/index.html |
| 漫画ビューワー | http://localhost:8000/pages/manga-viewer.html |
| 通知センター（デモ） | http://localhost:8000/pages/notifications.html?demo=true |

---

最終更新: 2025年12月23日
