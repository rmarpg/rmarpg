-- Migration: ensure at most one open (incomplete) assessment per learner
-- Adds a partial unique index on assessments(learner_id) where completed_at IS NULL

BEGIN;

-- Create partial unique index to prevent multiple in-progress assessments per learner
CREATE UNIQUE INDEX IF NOT EXISTS assessments_one_open_per_learner_idx
  ON public.assessments (learner_id)
  WHERE completed_at IS NULL;

COMMIT;

-- Rollback (if needed):
-- BEGIN;
-- DROP INDEX IF EXISTS assessments_one_open_per_learner_idx;
-- COMMIT;
