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
| 対応言語 | 日本語、英語、中国語、スペイン語、フランス語、ドイツ語、韓国語、アラビア語 |
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

### 完了済みフェーズ（詳細は publisher_phase_history.md 参照）

| Phase | 内容 | 状態 |
|-------|------|:----:|
| 1-7 | 基本機能・認証・決済・AI翻訳・管理画面 | ✅ |
| 8 | サポートシステム（FAQ・チケット・自動メール） | ✅ |
| 9 | 通知センター | ✅ |
| 10 | アナリティクス | ✅ |
| 11A | モバイルレイアウト最適化 | ✅ |
| 11B | タッチ操作最適化 | ✅ |
| 11C | パフォーマンス最適化 | ✅ |

### Phase 11C 完了内容

| ステップ | 内容 | 成果 |
|----------|------|------|
| 11C-1 | 画像の遅延読み込み | `lazy-loader.js` 作成、manga-viewer適用 |
| 11C-2 | CSS最適化 | `style-new.css` 52%削減（27KB→13KB） |
| 11C-3 | JavaScript最適化 | `utils.js` 共通ユーティリティ作成 |

### 次のフェーズ候補

- Phase 12: テスト・品質保証
- Phase 12: SEO最適化
- Phase 12: セキュリティ強化

---

## 5. 重要なファイル

### CSSファイル構成

| ファイル | サイズ | 用途 |
|----------|--------|------|
| `css/style-new.css` | 13KB | メインスタイル |
| `css/mobile-fixes.css` | 30KB | モバイル最適化 + Lazy Loading |
| `css/style.css` | 2.6KB | ❌ 古い未使用（削除可） |

### JavaScriptファイル構成

| ファイル | サイズ | 用途 |
|----------|--------|------|
| `js/utils.js` | 11KB | 共通ユーティリティ（新規） |
| `js/lazy-loader.js` | 10KB | 画像遅延読み込み |
| `js/header-notification.js` | 10KB | ヘッダー通知 |
| `js/translations.js` | 13KB | 多言語翻訳データ |
| `js/main.js` | 3.5KB | 共通機能 |
| `js/touch-interactions.js` | 23KB | 未使用（将来用） |
| `js/notification-badge.js` | 3.4KB | 通知バッジ（header-notification.jsと重複） |

### 削除推奨ファイル
- `css/style.css` - 古い未使用
- `js/notification-badge.js` - header-notification.jsと重複

---

## 6. サーバー起動方法

### 起動手順

1. **PowerShellを開く**
2. **プロジェクトフォルダに移動**
   ```
   cd C:\Projects\test-publishing-platform
   ```
3. **サーバーを起動**
   ```
   npm start
   ```
4. **成功確認** - 以下が表示されればOK：
   ```
   Server running on port 3000
   Frontend server running on port 8000
   ```

### 停止方法
PowerShellで `Ctrl + C`

---

## 7. GitHubからの更新取得

```powershell
cd C:\Projects\test-publishing-platform
git pull
npm start
```

---

## 8. モバイル表示の確認方法

1. http://localhost:8000 を開く
2. `F12` キーで開発者ツールを開く
3. 📱アイコン（デバイスツールバー）をクリック
4. デバイスを選択（iPhone 12 Pro など）

---

## 9. 注意事項

### API URLの注意
- ❌ `/api/...` → 404エラー
- ✅ `http://localhost:3000/api/...` → 正しい

### ブラウザキャッシュ
コード更新後に動作がおかしい場合：`Ctrl + Shift + R`

### データベース主キー
users, works, notifications の主キーは **UUID型** です。

### JavaScript読み込みのベストプラクティス
```html
<!-- defer属性を使用してページ読み込みをブロックしない -->
<script src="../js/utils.js" defer></script>
<script src="../js/main.js" defer></script>
```

---

## 10. 新しいChatでの開始方法

1. このドキュメントをClaudeにアップロード
2. 「Phase 12から続けてください」と伝える
3. `git pull` で最新コードを取得
4. サーバーを起動して動作確認

---

## 11. 参考リンク

| 項目 | URL |
|------|-----|
| GitHubリポジトリ | https://github.com/kenji-publishing/test-publishing-platform |
| 管理画面 | http://localhost:8000/pages/admin/index.html |
| 漫画ビューワー | http://localhost:8000/pages/manga-viewer.html |
| 通知センター（デモ） | http://localhost:8000/pages/notifications.html?demo=true |
| アカウント設定（デモ） | http://localhost:8000/pages/account-settings.html?demo=true |
| チケット（デモ） | http://localhost:8000/pages/support/tickets.html?demo=true |

---

最終更新: 2025年12月23日
