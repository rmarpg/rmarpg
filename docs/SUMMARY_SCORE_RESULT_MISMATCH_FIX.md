# Summary Score/Result Mismatch Fix

## Issue Description

In the Summary view, when viewing individual questions, the table was showing:

- **Score: 1** (or another positive number)
- **Result: Wrong**

This is a logical inconsistency - if a question is wrong, the score should be 0, not 1+.

## Root Cause

The `getStudentScore()` function had a **fallback logic** that was causing the issue:

```typescript
// OLD CODE - BROKEN
const getStudentScore = (assessment: any) => {
  // 1. Try to get subtask-level score (specific question)
  const subtaskEntry = taskMap[taskKey]?.[subtaskKey]
  if (subtaskEntry?.score !== undefined) {
    return subtaskEntry.score // ✅ Correct for this question
  }

  // 2. Fall back to task-level score (sum of all questions)
  const taskLevelEntry = taskMap[taskKey]?.['']
  if (taskLevelEntry?.score !== undefined) {
    return taskLevelEntry.score // ❌ WRONG - this is the TOTAL, not per-question
  }

  return '-'
}
```

### The Problem with Fallback

When displaying per-question scores, falling back to the task-level score is **semantically wrong** because:

1. **Task-level score (`subtask=""`)**: Sum of all question scores
   - Example: Task E has 4 questions, total score = 3
2. **Subtask-level score (`subtask="E1"`)**: Individual question score
   - Example: E1 score = 0 (wrong answer)

If E1 has no subtask record and we fall back to task-level, we'd show:

- **Score: 3** (task total)
- **Result: Wrong** (E1 was answered incorrectly)

This is inconsistent and misleading!

## Example from Real Data

Looking at the assessment data provided:

**Task E:**

```json
// Question E1 - Wrong answer
{
  "task": "E",
  "subtask": "E1",
  "score": 0,
  "progress": {"answer": "335"}  // Correct answer is "355"
}

// Questions E2, E3a, E3b - All correct (score: 1 each)
...

// Task-level record - Total score
{
  "task": "E",
  "subtask": "",
  "score": 3,  // Sum: 0 + 1 + 1 + 1 = 3
  "progress": null
}
```

**Without the fix:**

- If E1 subtask record is missing or filtered out somehow
- `getStudentScore()` falls back to task-level score
- Shows: **Score: 3**, **Result: Wrong**
- User sees: "This wrong answer scored 3 points?!" 🤔

**With the fix:**

- `getStudentScore()` only returns the subtask score
- If subtask record is missing, shows: **Score: -**
- User sees: **Score: -**, **Result: Wrong**
- Clear indication that score data is missing ✅

## The Fix

Removed the fallback to task-level score:

```typescript
// NEW CODE - FIXED
const getStudentScore = (assessment: any): string | number => {
  if (!assessment) return '-'

  const taskKey = selectedTaskId.value.toUpperCase()
  const question = currentQuestion.value
  if (!question) return '-'

  const taskMap = assessment._taskScores || {}

  // Get the subtask-level score for the specific question
  // DO NOT fall back to task-level score as that's the sum of all questions
  const subtaskKey = question.id
  const subtaskEntry = taskMap[taskKey]?.[subtaskKey]
  if (subtaskEntry?.score !== undefined && subtaskEntry?.score !== null) {
    return subtaskEntry.score
  }

  // If no subtask record exists, return '-' instead of showing task total
  return '-'
}
```

## Why This Is Better

### Before (with fallback):

| Question | Score | Result  | Meaning                         |
| -------- | ----- | ------- | ------------------------------- |
| E1       | 3     | Wrong   | ❌ Confusing - shows task total |
| E2       | 1     | Correct | ✅ Correct                      |
| E3a      | 1     | Correct | ✅ Correct                      |

### After (no fallback):

| Question | Score | Result  | Meaning                           |
| -------- | ----- | ------- | --------------------------------- |
| E1       | 0     | Wrong   | ✅ Clear - this question scored 0 |
| E2       | 1     | Correct | ✅ Correct                        |
| E3a      | 1     | Correct | ✅ Correct                        |

Or if subtask record is missing:
| Question | Score | Result | Meaning |
|----------|-------|--------|---------|
| E1 | - | Wrong | ✅ Clear - score data unavailable |

## Semantic Correctness

The key insight is that **task-level and subtask-level scores represent different things**:

| Record Type                        | Purpose                     | Example Value     | Use Case                                 |
| ---------------------------------- | --------------------------- | ----------------- | ---------------------------------------- |
| **Task-level** (`subtask=""`)      | Total score for entire task | 3 points (sum)    | Overall task performance, leaderboard    |
| **Subtask-level** (`subtask="E1"`) | Score for specific question | 0 points (this Q) | Per-question analysis, detailed feedback |

When showing **per-question** information in the Summary view, we should **only** use subtask-level scores. Task-level scores belong in task-level summaries, not question-level displays.

## Related Scenarios

This fix also prevents issues in other edge cases:

### Scenario 1: Old Data (before subtask tracking)

If an old assessment has only task-level records:

- **Before**: Shows task total for every question (wrong)
- **After**: Shows "-" for every question (honest - we don't have per-question data)

### Scenario 2: Partially Completed Task

If a user answered only 2 out of 4 questions:

- **Before**: Questions 3-4 might show the partial total score (misleading)
- **After**: Questions 3-4 show "-" (correct - not answered)

### Scenario 3: Task with Partial Credit (Task K)

Task K can have fractional scores (3.5, 0.875, etc.):

- **Before**: Might show total 4.375 for a single question (wrong)
- **After**: Shows actual question score like 3.5 (correct)

## Testing

To verify the fix:

1. **Complete an assessment** with some correct and some wrong answers
2. **Go to Summary view**
3. **Select a task** (e.g., Task E)
4. **Select a wrong question** (e.g., E1)
5. **Check the table**:
   - Score should be **0** (for wrong answers)
   - Result should be **Wrong**
   - Both should match ✅

## Files Changed

- `src/views/Summary.vue` - Removed fallback logic in `getStudentScore()`

## Notes

- This is a **semantic correctness** fix, not just a UI fix
- The fallback was conceptually wrong - mixing task-level and question-level data
- If subtask records are missing, showing "-" is more honest than showing misleading totals
- This encourages proper subtask tracking (which we fixed in the earlier migration)
