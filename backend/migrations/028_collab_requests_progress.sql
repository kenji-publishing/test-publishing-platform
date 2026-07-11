-- 028: Collaborator-initiated applications + progress reports
-- 'requested' = collaborator applied, awaiting the author's approval.
-- Approval flips it to 'pending' and issues the agreement (existing flow).

ALTER TABLE work_collaborators DROP CONSTRAINT IF EXISTS work_collaborators_status_check;
ALTER TABLE work_collaborators ADD CONSTRAINT work_collaborators_status_check
    CHECK (status IN ('requested', 'pending', 'active', 'removed', 'declined'));

CREATE TABLE IF NOT EXISTS collaboration_progress (
    progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collaborator_id UUID NOT NULL REFERENCES work_collaborators(collaborator_id) ON DELETE CASCADE,
    percent INTEGER NOT NULL CHECK (percent BETWEEN 0 AND 100),
    status VARCHAR(20) DEFAULT 'on-track' CHECK (status IN ('on-track', 'behind', 'need-help')),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_collab_progress_collab ON collaboration_progress(collaborator_id);
