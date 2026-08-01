-- 048: アカウント復旧に必要なテーブル（本番に欠けていた分）
--
-- backend/routes/auth-magic.js が backup_codes / security_questions /
-- recovery_attempts を参照しているが、本番にはこの3つが存在せず、
-- 「秘密の質問で復旧」「バックアップコードで復旧」が実行時エラーになっていた
-- （本番ログ: relation "recovery_attempts" does not exist）。
--
-- 旧 migrations/add-account-recovery.sql は user_id を INTEGER で定義しており、
-- users.user_id が UUID の現行スキーマには適用できない。ここで型を合わせて作る。
-- magic_links は本番に既存（UUID主キー）なので触らない。

-- バックアップコード（1回限りのログイン用コード）
CREATE TABLE IF NOT EXISTS backup_codes (
    code_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_backup_codes_user ON backup_codes(user_id) WHERE is_used = FALSE;

-- 秘密の質問と答え（答えはハッシュ化して保存）
CREATE TABLE IF NOT EXISTS security_questions (
    question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    question_text VARCHAR(500) NOT NULL,
    answer_hash VARCHAR(255) NOT NULL,
    question_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_security_questions_user ON security_questions(user_id);

-- 復旧の試行記録。24時間あたりの失敗回数で総当たりを止めるために使う
CREATE TABLE IF NOT EXISTS recovery_attempts (
    attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    attempt_type VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    success BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 失敗回数の集計（user_id + attempt_type + success + created_at）で引く
CREATE INDEX IF NOT EXISTS idx_recovery_attempts_lookup
    ON recovery_attempts(user_id, attempt_type, created_at) WHERE success = FALSE;
