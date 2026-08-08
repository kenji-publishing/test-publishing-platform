-- 不達になったメールの件名を残す。
--
-- 「誰かのメールが届かなかった」だけでは、何をすべきか判断できない。
-- パスワード再設定が届いていないなら、その人はいま困っている（急ぐ）。
-- 月次のお知らせなら急がない。件名があれば、その区別がつく。
--
-- SESの Notifications で「元のメールヘッダーを含める」を有効にすると、
-- 通知の mail.commonHeaders に件名が入ってくる。
ALTER TABLE email_delivery_issues ADD COLUMN IF NOT EXISTS original_subject VARCHAR(500);

COMMENT ON COLUMN email_delivery_issues.original_subject IS
  '届かなかったメールの件名。対応の優先度を判断するために使う。';
