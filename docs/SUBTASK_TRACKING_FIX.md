# Subtask Tracking Consistency Fix

## Issue Description

Task B (and potentially other single-question tasks) had inconsistent subtask tracking in the `assessment_task_scores` table:

### Example of Inconsistency

**Row 1 (Correct):**

```json
{
  "assessment_id": "9d73b87b-4420-41f1-be24-8d21314e9a31",
  "task": "B",
  "subtask": "B1",
  "score": 1,
  "progress": "{\"answer\": \"950\", \"updated_at\": \"2026-02-02T12:21:12.377Z\"}"
}
```

**Row 2 (Inconsistent):**

```json
{
  "assessment_id": "14bd83e6-5af5-45b2-8a3e-6670ed8ef0c1",
  "task": "B",
  "subtask": "",
  "score": 1,
  "progress": "{\"answers\": {\"B1\": \"950\"}, \"time_left\": 32, \"updated_at\": \"2026-02-02T12:57:56.115Z\", \"current_question_index\": 0}"
}
```

### Root Cause

The system creates **two types of records** in `assessment_task_scores`:

1. **Subtask-level records** (`subtask="B1"`, `subtask="I1"`, etc.)
   - Created when user answers a specific question
   - Contains individual question score and answer
   - Purpose: Track per-question performance

2. **Task-level records** (`subtask=""`)
   - Created for two purposes:
     - **Progress tracking**: Saves state during task (current question, time left, all answers)
     - **Final score**: Aggregates all subtask scores when task completes

The issue occurred because:

1. **During task execution**, `saveTaskProgress()` creates/updates the task-level record (`subtask=""`) with progress data
2. **On task completion**, `updateTaskScore()` updates the same record with the final score and clears progress
3. **If `saveTaskProgress()` was called last**, the record would have progress data AND a score (from a previous update)
4. This created confusion about which record represented the "source of truth" for Task B

## The Fix

### 1. Code Changes

**File: `src/composables/useAssessment.ts`**

Modified `saveTaskProgress()` to explicitly set `score: 0` for progress-only records:

```typescript
const saveTaskProgress = async (
  assessmentId: string,
  taskId: string,
  progress: TaskProgress,
): Promise<boolean> => {
  // ...
  const upsertPayload = {
    assessment_id: assessmentId,
    task: taskKey,
    subtask: '',
    progress: progress,
    score: 0, // ✅ Explicitly set score to 0 for progress-only records
    updated_at: new Date().toISOString(),
  }
  // ...
}
```

### 2. Database Migration

**File: `db/migrations/2026-02-04-0001_cleanup_subtask_consistency.sql`**

The migration performs these actions:

1. **Resets scores on progress-only records:**

   ```sql
   UPDATE public.assessment_task_scores
   SET score = 0
   WHERE subtask = ''
     AND progress IS NOT NULL
     AND progress != 'null'::jsonb
     AND score > 0;
   ```

2. **Adds documentation:**
   - Column comment explaining the subtask field
   - Index for optimizing subtask queries

### 3. Expected Behavior Going Forward

For **Task B** (single-question task), the system will now consistently create:

1. **One subtask record** when user answers B1:

   ```json
   {
     "task": "B",
     "subtask": "B1",
     "score": 1,
     "progress": { "answer": "950", "updated_at": "..." }
   }
   ```

2. **One task-level progress record** (periodically updated during task):

   ```json
   {
     "task": "B",
     "subtask": "",
     "score": 0,
     "progress": {"answers": {"B1": "950"}, "time_left": 32, ...}
   }
   ```

3. **One task-level final score record** (when task completes):
   ```json
   {
     "task": "B",
     "subtask": "",
     "score": 1,
     "progress": null
   }
   ```

Note: Records 2 and 3 are the same row, just updated at different times.

## Why This Matters for Consistency

### Before the Fix

- Some Task B assessments had only `subtask=""` records with scores
- Others had both `subtask="B1"` and `subtask=""` records
- The Summary view had to check both locations for answers
- Score calculations could potentially double-count

### After the Fix

- **All tasks** (including single-question ones like Task B) will have subtask records
- Task-level records with `subtask=""` are clearly identified as:
  - `score=0, progress≠null` → Progress tracking (temporary state)
  - `score>0, progress=null` → Final aggregated score
- Consistent data structure across all tasks

## Data Model Clarification

### Record Types in `assessment_task_scores`

| Record Type          | subtask          | score                     | progress                          | Purpose               |
| -------------------- | ---------------- | ------------------------- | --------------------------------- | --------------------- |
| **Subtask Score**    | "B1", "I1", etc. | Individual question score | Question answer                   | Per-question tracking |
| **Task Progress**    | "" (empty)       | 0                         | Task state (time, answers, index) | Resume capability     |
| **Task Final Score** | "" (empty)       | Sum of subtasks           | null                              | Final aggregation     |

### Summary View Query Logic

The Summary view now has a clear hierarchy:

1. **First**: Check for subtask-level record (e.g., `task="B", subtask="B1"`)
   - Preferred because it has the exact answer for that question
2. **Fallback**: Check task-level record (e.g., `task="B", subtask=""`)
   - Look in `progress.answers[question.id]` for the answer
3. **Within progress**: Check both formats
   - `progress.answer` (subtask-level format)
   - `progress.answers[questionId]` (task-level format)

## Testing Recommendations

1. **Manual Test**: Complete Task B and verify two records are created:
   - One with `subtask="B1"` and score
   - One with `subtask=""` and progress (then score when completed)

2. **Database Verification**:

   ```sql
   SELECT task, subtask, score, progress
   FROM assessment_task_scores
   WHERE task = 'B'
   ORDER BY subtask DESC;
   ```

3. **Summary Page**: Verify Task B answers display correctly on the summary page

## Migration Instructions

To apply these fixes:

1. **Apply code changes**: Already done in `useAssessment.ts`
2. **Run migration**:

   ```bash
   # If using Supabase CLI
   supabase db push

   # Or apply directly to database
   psql <connection_string> -f db/migrations/2026-02-04-0001_cleanup_subtask_consistency.sql
   ```

3. **Verify**: Check existing records have been cleaned up

## Related Files

- `src/composables/useAssessment.ts` - Assessment data management
- `src/components/Task.vue` - Task execution and progress tracking
- `src/views/TaskB.vue` - Task B specific implementation
- `src/components/Summary.vue` - Results display
- `db/migrations/2026-02-04-0001_cleanup_subtask_consistency.sql` - Database cleanup

## Notes

- This fix ensures **forward consistency** - all new records will follow the pattern
- The migration cleans up **existing inconsistent data**
- The design intentionally uses two record types (subtask vs task-level) to support:
  - Per-question analytics
  - Task resumption
  - Flexible scoring (including partial credit for Task K)
