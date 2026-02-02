-- Migration: Add learner_id column to profiles table
-- This allows storing student identification numbers (LRN) from registration
-- Run in Supabase SQL editor or via your migration tooling.

BEGIN;

-- 1) Add learner_id column to profiles table
-- Using TEXT type to accommodate various ID formats (numeric, alphanumeric, with dashes, etc.)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS learner_id TEXT NULL;

-- 2) Add unique constraint to ensure learner_id is unique across all profiles
-- This prevents duplicate student IDs in the system
ALTER TABLE public.profiles
  ADD CONSTRAINT unique_learner_id UNIQUE (learner_id);

-- 3) Create an index for faster lookups by learner_id
CREATE INDEX IF NOT EXISTS idx_profiles_learner_id 
  ON public.profiles (learner_id);

-- 4) Add comment to document the column purpose
COMMENT ON COLUMN public.profiles.learner_id IS 
  'Student learner identification number (LRN) collected during registration';

COMMIT;

-- Rollback (if needed):
-- DROP INDEX IF EXISTS idx_profiles_learner_id;
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS unique_learner_id;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS learner_id;
