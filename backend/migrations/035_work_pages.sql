-- 035: Manga work pages (page-image based works for sale)
--
-- Design agreed 2026-07-10: pages are uploaded one-by-one (multipart, same as
-- covers — stays under the 15MB request cap), with optional chapter markers.
-- Access control on read reuses the /full purchase check (free || author ||
-- purchaser). Files live under uploads/manga-pages/<work_id>/.

CREATE TABLE IF NOT EXISTS work_pages (
    page_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    page_no INTEGER NOT NULL CHECK (page_no >= 1),
    chapter_title VARCHAR(200),          -- このページから新しい章が始まる場合のみセット
    file_name VARCHAR(255) NOT NULL,     -- uploads/manga-pages/<work_id>/ 配下のファイル名
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (work_id, page_no)
);
CREATE INDEX IF NOT EXISTS idx_work_pages_work ON work_pages(work_id, page_no);
