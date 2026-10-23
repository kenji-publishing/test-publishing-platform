-- 062: 本人確認（書類の受け付け）を廃止する
--
-- 2025-12 に 005 で作ったが、利用者向けの画面は作られず、一度も使われなかった（本番0件）。
-- パスポート等の画像は持っていなければ漏れないので、受け付け口ごと取り除く。
-- users.verified（応募者一覧の✓表示・管理者が手動で付ける）は別物なので残す。

DROP TABLE IF EXISTS verification_requests;
DROP FUNCTION IF EXISTS update_verification_updated_at();
