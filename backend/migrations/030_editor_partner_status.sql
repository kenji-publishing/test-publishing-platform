-- 030: Editor "next-work partner" status (Pattern B)
--
-- Editors who apply from a published work are NOT collaborators on that
-- (already finished) work. Approving them creates a partnership only:
-- status 'partner' — no agreement, no revenue share on the current work.
-- Revenue binding happens when the author uploads the next work and
-- designates the editor there (Pattern A: pending -> sign -> active).

ALTER TABLE work_collaborators DROP CONSTRAINT IF EXISTS work_collaborators_status_check;
ALTER TABLE work_collaborators ADD CONSTRAINT work_collaborators_status_check
    CHECK (status IN ('requested', 'pending', 'active', 'removed', 'declined', 'partner'));
