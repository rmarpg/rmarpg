# Summary View Score Display Fix

## Issue Description

In the Summary view, the **Score column** was displaying `-` (dash) while the **Result column** correctly showed "Correct" or "Wrong" for the same student/question.

### Example of the Issue

| Name     | Section   | Learner ID | Score | Result         |
| -------- | --------- | ---------- | ----- | -------------- |
| John Doe | Grade 2-A | 12345      | **-** | **Correct** ✅ |

This inconsistency was confusing because:

- The Result was correctly calculated as "Correct"
- But the Score showed as missing/unavailable ("-")

## Root Cause

The issue was in how the Score column was accessing the `_taskScores` data structure.

### Data Structure

After fetching assessment task scores, the data is organized as:

```javascript
assessment._taskScores = {
  "B": {
    "B1": { score: 1, progress: { answer: "950", ... } },  // Subtask-level
    "": { score: 1, progress: null }                        // Task-level
  },
  "I": {
    "I1": { score: 1, progress: { answer: "C", ... } },
    "I2": { score: 1, progress: { answer: "A", ... } },
    // ... more subtasks
    "": { score: 6, progress: null }
  }
  // ... other tasks
}
```

### The Bug

**Score column (lines 85-90) - BROKEN:**

```vue
<td class="px-3 py-2">
  {{
    r.assessment
      ? (r.assessment._taskScores?.[selectedTaskId.toUpperCase()]?.score ?? '-')
      : '-'
  }}
</td>
```

This code tried to access:

```javascript
_taskScores['B'].score // ❌ Undefined! "B" is an object, not a score entry
```

The structure is:

```javascript
_taskScores["B"] = {
  "B1": { score: 1, ... },
  "": { score: 1, ... }
}
```

So `_taskScores["B"].score` returns `undefined`, which causes the `??` operator to return `'-'`.

**Result column (lines 404-489) - WORKED:**

```javascript
const studentResults = computed(() => {
  // ...
  const subtaskKey = question.id // e.g., "B1"
  const entry = (taskMap[taskKey] && (taskMap[taskKey][subtaskKey] || taskMap[taskKey][''])) || {}
  // ... correctly gets score from entry.score
})
```

This correctly:

1. Gets the task map: `taskMap[taskKey]` → `{ "B1": {...}, "": {...} }`
2. Gets the subtask entry: `taskMap[taskKey][subtaskKey]` → `{ score: 1, progress: {...} }`
3. Falls back to task-level: `taskMap[taskKey]['']` if subtask not found
4. Extracts the score: `entry.score` → `1`

## The Fix

Added a helper function `getStudentScore()` that properly navigates the nested structure:

```typescript
const getStudentScore = (assessment: any): string | number => {
  if (!assessment) return '-'

  const taskKey = selectedTaskId.value.toUpperCase()
  const question = currentQuestion.value
  if (!question) return '-'

  const taskMap = assessment._taskScores || {}

  // Try to get the subtask-level score first (for the specific question)
  const subtaskKey = question.id
  const subtaskEntry = taskMap[taskKey]?.[subtaskKey]
  if (subtaskEntry?.score !== undefined && subtaskEntry?.score !== null) {
    return subtaskEntry.score
  }

  // Fall back to task-level score (empty string subtask)
  const taskLevelEntry = taskMap[taskKey]?.['']
  if (taskLevelEntry?.score !== undefined && taskLevelEntry?.score !== null) {
    return taskLevelEntry.score
  }

  return '-'
}
```

Updated the template to use the helper:

```vue
<td class="px-3 py-2">
  {{ getStudentScore(r.assessment) }}
</td>
```

## Lookup Hierarchy

The function follows this hierarchy:

1. **First**: Check subtask-level score
   - Path: `_taskScores[TASK][QUESTION_ID].score`
   - Example: `_taskScores["B"]["B1"].score` → `1`
   - This is the per-question score

2. **Fallback**: Check task-level score
   - Path: `_taskScores[TASK][""].score`
   - Example: `_taskScores["B"][""].score` → `1`
   - This is the aggregated task score

3. **Default**: Return "-" if no score found

## Why This Matters

### Before the Fix

- **Score column**: Shows "-" (wrong)
- **Result column**: Shows "Correct" (right)
- **Problem**: Inconsistent display confuses users

### After the Fix

- **Score column**: Shows actual score (e.g., "1")
- **Result column**: Shows "Correct" (same as before)
- **Result**: Consistent, clear information

## Testing

To verify the fix works:

1. **View Summary page** with completed assessments
2. **Select a task** (e.g., Task B)
3. **Select a question** (e.g., B1)
4. **Check the table**:
   - Score column should show the actual score (e.g., "1", "0.5", "0")
   - Result column should show "Correct" or "Wrong"
   - Both should be consistent with each other

### Expected Results

For a student who answered Task B correctly:
| Name | Section | Learner ID | Score | Result |
|------|---------|------------|-------|--------|
| John Doe | Grade 2-A | 12345 | **1** ✅ | **Correct** ✅ |

For a student who answered Task I, question I1 correctly:
| Name | Section | Learner ID | Score | Result |
|------|---------|------------|-------|--------|
| Jane Smith | Grade 2-B | 67890 | **1** ✅ | **Correct** ✅ |

## Related Issues

This fix is related to the subtask tracking consistency work:

- Both issues stem from the nested `_taskScores` structure
- The Result column was already handling it correctly
- The Score column needed the same careful navigation

## Files Changed

- `src/views/Summary.vue` - Added `getStudentScore()` helper function and updated template

## Notes

- The fix maintains consistency with how the Result column works
- It properly handles both subtask-level and task-level scores
- It gracefully handles missing data by returning "-"
- The same lookup pattern is used in multiple places in the Summary view for consistency
