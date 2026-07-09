-- =============================================
-- Phase 8: Support System
-- サポートシステム（FAQ・問い合わせチケット）
-- =============================================

-- ---------------------------------------------
-- 1. FAQカテゴリテーブル
-- FAQを分類するためのカテゴリを管理
-- 例: 「アカウント」「支払い」「翻訳について」など
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS faq_categories (
    id SERIAL PRIMARY KEY,
    
    -- カテゴリ名（日本語）
    name_ja VARCHAR(100) NOT NULL,
    
    -- カテゴリ名（英語）
    name_en VARCHAR(100) NOT NULL,
    
    -- カテゴリの説明
    description_ja TEXT,
    description_en TEXT,
    
    -- アイコン（Bootstrap Icons名）
    -- 例: 'person-circle', 'credit-card', 'translate'
    icon VARCHAR(50) DEFAULT 'question-circle',
    
    -- 表示順序（小さい数字が先に表示）
    display_order INT DEFAULT 0,
    
    -- 有効/無効フラグ
    is_active BOOLEAN DEFAULT true,
    
    -- 作成・更新日時
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------
-- 2. FAQ項目テーブル
-- 実際の質問と回答を保存
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS faq_items (
    id SERIAL PRIMARY KEY,
    
    -- どのカテゴリに属するか
    category_id INT REFERENCES faq_categories(id) ON DELETE CASCADE,
    
    -- 質問文（日本語・英語）
    question_ja TEXT NOT NULL,
    question_en TEXT NOT NULL,
    
    -- 回答文（日本語・英語）
    -- HTMLタグ使用可能（リンクやリストを含められる）
    answer_ja TEXT NOT NULL,
    answer_en TEXT NOT NULL,
    
    -- 検索用キーワード（カンマ区切り）
    -- 例: 'パスワード,ログイン,忘れた,リセット'
    keywords VARCHAR(500),
    
    -- 表示回数（人気のFAQを把握するため）
    view_count INT DEFAULT 0,
    
    -- 「役に立った」の数
    helpful_count INT DEFAULT 0,
    
    -- 「役に立たなかった」の数
    not_helpful_count INT DEFAULT 0,
    
    -- 表示順序
    display_order INT DEFAULT 0,
    
    -- 有効/無効フラグ
    is_active BOOLEAN DEFAULT true,
    
    -- 作成・更新日時
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------
-- 3. サポートチケットテーブル
-- ユーザーからの問い合わせを管理
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    
    -- チケット番号（表示用）
    -- 例: 'TKT-20240115-0001'
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- 問い合わせしたユーザー（NULLの場合は未ログインユーザー）
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- 未ログインユーザー用のメールアドレス
    guest_email VARCHAR(255),
    guest_name VARCHAR(100),
    
    -- カテゴリ
    -- 'account', 'payment', 'translation', 'technical', 'copyright', 'other'
    category VARCHAR(50) NOT NULL,
    
    -- 件名
    subject VARCHAR(255) NOT NULL,
    
    -- 最初の問い合わせ内容
    initial_message TEXT NOT NULL,
    
    -- 優先度: 'low', 'normal', 'high', 'urgent'
    priority VARCHAR(20) DEFAULT 'normal',
    
    -- ステータス
    -- 'open': 新規（未対応）
    -- 'in_progress': 対応中
    -- 'waiting_user': ユーザーからの返答待ち
    -- 'waiting_admin': 管理者の対応待ち
    -- 'resolved': 解決済み
    -- 'closed': クローズ
    status VARCHAR(30) DEFAULT 'open',
    
    -- 担当者（管理者のユーザーID）
    assigned_to UUID REFERENCES users(user_id) ON DELETE SET NULL,

    -- 関連情報（任意）
    related_work_id UUID REFERENCES works(work_id) ON DELETE SET NULL,
    related_order_id VARCHAR(100),
    
    -- 最後のメッセージ日時（ソート用）
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 解決日時
    resolved_at TIMESTAMP,
    
    -- 作成・更新日時
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------
-- 4. チケットメッセージテーブル
-- チケット内のやり取り（会話履歴）
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_messages (
    id SERIAL PRIMARY KEY,
    
    -- どのチケットのメッセージか
    ticket_id INT REFERENCES support_tickets(id) ON DELETE CASCADE,
    
    -- 送信者（NULLの場合はシステムメッセージ）
    sender_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- 送信者の種類
    -- 'user': ユーザー
    -- 'admin': 管理者
    -- 'system': システム自動メッセージ
    sender_type VARCHAR(20) NOT NULL,
    
    -- メッセージ本文
    message TEXT NOT NULL,
    
    -- 添付ファイル（JSON配列）
    -- 例: [{"name": "screenshot.png", "url": "/uploads/..."}]
    attachments JSONB DEFAULT '[]',
    
    -- 内部メモフラグ（管理者間のみ表示）
    is_internal_note BOOLEAN DEFAULT false,
    
    -- 既読フラグ
    is_read BOOLEAN DEFAULT false,
    
    -- 作成日時
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------
-- 5. チケット満足度評価テーブル
-- 解決後のユーザー評価
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_ratings (
    id SERIAL PRIMARY KEY,
    
    -- どのチケットの評価か
    ticket_id INT REFERENCES support_tickets(id) ON DELETE CASCADE UNIQUE,
    
    -- 評価（1-5の星）
    rating INT CHECK (rating >= 1 AND rating <= 5),
    
    -- コメント（任意）
    comment TEXT,
    
    -- 評価日時
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------
-- インデックス（検索を高速化）
-- ---------------------------------------------

-- FAQカテゴリの表示順検索用
CREATE INDEX IF NOT EXISTS idx_faq_categories_order 
ON faq_categories(display_order) WHERE is_active = true;

-- FAQ項目のカテゴリ別・表示順検索用
CREATE INDEX IF NOT EXISTS idx_faq_items_category 
ON faq_items(category_id, display_order) WHERE is_active = true;

-- FAQ全文検索用（日本語・英語・キーワード）
CREATE INDEX IF NOT EXISTS idx_faq_items_search 
ON faq_items USING gin(to_tsvector('english', question_en || ' ' || answer_en || ' ' || COALESCE(keywords, '')));

-- チケットのユーザー別検索用
CREATE INDEX IF NOT EXISTS idx_tickets_user 
ON support_tickets(user_id, created_at DESC);

-- チケットのステータス別検索用（管理者用）
CREATE INDEX IF NOT EXISTS idx_tickets_status 
ON support_tickets(status, priority, last_message_at DESC);

-- チケットの担当者別検索用
CREATE INDEX IF NOT EXISTS idx_tickets_assigned 
ON support_tickets(assigned_to, status);

-- チケットメッセージの検索用
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket 
ON ticket_messages(ticket_id, created_at);

-- ---------------------------------------------
-- 初期データ: FAQカテゴリ
-- ---------------------------------------------
INSERT INTO faq_categories (name_ja, name_en, description_ja, description_en, icon, display_order) VALUES
('アカウント', 'Account', 'アカウントの登録・ログイン・設定について', 'Account registration, login, and settings', 'person-circle', 1),
('お支払い', 'Payment', '購入・支払い方法・返金について', 'Purchases, payment methods, and refunds', 'credit-card', 2),
('作品について', 'Works', '作品の閲覧・購入・ダウンロードについて', 'Reading, purchasing, and downloading works', 'book', 3),
('翻訳サービス', 'Translation', 'AI翻訳・翻訳者マーケットプレイスについて', 'AI translation and translator marketplace', 'translate', 4),
('著者向け', 'For Authors', '作品の投稿・収益・販売について', 'Publishing, revenue, and sales', 'pencil-square', 5),
('翻訳者向け', 'For Translators', '翻訳者登録・仕事の受注について', 'Translator registration and accepting jobs', 'globe', 6),
('技術的な問題', 'Technical Issues', 'エラー・不具合・動作環境について', 'Errors, bugs, and system requirements', 'gear', 7),
('その他', 'Other', 'その他のご質問', 'Other questions', 'question-circle', 8);

-- ---------------------------------------------
-- 初期データ: FAQ項目（サンプル）
-- ---------------------------------------------
INSERT INTO faq_items (category_id, question_ja, question_en, answer_ja, answer_en, keywords, display_order) VALUES
-- アカウント関連
(1, 'アカウントを作成するにはどうすればいいですか？', 'How do I create an account?', 
'トップページ右上の「新規登録」ボタンをクリックし、メールアドレスとパスワードを入力してください。著者・翻訳者・編集者として登録する場合は、それぞれ専用の登録ページをご利用ください。',
'Click the "Sign Up" button at the top right of the homepage and enter your email address and password. If you want to register as an author, translator, or editor, please use the dedicated registration page for each role.',
'アカウント,登録,新規,作成,サインアップ,account,register,signup', 1),

(1, 'パスワードを忘れてしまいました', 'I forgot my password',
'ログインページの「パスワードをお忘れですか？」リンクをクリックし、登録時のメールアドレスを入力してください。パスワードリセット用のリンクをメールでお送りします。',
'Click the "Forgot your password?" link on the login page and enter your registered email address. We will send you a password reset link via email.',
'パスワード,忘れた,リセット,再設定,password,forgot,reset', 2),

(1, 'メールアドレスを変更したい', 'I want to change my email address',
'ダッシュボードの「設定」→「アカウント設定」から変更できます。新しいメールアドレスに確認メールが送信されますので、リンクをクリックして変更を完了してください。',
'You can change it from "Settings" → "Account Settings" on your dashboard. A confirmation email will be sent to your new email address. Click the link to complete the change.',
'メール,アドレス,変更,email,change', 3),

-- お支払い関連
(2, '利用可能な支払い方法は？', 'What payment methods are available?',
'クレジットカード（Visa, Mastercard, American Express）およびPayPalがご利用いただけます。',
'We accept credit cards (Visa, Mastercard, American Express) and PayPal.',
'支払い,クレジットカード,PayPal,決済,payment,credit card', 1),

(2, '返金をリクエストするには？', 'How do I request a refund?',
'購入から7日以内であれば、ダッシュボードの「購入履歴」から返金リクエストを送信できます。ただし、作品を50%以上閲覧した場合は返金対象外となります。',
'If within 7 days of purchase, you can submit a refund request from "Purchase History" on your dashboard. However, if you have viewed more than 50% of the work, it is not eligible for a refund.',
'返金,キャンセル,払い戻し,refund,cancel', 2),

-- 翻訳関連
(4, 'AI翻訳の精度はどのくらいですか？', 'How accurate is the AI translation?',
'AI翻訳は高度な機械学習モデルを使用しており、一般的な文章については高い精度で翻訳できます。ただし、専門用語や文学的表現については、プロの翻訳者による翻訳をお勧めします。',
'AI translation uses advanced machine learning models and can translate general text with high accuracy. However, for technical terms or literary expressions, we recommend translation by professional translators.',
'AI翻訳,精度,品質,機械翻訳,ai translation,accuracy,quality', 1),

(4, '翻訳者に直接依頼するには？', 'How do I directly request a translator?',
'「翻訳者を探す」ページから、言語ペアや専門分野で翻訳者を検索できます。気になる翻訳者のプロフィールを確認し、「翻訳を依頼する」ボタンから依頼フォームを送信してください。',
'From the "Find Translators" page, you can search for translators by language pair or specialty. Check the profile of a translator you are interested in and submit a request form using the "Request Translation" button.',
'翻訳者,依頼,マーケットプレイス,translator,request,marketplace', 2),

-- 技術的な問題
(7, '作品が表示されません', 'The work is not displaying',
'以下をお試しください：1) ブラウザのキャッシュをクリア、2) 別のブラウザで試す、3) インターネット接続を確認。問題が続く場合はお問い合わせください。',
'Please try the following: 1) Clear your browser cache, 2) Try a different browser, 3) Check your internet connection. If the problem persists, please contact us.',
'表示されない,エラー,読めない,not displaying,error', 1),

(7, '推奨ブラウザは何ですか？', 'What is the recommended browser?',
'Google Chrome、Firefox、Safari、Microsoft Edgeの最新版を推奨しています。Internet Explorerはサポートしておりません。',
'We recommend the latest versions of Google Chrome, Firefox, Safari, and Microsoft Edge. Internet Explorer is not supported.',
'ブラウザ,Chrome,Firefox,Safari,Edge,browser,recommended', 2);

-- ---------------------------------------------
-- 完了メッセージ
-- ---------------------------------------------
-- Phase 8: Support System マイグレーション完了
-- 
-- 作成されたテーブル:
-- 1. faq_categories - FAQカテゴリ
-- 2. faq_items - FAQ項目
-- 3. support_tickets - サポートチケット
-- 4. ticket_messages - チケットメッセージ
-- 5. ticket_ratings - チケット満足度評価
--
-- 初期データ:
-- - 8つのFAQカテゴリ
-- - 8つのサンプルFAQ項目
