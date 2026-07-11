-- 026: Work collaborators (editor / translator) for revenue distribution
--
-- Attaches registered users to a work as revenue-sharing collaborators.
-- At purchase time the split is derived from this table:
--   platform 30% (fixed) + each active collaborator's revenue_share,
--   author receives the remainder (70 / 60 / 50 / 40 depending on pattern).
-- One editor and one translator per work for now (UNIQUE(work_id, role));
-- relax to (work_id, role, target_language) when per-language translators ship.

CREATE TABLE IF NOT EXISTS work_collaborators (
    collaborator_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id),
    role VARCHAR(20) NOT NULL CHECK (role IN ('editor', 'translator')),
    revenue_share NUMERIC(5,2) NOT NULL CHECK (revenue_share > 0 AND revenue_share <= 40),
    target_language VARCHAR(5),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (work_id, role)
);

CREATE INDEX IF NOT EXISTS idx_work_collaborators_work ON work_collaborators(work_id);
CREATE INDEX IF NOT EXISTS idx_work_collaborators_user ON work_collaborators(user_id);
