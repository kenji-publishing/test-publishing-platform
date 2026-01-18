# Publisher Platform 引き継ぎドキュメント

最終更新: 2026年1月18日

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
| 12 | 多言語対応（9言語）全ページ完了 | ✅ |

### 🎉 Phase 12 多言語対応 完了！（2026-01-18）

---

## 5. 今日の作業状況（2026-01-18）

### 完了した作業

#### 1. translations.js 構造修正 ✅
- 6言語（es, fr, de, ko, ar, pt）の翻訳構造をja/en/zhと同じ形式に統一
- 全セクションの順序を統一: nav → home → login → register → dashboard → browse → notifications → analytics → upload → checkout → payment → translation → accountSettings → reader → mangaViewer → mangaTranslator → registerTranslator → registerEditor → registerAuthor → support → footer → notificationManager → common

#### 2. translations.js 構文エラー修正 ✅
- ptセクションの閉じ括弧とtranslationsオブジェクト全体の閉じ括弧を修正
- `},` → `}` + `};` に修正

#### 3. Git Push完了 ✅
- コミット: `16ae3a7..d72249f`
- メッセージ: "Phase 12-9: Complete translation structure fix for all 9 languages"

---

## 6. 次回の作業

### 🟡 優先度: 高 - 各ページの動作確認

現在進行中：全ページの多言語表示確認

### 🟢 優先度: 中 - Phase 13 計画

Phase 12（多言語対応）が完了したため、次のフェーズを検討：
- Phase 13a: 本番環境デプロイ準備
- Phase 13b: セキュリティ強化
- Phase 13c: パフォーマンス最適化
- Phase 13d: 追加機能開発（有料翻訳機能など）

---

## 7. 新しいChatでの開始方法

### 方法1: このドキュメントをアップロード
1. このドキュメント（publisher_handover_updated.md）をClaudeにアップロード
2. 以下のように指示：

```
Phase 12が完了しました。
次のフェーズ（本番環境デプロイ準備など）について相談したいです。
```

### 方法2: GitHub MCPを使用
1. Claude Desktopで新しいチャットを開始
2. 以下のように指示：

```
GitHub MCP と Filesystem MCPを使って、
C:\Projects\test-publishing-platform の
現在の状態を確認し、次の開発フェーズを提案してください。
```

---

## 8. 対応言語（9言語）

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

## 9. サーバー起動方法

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

## 10. ページ確認時の注意事項

### 認証が必要なページの開き方

analytics.html などログインが必要なページは、以下の手順で開けます：

1. ブラウザでページを直接開く（リダイレクトされてもOK）
2. F12でコンソールを開く
3. 以下のコードを貼り付けてEnter：
```javascript
localStorage.setItem('token', 'demo-token-12345');
localStorage.setItem('user', JSON.stringify({
    id: 1,
    email: 'test@publisher.local',
    display_name: 'Demo User',
    role: 'author'
}));
```
4. ページのURLを直接入力して再アクセス

### デモモード対応ページ

以下のページはURLに `?demo=true` を付けるとダミーデータで表示できます：
- account-settings.html
- その他多数

### ブラウザキャッシュ
コード更新後に動作がおかしい場合：`Ctrl + Shift + R`

---

## 11. 注意事項

### translations.js の編集時の注意
- ファイルサイズが大きい（約250KB）
- 構文エラーが発生しやすいので、編集後は必ずF12 Consoleでエラーチェック
- エラーメッセージ例: `Translations not loaded. Include translations.js before language-switcher.js`
- 破損した場合はGitHubから正常なバージョンをダウンロードして上書き

### 言語セレクターの仕組み
- `language-selector` クラスを持つselect要素をlanguage-switcher.jsが認識
- 新しいページに言語セレクターを追加する際は必ずこのクラスを付ける

### GitHub API のファイルサイズ制限
- 大きなファイル（100KB以上）は一度にプッシュできない場合あり
- 手動でGitHubの編集画面からアップロードする方法を推奨

---

## 12. 主要機能一覧

| 機能 | 説明 | 関連ファイル |
|------|------|-------------|
| 多言語対応 | 9言語切り替え | js/translations.js, js/language-switcher.js |
| 領収書発行 | 9言語対応、PDF保存可 | backend/services/receipt-generator.js |
| GDPR対応 | データ削除リクエスト | pages/account-settings.html |
| FAQ | 33件×9言語 | pages/support/faq.html |
| サポートチケット | 問い合わせ管理 | pages/support/tickets.html |

---

## 13. 既知の問題

### 通知タブ・セキュリティ質問の動的コンテンツ
- 言語切り替え後、動的に生成されるコンテンツが切り替わらない場合がある
- 原因: JavaScriptで生成されるコンテンツがapplyTranslations()の対象外
- 対処: ページをリロード（F5）
- 優先度: 低（次フェーズで対応検討）

---

最終更新: 2026年1月18日
