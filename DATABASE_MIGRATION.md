# Database Migration for Resumable Assessments

## Overview
This migration adds support for saving and restoring task progress across sessions and devices using Supabase database storage.

## Existing Table Schema (for reference)
```
create table public.assessments (
   id uuid not null default gen_random_uuid (),
   learner_id uuid null,
   grade_level integer not null default 2,
   assessment_date date not null default CURRENT_DATE,
   task_a_score integer null default 0,
   task_b_score integer null default 0,
   task_c_score integer null default 0,
   task_d_score integer null default 0,
   task_e_score integer null default 0,
   task_f_score integer null default 0,
   task_g_score integer null default 0,
   task_h_score integer null default 0,
   task_i_score integer null default 0,
   task_j_score integer null default 0,
   task_k_score integer null default 0,
   task_l_score integer null default 0,
   total_score integer null default 0,
   overall_score numeric(5, 2) null,
   created_at timestamp with time zone null default now(),
   updated_at timestamp with time zone null default now(),
   constraint assessments_pkey primary key (id),
   constraint assessments_learner_id_fkey foreign KEY (learner_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;
```

## Required Database Changes

### Add Progress Columns to `assessments` Table

You need to add the following JSONB columns to your `assessments` table in Supabase:

```sql
-- Add progress tracking columns for each task
ALTER TABLE assessments 
ADD COLUMN task_a_progress JSONB,
ADD COLUMN task_b_progress JSONB,
ADD COLUMN task_c_progress JSONB,
ADD COLUMN task_d_progress JSONB,
ADD COLUMN task_e_progress JSONB,
ADD COLUMN task_f_progress JSONB,
ADD COLUMN task_g_progress JSONB,
ADD COLUMN task_h_progress JSONB,
ADD COLUMN task_i_progress JSONB,
ADD COLUMN task_j_progress JSONB,
ADD COLUMN task_k_progress JSONB,
ADD COLUMN task_l_progress JSONB;

-- If you already run the migration above and only need to add Task L later, run:
-- ALTER TABLE assessments ADD COLUMN task_l_score integer null default 0;
-- Optionally backfill cached per-task column from assessment_task_scores:
-- UPDATE assessments
-- SET task_l_score = s.score
-- FROM (
--   SELECT assessment_id, score FROM assessment_task_scores WHERE task = 'L'
-- ) s
-- WHERE s.assessment_id = assessments.id; 
```

### Add Retry Request Support (Attempt Limits)

To enforce a maximum of 3 attempts per learner and allow requesting an additional attempt pending admin approval, add a new table:

```sql
create table public.assessment_retry_requests (
   id uuid primary key default gen_random_uuid(),
   learner_id uuid not null references profiles (id) on delete cascade,
   status text not null check (status in ('pending','approved','denied')) default 'pending',
   reason text null,
   used boolean not null default false,
   used_at timestamptz null,
   approved_by uuid null references profiles (id) on delete set null,
   approved_at timestamptz null,
   created_at timestamptz not null default now(),
   updated_at timestamptz not null default now()
);

-- Helpful indexes
create index on public.assessment_retry_requests (learner_id, status, used);

-- Row Level Security (example policies, adjust to your needs)
alter table public.assessment_retry_requests enable row level security;

-- Learners can view and create their own requests
create policy "Learner can read own requests" on public.assessment_retry_requests
   for select using (auth.uid() = learner_id);

create policy "Learner can create request" on public.assessment_retry_requests
   for insert with check (auth.uid() = learner_id);

-- Admins can approve/deny and mark used (replace role check accordingly)
-- Example: use a function or role flag in profiles (e.g., is_admin boolean)
-- update these policies to your org's approach.
```

Frontend changes expect this table to exist. When a learner is at the 3-attempt limit, they can submit a `pending` request. Admins approve by setting `status = 'approved'`. On the next start, the app consumes an approved unused request by setting `used = true`.

### Progress Data Structure

Each progress column will store a JSON object with the following structure:

```typescript
{
  current_question_index: number,  // Which question the user is on (0-based)
  time_left: number,                // Seconds remaining
  answers: {                        // User's answers so far
    "A1": "answer",
    "A2": "answer",
    ...
  },
  updated_at: string                // ISO timestamp of last update
}
```

## Features

### 1. **Automatic Progress Saving**
- Progress is saved every second as the timer counts down
- Answers are saved immediately after each question is answered
- Progress is saved when advancing to the next question

### 2. **Progress Restoration**
- When a task page loads, it checks for saved progress in the database
- If progress exists and is less than 24 hours old, it's automatically restored
- Users can see a blue banner indicating progress was restored
- Restores: current question index, time remaining, and all previous answers

### 3. **Smart Cleanup**
- Progress is automatically cleared when a task is completed
- Old progress (>24 hours) is automatically discarded
- Users can manually restart a task using the "Restart Task" button

### 4. **Cross-Device Support**
- Unlike localStorage, database storage allows users to resume from any device
- As long as they're logged in, their progress syncs automatically

## Implementation Details

### Modified Files

1. **src/composables/useAssessment.ts**
   - Added `TaskProgress` interface
   - Added `saveTaskProgress()` function
   - Added `loadTaskProgress()` function
   - Added `clearTaskProgress()` function

2. **src/components/Task.vue**
   - Removed localStorage-based progress saving
   - Integrated database-based progress functions
   - Added visual "Progress Restored" banner
   - Added "Restart Task" button

### How to Apply Migration

1. Log into your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the ALTER TABLE statement above
4. Create the `assessment_retry_requests` table and policies
5. Verify the columns and table were created successfully
6. Deploy the updated code

### Testing

To verify the implementation works:

1. Start any task (e.g., Task A)
2. Answer 1-2 questions
3. Note the current question number and time remaining
4. Close the browser tab or refresh the page
5. Navigate back to the same task
6. You should see:
   - Blue "Progress Restored" banner
   - Same question you were on
   - Time remaining preserved
   - Previous answers retained

### Rollback

If you need to rollback:

```sql
-- Remove progress columns
ALTER TABLE assessments 
DROP COLUMN task_a_progress,
DROP COLUMN task_b_progress,
DROP COLUMN task_c_progress,
DROP COLUMN task_d_progress,
DROP COLUMN task_e_progress,
DROP COLUMN task_f_progress,
DROP COLUMN task_g_progress,
DROP COLUMN task_h_progress,
DROP COLUMN task_i_progress,
DROP COLUMN task_j_progress,
DROP COLUMN task_k_progress,
DROP COLUMN task_l_progress;
```

To remove the retry request support:

```sql
drop table if exists public.assessment_retry_requests;
```

## Benefits

- ✅ Users can safely reload pages without losing progress
- ✅ Users can switch devices and continue where they left off
- ✅ Prevents frustration from accidental page closes
- ✅ Improves user experience and completion rates
- ✅ Progress syncs in real-time across devices
- ✅ Old/stale progress is automatically cleaned up
