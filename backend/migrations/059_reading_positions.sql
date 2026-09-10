-- 読んでいた場所を端末をまたいで引き継ぐ。
--
-- これまでは読んでいたページをブラウザの中（localStorage）だけに置いていたので、
-- 携帯で読んだ続きをパソコンで開くと1ページ目に戻っていた。
--
-- 覚えるのは block_index（段落の番号）。ページ番号は文字サイズや画面の大きさで
-- 変わるため、端末をまたぐ目印には使えない。page と percent は表示用の参考。
CREATE TABLE IF NOT EXISTS reading_positions (
    user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    work_id     UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    block_index INTEGER,
    page        INTEGER,
    percent     SMALLINT,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, work_id)
);

-- 「最近読んだ本」を出すときに使う
CREATE INDEX IF NOT EXISTS idx_reading_positions_user_time
    ON reading_positions (user_id, updated_at DESC);
