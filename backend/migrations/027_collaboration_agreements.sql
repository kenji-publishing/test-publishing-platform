-- 027: Collaboration agreements — collaborators must sign before becoming active
--
-- New collaborators are created with status 'pending' and an agreement row.
-- Signing the agreement flips the collaborator to 'active' (revenue-eligible).
-- Sales made before signing pay the pending share to the author (the split
-- service only pays 'active' collaborators; the author gets the remainder).

ALTER TABLE work_collaborators DROP CONSTRAINT IF EXISTS work_collaborators_status_check;
ALTER TABLE work_collaborators ADD CONSTRAINT work_collaborators_status_check
    CHECK (status IN ('pending', 'active', 'removed', 'declined'));

CREATE TABLE IF NOT EXISTS collaboration_agreements (
    agreement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collaborator_id UUID NOT NULL REFERENCES work_collaborators(collaborator_id) ON DELETE CASCADE,
    work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(user_id),
    user_id UUID NOT NULL REFERENCES users(user_id), -- the collaborator who signs
    terms JSONB NOT NULL,
    terms_hash VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined')),
    signed_at TIMESTAMP,
    signature_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_collab_agreements_user ON collaboration_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_collab_agreements_author ON collaboration_agreements(author_id);
CREATE INDEX IF NOT EXISTS idx_collab_agreements_collab ON collaboration_agreements(collaborator_id);
