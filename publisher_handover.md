# AuctLect Platform 引き継ぎドキュメント

最終更新: 2026年1月2日

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

### 現在進行中

| Phase | 内容 | 状態 |
|-------|------|:----:|
| 12-5c+ | tickets.html デモメッセージの多言語対応 | 🔄 途中 |

---

## 5. 明日の作業（12-5c+ デモメッセージ多言語化）

### 概要
チケット詳細モーダルで表示されるデモメッセージ（ユーザーの問い合わせ内容、管理者の返信）を9言語対応にする

### 手順1: translations.js にデモメッセージを追加

VSCode で `js/translations.js` を開いて、各言語の `demo:` セクションに `userMessage` と `adminMessage` を追加：

**英語（en）** - `accountSettings: 'Account settings not saving'` を検索して置換：
```javascript
accountSettings: 'Account settings not saving', userMessage: 'This is my inquiry.\nPlease provide more details.', adminMessage: 'Thank you for your inquiry.\nWe will look into it.'
```

**日本語（ja）** - `accountSettings: 'アカウント設定が保存されない'` を検索して置換：
```javascript
accountSettings: 'アカウント設定が保存されない', userMessage: 'こちらがお問い合わせ内容です。\n詳細をお知らせください。', adminMessage: 'お問い合わせありがとうございます。\n確認いたします。'
```

**中国語（zh）** - `accountSettings: '账户设置无法保存'` を検索して置換：
```javascript
accountSettings: '账户设置无法保存', userMessage: '这是我的咨询内容。\n请提供更多详细信息。', adminMessage: '感谢您的咨询。\n我们会尽快处理。'
```

**スペイン語（es）** - `accountSettings: 'La configuración de cuenta no se guarda'` を検索して置換：
```javascript
accountSettings: 'La configuración de cuenta no se guarda', userMessage: 'Esta es mi consulta.\nPor favor proporcione más detalles.', adminMessage: 'Gracias por su consulta.\nLo revisaremos.'
```

**フランス語（fr）** - `accountSettings: 'Les paramètres du compte ne s\'enregistrent pas'` を検索して置換：
```javascript
accountSettings: 'Les paramètres du compte ne s\'enregistrent pas', userMessage: 'Voici ma demande.\nVeuillez fournir plus de détails.', adminMessage: 'Merci pour votre demande.\nNous allons examiner cela.'
```

**ドイツ語（de）** - `accountSettings: 'Kontoeinstellungen werden nicht gespeichert'` を検索して置換：
```javascript
accountSettings: 'Kontoeinstellungen werden nicht gespeichert', userMessage: 'Dies ist meine Anfrage.\nBitte geben Sie weitere Details an.', adminMessage: 'Vielen Dank für Ihre Anfrage.\nWir werden uns darum kümmern.'
```

**韓国語（ko）** - `accountSettings: '계정 설정이 저장되지 않음'` を検索して置換：
```javascript
accountSettings: '계정 설정이 저장되지 않음', userMessage: '문의 내용입니다.\n자세한 내용을 알려주세요.', adminMessage: '문의해 주셔서 감사합니다.\n확인하겠습니다.'
```

**アラビア語（ar）** - `accountSettings: 'إعدادات الحساب لا تُحفظ'` を検索して置換：
```javascript
accountSettings: 'إعدادات الحساب لا تُحفظ', userMessage: 'هذا هو استفساري.\nيرجى تقديم المزيد من التفاصيل.', adminMessage: 'شكراً لاستفسارك.\nسننظر في الأمر.'
```

**ポルトガル語（pt）** - `accountSettings: 'Configurações da conta não estão salvando'` を検索して置換：
```javascript
accountSettings: 'Configurações da conta não estão salvando', userMessage: 'Esta é minha consulta.\nPor favor forneça mais detalhes.', adminMessage: 'Obrigado pela sua consulta.\nVamos verificar.'
```

