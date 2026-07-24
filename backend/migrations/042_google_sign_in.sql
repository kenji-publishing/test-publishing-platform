-- 042: Google Sign-In (Google Identity Services / ID token 方式)
--
-- 方式: フロントがGoogleから受け取ったIDトークンをサーバーが検証する。
-- クライアントシークレットは使わない（リダイレクト方式ではないため）。
--
-- google_id = Googleアカウントの一意ID（payload.sub）。メールアドレスは
-- 変更されうるが sub は不変なので、こちらを本来の紐付けキーとして持つ。
--
-- password_hash を NULL 許容にする: Googleのみで登録したユーザーはパスワードを
-- 持たない。password_hash IS NULL のアカウントは通常ログイン不可（auth.js側で
-- 「Googleでログインしてください」と案内する）。

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- 1つのGoogleアカウントが複数のAuctLectアカウントに紐付かないようにする
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
