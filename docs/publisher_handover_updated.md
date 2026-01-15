# Publisher Platform 引き継ぎドキュメント

最終更新: 2026年1月4日

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
| 12-4a | account-settings.html 多言語対応 | ✅ |
| 12-4b | reader.html 多言語対応 | ✅ |
| 12-4c | analytics.html 翻訳キー追加 | ✅ |
| 12-4d | support/faq.html 多言語対応 | ✅ |
| 12-4e | FAQ内容（質問・回答）のDB多言語対応（33件×9言語） | ✅ |
| 12-5a | register-translator.html 多言語対応 | ✅ |
| 12-5b | register-editor.html 多言語対応 | ✅ |
| 12-5c | support/tickets.html 多言語対応・デザイン統一・デモチケット件名翻訳 | ✅ |
| 12-6a～12-6i | 残りページの多言語対応（contact, troubleshoot, translators, feedback, browse, upload, reader） | ✅ |
| 12-7a | editor.html 多言語対応 | ✅ |

### 現在進行中

| Phase | 内容 | 状態 |
|-------|------|:----:|
| 12-7 | 残りの未対応ページの多言語化（約9ページ） | 🔄 |

---

## 5. 今日完了した作業（2026-01-04）

### editor.html 多言語対応

#### 実施内容

1. **9言語対応の言語セレクター追加**
   - ナビバーに言語セレクターを配置
   - EN, 日本語, 中文, ES, FR, DE, 한국어, عربي, PT

2. **uiTextオブジェクトで70+の翻訳キーを定義**
   - ステータス（保存済み、保存中）
   - エクスポートメニュー
   - ツールバーボタン（元に戻す、やり直す、太字、斜体など）
   - 検索と置換パネル
   - コメントパネル
   - 画像挿入モーダル
   - フッター（語数、文字数、ページ数）
   - アラートメッセージ

3. **ドキュメントタイトルとエディター内テキストの多言語対応**
   - 「無題のドキュメント」が言語変更時に更新
   - 「タイトルを入力」と「ここから本文を書き始めてください...」も更新
   - ユーザーが編集済みの場合は上書きしない仕組み

4. **モバイルレスポンシブ対応**
   - 900px以下：ナビバー折り返しレイアウト
   - 480px以下：ボタンテキスト非表示（アイコンのみ）
   - 言語セレクターのはみ出し問題を修正

#### デバッグ作業

| 問題 | 原因 | 解決方法 |
|------|------|----------|
| 言語切り替えが動作しない | JavaScriptの構文エラー（Unexpected end of input） | ファイルを完全に再作成 |
| ドキュメントタイトルが翻訳されない | updateAllText()に処理がなかった | updateDefaultDocTitle()関数を追加 |
| モバイルで言語セレクターがはみ出す | レスポンシブCSSがなかった | @media queryを追加 |

---

## 6. 次回の作業（再開方法）

### 手順1: VSCodeを開く
`C:\Projects\test-publishing-platform` フォルダを開く

### 手順2: 最新コードを取得
ターミナルで以下を実行：
```bash
cd C:\Projects\test-publishing-platform
git pull
```

### 手順3: 次のページの多言語対応を開始
残り約9ページの中から優先度の高いものから対応

### 推奨する次の作業

| 優先度 | ファイル | 理由 |
|:------:|----------|------|
| 高 | register-author.html | 著者登録は主要機能 |
| 中 | manga-viewer.html | マンガビューアはユーザー向け機能 |
| 低 | terms.html など | 法的ページは後回しでOK |

---

## 7. 多言語対応済みページ一覧

### Phase 12で対応したページ（19ページ+α）

| ファイル | 言語セレクター | 多言語対応 | 状態 |
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
| pages/account-settings.html | ✅ | ✅ | 完了（12/29） |
| pages/reader.html | ✅ | ✅ | 完了（12/29） |
| pages/support/faq.html | ✅ | ✅ | 完了（12/29） |
| pages/register-translator.html | ✅ | ✅ | 完了（1/1） |
| pages/register-editor.html | ✅ | ✅ | 完了（1/1） |
| pages/support/tickets.html | ✅ | ✅ | 完了（1/2） |
| pages/support/contact.html | ✅ | ✅ | 完了（1/3） |
| pages/support/troubleshoot.html | ✅ | ✅ | 完了（1/3） |
| pages/translators/index.html | ✅ | ✅ | 完了（1/3） |
| pages/feedback/index.html | ✅ | ✅ | 完了（1/3） |
| pages/feedback/report.html | ✅ | ✅ | 完了（1/3） |
| pages/editor.html | ✅ | ✅ | 完了（1/4） |

