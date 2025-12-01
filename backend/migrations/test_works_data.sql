-- テスト用作品データ
-- 実行方法: psql -U postgres -d publisher_platform -f test_works_data.sql

-- テスト用作品を追加（著者としてJ.A. Writerを使用）
INSERT INTO works (work_id, author_id, title, description, work_type, original_language, status, is_premium, created_at)
SELECT 
    gen_random_uuid(),
    user_id,
    '月光の剣士',
    '江戸時代を舞台にした時代小説。若き剣士の成長物語。',
    'novel',
    'ja',
    'pending_review',
    false,
    NOW() - INTERVAL '2 days'
FROM users WHERE email = 'writer@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO works (work_id, author_id, title, description, work_type, original_language, status, is_premium, created_at)
SELECT 
    gen_random_uuid(),
    user_id,
    'Tokyo Dreams',
    'A modern romance set in the bustling streets of Tokyo.',
    'novel',
    'en',
    'pending_review',
    true,
    NOW() - INTERVAL '1 day'
FROM users WHERE email = 'writer@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO works (work_id, author_id, title, description, work_type, original_language, status, is_premium, created_at)
SELECT 
    gen_random_uuid(),
    user_id,
    '星空のメロディ',
    '音楽をテーマにした感動の短編集。',
    'short_story',
    'ja',
    'draft',
    false,
    NOW()
FROM users WHERE email = 'writer@example.com'
ON CONFLICT DO NOTHING;

-- 章を追加
INSERT INTO chapters (chapter_id, work_id, chapter_number, title, content, status, word_count, created_at)
SELECT 
    gen_random_uuid(),
    work_id,
    1,
    '第一章：出会い',
    'ここに本文が入ります。若き剣士、月影源之助は江戸の町を歩いていた...',
    'draft',
    1500,
    NOW()
FROM works WHERE title = '月光の剣士'
ON CONFLICT DO NOTHING;

INSERT INTO chapters (chapter_id, work_id, chapter_number, title, content, status, word_count, created_at)
SELECT 
    gen_random_uuid(),
    work_id,
    2,
    '第二章：修行',
    '源之助は山奥の道場で厳しい修行の日々を送ることになった...',
    'draft',
    2000,
    NOW()
FROM works WHERE title = '月光の剣士'
ON CONFLICT DO NOTHING;

INSERT INTO chapters (chapter_id, work_id, chapter_number, title, content, status, word_count, created_at)
SELECT 
    gen_random_uuid(),
    work_id,
    1,
    'Chapter 1: First Sight',
    'The cherry blossoms were falling as Yuki walked through Shibuya crossing...',
    'draft',
    1800,
    NOW()
FROM works WHERE title = 'Tokyo Dreams'
ON CONFLICT DO NOTHING;

-- 確認用クエリ
SELECT title, status, work_type FROM works;
