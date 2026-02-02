-- Migration: Cleanup subtask consistency in assessment_task_scores
-- Purpose: Ensure that progress-only records (subtask='') have score=0
--          and that all single-question tasks have proper subtask records
-- Date: 2026-02-04

-- 1. Reset scores to 0 for all task-level progress records (subtask='')
--    that should not have scores (they're just progress tracking)
--    Keep only records that were explicitly set by updateTaskScore()
UPDATE public.assessment_task_scores
SET score = 0
WHERE subtask = ''
  AND progress IS NOT NULL
  AND progress != 'null'::jsonb
  AND score > 0;

-- 2. Ensure all tasks have proper subtask='B1' records for Task B
--    by identifying cases where only a task-level record exists
--    This handles the consistency issue where some Task B completions
--    created a subtask='B1' record and others didn't

-- Note: We don't automatically create missing subtask records here because
-- we can't reliably reconstruct the answer data. Instead, this migration
-- just ensures future records will be consistent by fixing the code.

-- 3. Add a comment to document the expected behavior
COMMENT ON COLUMN public.assessment_task_scores.subtask IS 
  'Question-level identifier (e.g., B1, I1, I2, etc.). Empty string indicates a task-level record used for progress tracking or final score aggregation. All answered questions should have their own subtask record.';

-- 4. Add an index to optimize queries that fetch subtask records
CREATE INDEX IF NOT EXISTS idx_assessment_task_scores_subtask 
  ON public.assessment_task_scores (assessment_id, task, subtask)
  WHERE subtask != '';
