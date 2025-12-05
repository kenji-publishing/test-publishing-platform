-- =============================================
-- Phase 8E: Auto Response System Migration
-- 自動メール応答・定型文テンプレート
-- =============================================

-- ---------------------------------------------
-- 1. 定型文テンプレートテーブル
-- 管理者がよく使う返信テンプレート
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS reply_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    subject_template VARCHAR(255),
    body_template TEXT NOT NULL,
    variables TEXT[],
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------
-- 2. メール送信ログテーブル
-- 送信履歴を記録
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_user_id UUID REFERENCES users(user_id),
    email_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    ticket_id INTEGER REFERENCES support_tickets(id),
    status VARCHAR(20) DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_email_logs_ticket ON email_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_reply_templates_category ON reply_templates(category);

-- ---------------------------------------------
-- 3. カテゴリ別FAQ関連付けテーブル
-- チケットカテゴリと関連FAQのマッピング
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS category_faq_mapping (
    id SERIAL PRIMARY KEY,
    ticket_category VARCHAR(50) NOT NULL,
    faq_id INTEGER REFERENCES faq_items(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ticket_category, faq_id)
);

CREATE INDEX IF NOT EXISTS idx_category_faq_mapping_category ON category_faq_mapping(ticket_category);

-- ---------------------------------------------
-- 4. 初期定型文テンプレートデータ
-- ---------------------------------------------
INSERT INTO reply_templates (name, category, subject_template, body_template, variables) VALUES
-- アカウント関連
('パスワードリセット案内', 'account', NULL, 
'パスワードのリセット方法をご案内いたします。

1. ログイン画面の「パスワードをお忘れですか？」をクリック
2. 登録メールアドレスを入力
3. 届いたメールのリンクをクリック
4. 新しいパスワードを設定

上記で解決しない場合は、お知らせください。', 
ARRAY[]::TEXT[]),

('メールアドレス変更案内', 'account', NULL,
'メールアドレスの変更方法をご案内いたします。

1. アカウント設定ページにアクセス
2. 「セキュリティ」タブを開く
3. メールアドレス欄の「変更する」をクリック
4. セキュリティ質問に回答
5. 新しいメールアドレスに届く確認メールをクリック

ご不明点があればお知らせください。',
ARRAY[]::TEXT[]),

-- 決済関連
('返金処理完了', 'payment', NULL,
'返金処理が完了いたしました。

■ 返金詳細
・注文ID: {{order_id}}
・返金額: ¥{{amount}}
・返金方法: ご利用のお支払い方法へ返金

※ クレジットカードの場合、明細への反映まで数日かかる場合があります。

ご不明点がございましたら、お気軽にお問い合わせください。',
ARRAY['order_id', 'amount']),

('決済エラー対応', 'payment', NULL,
'決済エラーについて確認いたしました。

考えられる原因:
1. カード情報の入力ミス
2. カードの有効期限切れ
3. 利用限度額の超過
4. 3Dセキュア認証の失敗

再度お試しいただくか、別のお支払い方法をお試しください。
問題が続く場合は、カード発行会社にお問い合わせください。',
ARRAY[]::TEXT[]),

-- 翻訳関連
('翻訳品質についての回答', 'translation', NULL,
'翻訳品質についてご連絡いただきありがとうございます。

AI翻訳は機械学習に基づくため、完璧ではない場合があります。
以下の対応が可能です:

1. **再翻訳**: 同じ内容を再度翻訳（無料）
2. **人力翻訳**: プロの翻訳者による翻訳（有料）
3. **編集依頼**: 問題箇所の修正を依頼

ご希望をお知らせいただければ、対応いたします。',
ARRAY[]::TEXT[]),

-- 技術的な問題
('ブラウザキャッシュクリア案内', 'technical', NULL,
'表示の問題について、まずブラウザのキャッシュクリアをお試しください。

【Chromeの場合】
1. Ctrl+Shift+Delete を押す
2. 「キャッシュされた画像とファイル」にチェック
3. 「データを削除」をクリック

【その他のブラウザ】
設定 > プライバシー > 閲覧データの削除

上記で解決しない場合は、別のブラウザでもお試しください。',
ARRAY[]::TEXT[]),

-- その他
('調査中の回答', 'other', NULL,
'お問い合わせいただいた件について、現在調査中です。

調査完了次第、改めてご連絡いたします。
恐れ入りますが、今しばらくお待ちください。

※ 追加情報がございましたら、このチケットに返信してください。',
ARRAY[]::TEXT[]),

('解決確認', 'other', NULL,
'その後、問題は解決しましたでしょうか？

解決した場合は、チケットをクローズしていただけると助かります。
まだ問題が続いている場合は、お知らせください。

よろしくお願いいたします。',
ARRAY[]::TEXT[])

ON CONFLICT DO NOTHING;

-- ---------------------------------------------
-- 5. カテゴリ別FAQ関連付け初期データ
-- 各カテゴリで自動送信するFAQを設定
-- ---------------------------------------------
-- accountカテゴリのFAQ関連付け
INSERT INTO category_faq_mapping (ticket_category, faq_id, priority)
SELECT 'account', id, 1 FROM faq_items WHERE category_id = (SELECT id FROM faq_categories WHERE name_en = 'Account')
ON CONFLICT DO NOTHING;

-- paymentカテゴリのFAQ関連付け
INSERT INTO category_faq_mapping (ticket_category, faq_id, priority)
SELECT 'payment', id, 1 FROM faq_items WHERE category_id = (SELECT id FROM faq_categories WHERE name_en = 'Payment')
ON CONFLICT DO NOTHING;

-- translationカテゴリのFAQ関連付け
INSERT INTO category_faq_mapping (ticket_category, faq_id, priority)
SELECT 'translation', id, 1 FROM faq_items WHERE category_id = (SELECT id FROM faq_categories WHERE name_en = 'Translation')
ON CONFLICT DO NOTHING;

-- worksカテゴリのFAQ関連付け
INSERT INTO category_faq_mapping (ticket_category, faq_id, priority)
SELECT 'works', id, 1 FROM faq_items WHERE category_id = (SELECT id FROM faq_categories WHERE name_en = 'Publishing')
ON CONFLICT DO NOTHING;

-- technicalカテゴリのFAQ関連付け
INSERT INTO category_faq_mapping (ticket_category, faq_id, priority)
SELECT 'technical', id, 1 FROM faq_items WHERE category_id = (SELECT id FROM faq_categories WHERE name_en = 'Technical')
ON CONFLICT DO NOTHING;

-- メッセージ
DO $$
BEGIN
    RAISE NOTICE '✅ Phase 8E Migration Complete';
    RAISE NOTICE '  - reply_templates table created';
    RAISE NOTICE '  - email_logs table created';
    RAISE NOTICE '  - category_faq_mapping table created';
    RAISE NOTICE '  - Initial templates inserted';
END $$;
