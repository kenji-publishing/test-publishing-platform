-- ============================================================
-- Phase 9A: Notification Center Database Schema
-- 通知センター用データベーススキーマ
-- ============================================================

-- ============================================================
-- 1. notifications テーブル（通知）
-- ユーザーへの通知を保存するメインテーブル
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 通知を受け取るユーザー
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- 通知タイプ
    -- sale: 売上, translation_complete: 翻訳完了, 
    -- translation_request: 翻訳依頼, comment: コメント,
    -- feedback: 読者フィードバック, system: システム通知,
    -- ticket_reply: サポート返信, account: アカウント関連
    notification_type VARCHAR(50) NOT NULL,
    
    -- 通知タイトル（短い説明）
    title VARCHAR(255) NOT NULL,
    
    -- 通知本文（詳細）
    message TEXT NOT NULL,
    
    -- アイコン（FontAwesome クラス名）
    icon VARCHAR(50) DEFAULT 'fa-bell',
    
    -- アイコン色（Bootstrap/カスタム色名）
    icon_color VARCHAR(30) DEFAULT 'primary',
    
    -- クリック時のリンク先URL（オプション）
    action_url VARCHAR(500),
    
    -- 関連データ（JSON形式）
    -- 例: {"work_id": "xxx", "amount": 9.99, "buyer_name": "John"}
    metadata JSONB DEFAULT '{}',
    
    -- 既読フラグ（true = 既読）
    is_read BOOLEAN DEFAULT FALSE,
    
    -- 既読にした日時
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- 作成日時
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 有効期限（NULLなら無期限）
    expires_at TIMESTAMP WITH TIME ZONE
);

-- インデックス（高速検索用）
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
    ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
    ON notifications(user_id, is_read) 
    WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
    ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type 
    ON notifications(notification_type);

-- ============================================================
-- 2. notification_preferences テーブル（通知設定）
-- ユーザーごとの通知設定
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ユーザー
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- 通知タイプ
    notification_type VARCHAR(50) NOT NULL,
    
    -- アプリ内通知（通知センター）
    in_app_enabled BOOLEAN DEFAULT TRUE,
    
    -- メール通知
    email_enabled BOOLEAN DEFAULT TRUE,
    
    -- 作成・更新日時
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- ユーザー×通知タイプで一意
    UNIQUE(user_id, notification_type)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user 
    ON notification_preferences(user_id);

-- ============================================================
-- 3. デフォルト通知設定を挿入する関数
-- 新規ユーザー登録時に自動的にデフォルト設定を作成
-- ============================================================

CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
DECLARE
    notification_types TEXT[] := ARRAY[
        'sale', 'translation_complete', 'translation_request',
        'comment', 'feedback', 'system', 'ticket_reply', 'account'
    ];
    n_type TEXT;
BEGIN
    FOREACH n_type IN ARRAY notification_types
    LOOP
        INSERT INTO notification_preferences (
            user_id, 
            notification_type, 
            in_app_enabled, 
            email_enabled
        )
        VALUES (
            NEW.user_id,
            n_type,
            TRUE,
            -- システム通知とアカウント通知はメール送信デフォルトON
            -- マーケティング系はデフォルトOFF
            CASE 
                WHEN n_type IN ('system', 'account', 'sale', 'ticket_reply') THEN TRUE 
                ELSE FALSE 
            END
        )
        ON CONFLICT (user_id, notification_type) DO NOTHING;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成（既存の場合は削除して再作成）
DROP TRIGGER IF EXISTS trigger_create_notification_preferences ON users;

CREATE TRIGGER trigger_create_notification_preferences
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- ============================================================
-- 4. 既存ユーザーにデフォルト設定を追加
-- ============================================================

DO $$
DECLARE
    u_record RECORD;
    notification_types TEXT[] := ARRAY[
        'sale', 'translation_complete', 'translation_request',
        'comment', 'feedback', 'system', 'ticket_reply', 'account'
    ];
    n_type TEXT;
BEGIN
    FOR u_record IN SELECT user_id FROM users
    LOOP
        FOREACH n_type IN ARRAY notification_types
        LOOP
            INSERT INTO notification_preferences (
                user_id, 
                notification_type, 
                in_app_enabled, 
                email_enabled
            )
            VALUES (
                u_record.user_id,
                n_type,
                TRUE,
                CASE 
                    WHEN n_type IN ('system', 'account', 'sale', 'ticket_reply') THEN TRUE 
                    ELSE FALSE 
                END
            )
            ON CONFLICT (user_id, notification_type) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================
-- 5. サンプル通知データ（テスト用）
-- 本番では削除してください
-- ============================================================

-- この部分は実行時にuser_idが必要なため、コメントアウト
-- 実際のテストデータは後からAPIで追加可能

/*
INSERT INTO notifications (user_id, notification_type, title, message, icon, icon_color, action_url, metadata)
VALUES 
    ('YOUR_USER_ID', 'sale', '作品が購入されました！', 
     '「サンプル作品」がJohnさんに購入されました。¥980の収益が発生しました。',
     'fa-dollar-sign', 'success', '/pages/dashboard.html',
     '{"work_title": "サンプル作品", "amount": 980, "buyer": "John"}'
    ),
    ('YOUR_USER_ID', 'translation_complete', '翻訳が完了しました',
     '「サンプル作品」の英語翻訳が完了しました。',
     'fa-language', 'info', '/pages/translation-status.html',
     '{"work_title": "サンプル作品", "language": "en"}'
    ),
    ('YOUR_USER_ID', 'system', 'Publisher へようこそ！',
     'アカウントの作成が完了しました。作品をアップロードして世界中の読者に届けましょう！',
     'fa-rocket', 'primary', '/pages/upload-work.html',
     '{}'
    );
*/

-- ============================================================
-- 確認用クエリ
-- ============================================================

-- テーブル確認
-- SELECT * FROM notifications LIMIT 5;
-- SELECT * FROM notification_preferences LIMIT 5;

-- 未読件数確認
-- SELECT COUNT(*) as unread_count FROM notifications 
-- WHERE user_id = 'YOUR_USER_ID' AND is_read = FALSE;

COMMENT ON TABLE notifications IS 'ユーザー通知を保存するテーブル';
COMMENT ON TABLE notification_preferences IS 'ユーザーごとの通知設定';
