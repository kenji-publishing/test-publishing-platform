# Publisher Platform 引き継ぎドキュメント

最終更新: 2025年12月27日

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
| 多言語対応 | translations.js / language-switcher.js（9言語） |

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
| 12-1 | 多言語基盤（translations.js, language-switcher.js） | ✅ |
| 12-2 | 各ページ多言語対応（12ページ） | ✅ |
| 12-3 | 全ページ動作確認 | ✅ |

### 次のフェーズ候補

| オプション | 内容 |
|-----------|------|
| A | 残りの未対応ページの多言語化（account-settings.html, editor.html など） |
| B | Phase 13: テスト・品質保証（本番公開前の最終チェック） |
| C | その他の機能追加 |

---

## 5. 多言語対応済みページ一覧

### Phase 12で対応したページ（12ページ）

| ファイル | 言語セレクター | data-i18n属性 | 状態 |
|----------|:-------------:|:-------------:|:----:|
| index.html | ✅ | ✅ | 完了 |
| pages/login.html | ✅ | ✅ | 完了 |
| pages/register.html | ✅ | ✅ | 完了 |
| pages/dashboard.html | ✅ | ✅ | 完了 |
| pages/notifications.html | ✅ | ✅ | 完了 |
| pages/browse.html | ✅ | ✅ | 完了 |
| pages/analytics.html | ✅ | ✅ | 完了 |
| pages/checkout.html | ✅ | ✅ | 完了 |
| pages/upload-work.html | ✅ | ✅ | 完了 |
| pages/payment-success.html | ✅ | ✅ | 完了 |
| pages/payment-cancel.html | ✅ | ✅ | 完了 |
| pages/translation-status.html | ✅ | ✅ | 完了 |

### 翻訳ファイル

| ファイル | サイズ | 説明 |
|----------|--------|------|
| js/translations.js | 60,761バイト | 9言語の翻訳データ |
| js/language-switcher.js | 11,264バイト | 言語切り替え機能 |

### 対応言語（9言語）

| コード | 言語 | フラグ |
|--------|------|--------|
| en | English | 🇬🇧 |
| ja | 日本語 | 🇯🇵 |
| zh | 中文 | 🇨🇳 |
| es | Español | 🇪🇸 |
| fr | Français | 🇫🇷 |
| de | Deutsch | 🇩🇪 |
| ko | 한국어 | 🇰🇷 |
| ar | العربية | 🇸🇦 |
| pt | Português | 🇧🇷 |

---

## 6. 重要なファイル

### 多言語対応関連

| ファイル | 説明 |
|----------|------|
| `js/translations.js` | 全翻訳データ（9言語） |
| `js/language-switcher.js` | 言語切り替えロジック |

### モバイル最適化関連

| ファイル | 説明 |
|----------|------|
| `css/mobile-fixes.css` | モバイル用CSS |
| `css/style-new.css` | 共通スタイル |

---

## 7. サーバー起動方法

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

## 8. GitHubからの更新取得

```powershell
cd C:\Projects\test-publishing-platform
git pull
npm start
```

---

## 9. 言語切り替えの確認方法

1. http://localhost:8000 を開く
2. 右上の言語セレクターをクリック
3. 任意の言語を選択（例: 🇯🇵 日本語）
4. ページ内のテキストが選択した言語に変わることを確認
5. ページを移動しても選択した言語が維持されることを確認

---

## 10. モバイル表示の確認方法

1. http://localhost:8000 を開く
2. `F12` キーで開発者ツールを開く
3. 📱アイコン（デバイスツールバー）をクリック
4. デバイスを選択（iPhone 12 Pro など）

---

## 11. 注意事項

### API URLの注意
- ❌ `/api/...` → 404エラー
- ✅ `http://localhost:3000/api/...` → 正しい

### ブラウザキャッシュ
コード更新後に動作がおかしい場合：`Ctrl + Shift + R`

### データベース主キー
users, works, notifications の主キーは **UUID型** です。

---

## 12. 新しいChatでの開始方法

1. このドキュメントをClaudeにアップロード
2. 「Phase 12完了済み。次のフェーズを選びたい」と伝える
3. `git pull` で最新コードを取得
4. サーバーを起動して動作確認

---

## 13. 参考リンク

| 項目 | URL |
|------|-----|
| GitHubリポジトリ | https://github.com/kenji-publishing/test-publishing-platform |
| 管理画面 | http://localhost:8000/pages/admin/index.html |
| 通知センター（デモ） | http://localhost:8000/pages/notifications.html?demo=true |
| アカウント設定（デモ） | http://localhost:8000/pages/account-settings.html?demo=true |
| チケット（デモ） | http://localhost:8000/pages/support/tickets.html?demo=true |

---

## 14. 最近のコミット履歴（Phase 12）

| コミットSHA | 内容 | 日付 |
|-------------|------|------|
| 70763ce | モバイルで言語セレクターを常に表示（index.html修正） | 2025-12-27 |
| c7f62fc | translations.jsにtranslation翻訳キー追加 | 2025-12-23 |
| da81bc1 | translation-status.html多言語対応 | 2025-12-23 |
| c6cbe12 | payment-success.html, payment-cancel.html多言語対応 | 2025-12-23 |
| 97291fc | upload-work.html多言語対応 | 2025-12-23 |
| 7b9ad45 | checkout.html多言語対応 | 2025-12-23 |
| e0d6ba0 | analytics.html多言語対応 | 2025-12-23 |
| 843b5f8 | browse.html多言語対応 | 2025-12-23 |

---

## 15. Phase 12-3 テスト結果サマリー（2025-12-27完了）

### 12-3-1 言語切り替え機能テスト
全12ページで言語切り替えが正常に動作することを確認 ✅

### 12-3-2 翻訳キー網羅性チェック
全12ページで翻訳漏れがないことを確認 ✅

### 12-3-3 モバイル対応確認
- 全12ページでモバイル表示を確認 ✅
- index.htmlの言語セレクターがモバイルで隠れていた問題を修正 ✅

---

最終更新: 2025年12月27日
