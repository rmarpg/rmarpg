-- Migration: add Task L (task_l_score + task_l_progress) to assessments
-- Run in Supabase SQL editor or via your migration tooling.

BEGIN;

-- 1) Add the cached score column (safe, non-blocking)
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS task_l_score integer NULL DEFAULT 0;

-- 2) Add progress JSONB column used by the resumable-progress feature
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS task_l_progress jsonb;

-- 3) OPTIONAL: backfill cached column from per-task table (if you have existing rows)
-- This copies any saved per-task score stored in assessment_task_scores.task = 'L'
-- into the assessments.task_l_score column so UI/readers see the value immediately.
UPDATE public.assessments AS a
SET task_l_score = s.score
FROM (
  SELECT assessment_id, score
  FROM public.assessment_task_scores
  WHERE task = 'L'
) s
WHERE s.assessment_id = a.id
  AND (a.task_l_score IS NULL OR a.task_l_score = 0);

COMMIT;

-- Rollback (if needed):
-- ALTER TABLE public.assessments DROP COLUMN IF EXISTS task_l_progress;
-- ALTER TABLE public.assessments DROP COLUMN IF EXISTS task_l_score;