### 未対応ページ一覧（残り約9ページ）

| 優先度 | ファイル | 内容 |
|:------:|----------|------|
| 高 | register-author.html | 著者登録 |
| 中 | manga-viewer.html | マンガビューア |
| 中 | manga-translator.html | マンガ翻訳 |
| 低 | terms.html | 利用規約 |
| 低 | privacy.html | プライバシーポリシー |
| 低 | content-guidelines.html | コンテンツガイドライン |
| 低 | copyright-policy.html | 著作権ポリシー |
| 低 | revenue-sharing.html | 収益分配説明 |
| 低 | confirm-delete.html | 削除確認 |

### 翻訳ファイル

| ファイル | 説明 |
|----------|------|
| js/translations.js | 9言語の翻訳データ（UI全般）約109KB |
| js/language-switcher.js | 言語切り替え機能 |
| js/faq-data.js | FAQ多言語データ（フォールバック用） |

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

## 8. 重要なファイル

### 多言語対応関連

| ファイル | 説明 |
|----------|------|
| `js/translations.js` | 全翻訳データ（9言語） |
| `js/language-switcher.js` | 言語切り替えロジック |
| `js/faq-data.js` | FAQ多言語データ |

### モバイル最適化関連

| ファイル | 説明 |
|----------|------|
| `css/mobile-fixes.css` | モバイル用CSS |
| `css/style-new.css` | 共通スタイル |

---

## 9. サーバー起動方法

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

## 10. GitHubからの更新取得

```powershell
cd C:\Projects\test-publishing-platform
git pull
npm start
```

---

## 11. 注意事項

### API URLの注意
- ❌ `/api/...` → 404エラー
- ✅ `http://localhost:3000/api/...` → 正しい

### ブラウザキャッシュ
コード更新後に動作がおかしい場合：`Ctrl + Shift + R`

### translations.js の破損に注意
- ファイルサイズが大きい（109KB）ため、GitHubへのプッシュ時にまれに破損することがある
- 破損した場合は `git checkout main~1 -- js/translations.js` で復元可能

### プロジェクトフォルダの場所
- **正しいパス**: `C:\Projects\test-publishing-platform`
- ❌ `C:\claude\publishing-platform` は存在しない

### editor.html について
- このファイルは独自の翻訳システム（uiTextオブジェクト）を使用
- translations.js / language-switcher.js は使用していない
- ファイルサイズが大きいため、編集時は構文エラーに注意

---

## 12. 新しいChatでの開始方法

1. このドキュメントをClaudeにアップロード
2. 「register-author.htmlの多言語対応をしたい」と伝える
3. `git pull` で最新コードを取得
4. 作業開始

---

## 13. 参考リンク

| 項目 | URL |
|------|-----|
| GitHubリポジトリ | https://github.com/kenji-publishing/test-publishing-platform |
| チケット（デモ） | http://localhost:8000/pages/support/tickets.html?demo=true |
| FAQ | http://localhost:8000/pages/support/faq.html |
| Reader | http://localhost:8000/pages/reader.html |
| Editor | http://localhost:8000/pages/editor.html |

---

## 14. GitHubコミット履歴

| 日付 | 内容 | コミットSHA |
|------|------|-------------|
| 1/3 | reader.html placeholder修正（setAttribute方式） | 7665a26 |
| 1/3 | reader.html 言語切り替えロジック修正 | 09562967 |
| 1/4 | editor.html 多言語対応 | （ローカル、未プッシュ） |

---

## 15. 次のフェーズ候補

| オプション | 内容 | 推奨 |
|-----------|------|:----:|
| A | register-author.html 多言語対応 | ⭐ |
| B | manga-viewer.html 多言語対応 | |
| C | 法的ページ（terms, privacy等）多言語対応 | |
| D | Phase 13: テスト・品質保証 | |

**推奨：オプションA（register-author.html）から始める**
- 著者登録は主要機能であり、ユーザーが頻繁に使用する
- editor.htmlと同様のパターンで対応可能

---

最終更新: 2026年1月4日
