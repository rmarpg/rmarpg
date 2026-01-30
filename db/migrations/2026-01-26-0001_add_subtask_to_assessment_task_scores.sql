-- Migration: add `subtask` column to assessment_task_scores and include it in uniqueness
-- Run this in Supabase SQL editor or via your migration tooling.

BEGIN;

-- 1) Add `subtask` column to record per-subtask (e.g. K1, K2)
ALTER TABLE public.assessment_task_scores
  ADD COLUMN IF NOT EXISTS subtask varchar(16) NULL;

-- 2) Replace the existing unique constraint (assessment_id, task)
--    with one that includes `subtask` so multiple subtasks can be stored
ALTER TABLE public.assessment_task_scores
  DROP CONSTRAINT IF EXISTS assessment_task_scores_uniq;

ALTER TABLE public.assessment_task_scores
  ADD CONSTRAINT assessment_task_scores_uniq UNIQUE (assessment_id, task, subtask);

-- 3) Helpful index for common lookups by assessment/task/subtask
CREATE INDEX IF NOT EXISTS assessment_task_scores_assessment_id_task_subtask_idx
  ON public.assessment_task_scores USING btree (assessment_id, task, subtask);

COMMIT;

-- Rollback (if needed):
-- BEGIN;
-- ALTER TABLE public.assessment_task_scores DROP CONSTRAINT IF EXISTS assessment_task_scores_uniq;
-- ALTER TABLE public.assessment_task_scores ADD CONSTRAINT assessment_task_scores_uniq UNIQUE (assessment_id, task);
-- ALTER TABLE public.assessment_task_scores DROP COLUMN IF EXISTS subtask;
-- DROP INDEX IF EXISTS assessment_task_scores_assessment_id_task_subtask_idx;
-- COMMIT;
