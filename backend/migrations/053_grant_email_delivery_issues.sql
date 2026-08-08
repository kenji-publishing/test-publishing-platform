-- 新しく作ったテーブルに、アプリ用ユーザーの権限を付ける。
--
-- 051 を postgres ユーザーで流したため、テーブルの持ち主が postgres になり、
-- アプリ（DB_USER=auctlect）が書き込めなかった。2026-08-08 に実際に踏んだ:
-- SNSからの通知は届いていたのに "permission denied for table" で500を返し続けた。
--
-- 既存のテーブルは CREATE 時に権限が付いていたため影響なし。
-- 今後 CREATE TABLE を含むマイグレーションを書くときは、必ずこの GRANT も一緒に書くこと。

GRANT SELECT, INSERT, UPDATE, DELETE ON email_delivery_issues TO auctlect;

-- SERIAL の裏にある採番用シーケンスにも権限が要る。
-- テーブルだけ許可しても、INSERT 時の採番で止まる
GRANT USAGE, SELECT ON SEQUENCE email_delivery_issues_issue_id_seq TO auctlect;