### 手順2: 保存してプッシュ
```bash
git add js/translations.js
git commit -m "Add demo message translations for 9 languages"
git push origin main
```

### 手順3: tickets.html を更新
ClaudeがGitHub APIで tickets.html の `demoMessages` 配列を翻訳キーから取得するように更新

---

## 6. 今日完了した作業（2026-01-02）

### 12-5c: tickets.html 多言語対応（完了）

1. **デザイン統一**
   - `navbar-dark bg-dark` → `navbar-custom`（faq.htmlと同じスタイル）
   - `bg-dark text-light` → `footer-custom`
   - Google Fonts 追加
   - ページヘッダー追加（グラデーション背景）

2. **言語セレクター修正**
   - Bootstrap Dropdown → `<select class="language-selector">` に変更
   - 9言語すべて正しく表示されるようになった
   - デスクトップ・モバイル両対応

3. **デモチケット件名の翻訳**
   - translations.js のキー名を修正（subject1→translationQuality等）
   - 言語切り替え時に `getDemoTickets()` を再呼び出しするよう修正
   - **結果**: 言語を切り替えるとデモチケットのタイトルが翻訳される ✅

### GitHubコミット履歴（1/2）

| 内容 | コミットSHA |
|------|-------------|
| tickets.html デザイン統一・言語セレクター修正 | 2b039c80 |
| 言語切り替え時にデモチケット再取得するよう修正 | 2e62f8dc |
| デモチケット件名の翻訳キー名修正 | ローカルで実施済み |

---

## 7. 多言語対応済みページ一覧

### Phase 12で対応したページ（18ページ）

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
| pages/account-settings.html | ✅ | ✅ | 完了（12/29） |
| pages/reader.html | ✅ | ✅ | 完了（12/29） |
| pages/support/faq.html | ✅ | ✅ | 完了（12/29） |
| pages/register-translator.html | ✅ | ✅ | 完了（1/1） |
| pages/register-editor.html | ✅ | ✅ | 完了（1/1） |
| pages/support/tickets.html | ✅ | ✅ | 完了（1/2） |

### 未対応ページ一覧（約16ページ）

| 優先度 | ファイル | 内容 |
|:------:|----------|------|
| 高 | editor.html | 作品エディター |
| 高 | register-author.html | 著者登録 |
| 高 | support/contact.html | お問い合わせ |
| 中 | support/troubleshoot.html | トラブルシューティング |
| 中 | translators/index.html | 翻訳者マーケット |
| 中 | translators/register.html | 翻訳者登録 |
| 中 | feedback/index.html | フィードバック |
| 中 | feedback/report.html | レポート |
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

---

## 12. 新しいChatでの開始方法

1. このドキュメントをClaudeにアップロード
2. 「Phase 12-5c+ 続き。デモメッセージの多言語化を続けたい」と伝える
3. `git pull` で最新コードを取得
4. サーバーを起動して動作確認

---

## 13. 参考リンク

| 項目 | URL |
|------|-----|
| GitHubリポジトリ | https://github.com/kenji-publishing/test-publishing-platform |
| チケット（デモ） | http://localhost:8000/pages/support/tickets.html?demo=true |
| FAQ | http://localhost:8000/pages/support/faq.html |

---

## 14. tickets.html について

### 役割
ユーザーが過去に送った問い合わせ（サポートチケット）の一覧と進捗状況を確認するページ

### 現在の動作
- ✅ デモチケット一覧が表示される
- ✅ 言語切り替えでチケット件名が翻訳される
- 🔄 チケットをクリックした時のメッセージはまだ英語固定（明日対応）

---

## 15. 次のフェーズ候補

| オプション | 内容 |
|-----------|------|
| A | 残りの未対応ページの多言語化（約16ページ） |
| B | Phase 13: テスト・品質保証（本番公開前の最終チェック） |
| C | その他の機能追加 |

---

最終更新: 2026年1月2日
