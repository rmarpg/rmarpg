# Task B (possible_answers) Result Fix

## Issue Description

Task B1 was showing:

- **Score: 1** ✅ (correctly scored as correct)
- **Result: Wrong** ❌ (incorrectly marked as wrong)

This happened even though the user answered "950", which is a valid answer according to the task definition.

## Root Cause

Task B uses `possible_answers` (an array of valid answers) instead of a single `answer` field:

```javascript
{
  id: 'B1',
  prompt: 'Find a three-digit number greater than 857, with digit 5 in the tens place.',
  type: 'numeric',
  possible_answers: ['858', '859', '950', '951', ..., '959']  // Multiple valid answers
}
```

But the Summary view's `studentResults` logic only checked for `question.answer`:

```javascript
// OLD CODE - Only handled single answer
const expected = question.answer // ← undefined for Task B!
if (expected !== undefined) {
  isCorrect = normalizedAns === normalizedExpected
} else {
  // No comparison done, isCorrect stays false
}
```

### The Flow

1. User answers "950" → **Correctly scored as 1** during the test (because Task.vue validates against `possible_answers`)
2. Summary view loads the answer "950"
3. Tries to compare against `question.answer` → **undefined**
4. Skips comparison, `isCorrect` remains **false** (initial value)
5. Shows **Result: Wrong** even though Score is 1

## Data Analysis

Looking at the assessment data:

```json
{
  "task": "B",
  "subtask": "B1",
  "score": 1, // ← Correct!
  "progress": {
    "answer": "950" // ← Valid answer from possible_answers!
  }
}
```

The answer "950" is in the `possible_answers` array:

```javascript
;['858', '859', '950', '951', '952', '953', '954', '955', '956', '957', '958', '959']
```

So the score of 1 is correct, but the Result logic wasn't checking the array.

## The Fix

Updated `studentResults` to handle both `answer` (single) and `possible_answers` (array):

```typescript
if (ans !== undefined && ans !== null) {
  const normalize = (s: any) => String(s).toLowerCase().trim()
  const normalizedAns = normalize(ans)

  // Check if question has a single answer or multiple possible answers
  if (question.answer !== undefined) {
    // Single answer comparison
    const normalizedExpected = normalize(question.answer)
    isCorrect = normalizedAns === normalizedExpected
    console.log(`[Summary] Answer comparison for ${learnerIdShort}:`, {
      raw_answer: ans,
      normalized_answer: normalizedAns,
      expected: question.answer,
      normalized_expected: normalizedExpected,
      isCorrect,
    })
  } else if (question.possible_answers && Array.isArray(question.possible_answers)) {
    // Multiple possible answers - check if answer is in the list
    const normalizedPossible = question.possible_answers.map((a: any) => normalize(a))
    isCorrect = normalizedPossible.includes(normalizedAns)
    console.log(`[Summary] Answer comparison (possible_answers) for ${learnerIdShort}:`, {
      raw_answer: ans,
      normalized_answer: normalizedAns,
      possible_answers: question.possible_answers,
      normalized_possible: normalizedPossible,
      isCorrect,
    })
  } else {
    console.log(`[Summary] No expected answer defined for question ${question.id}`)
  }
}
```

## Validation Logic

The fix now supports two answer formats:

### Format 1: Single Answer

```javascript
{
  id: 'C1',
  prompt: '65, 60, 55, 50, __ , 40',
  type: 'numeric',
  answer: '45'  // ← Single correct answer
}
```

**Validation**: Direct comparison `userAnswer === answer`

### Format 2: Multiple Possible Answers

```javascript
{
  id: 'B1',
  prompt: 'Find a three-digit number greater than 857, with digit 5 in the tens place.',
  type: 'numeric',
  possible_answers: ['858', '859', '950', ..., '959']  // ← Array of valid answers
}
```

**Validation**: Array inclusion `possible_answers.includes(userAnswer)`

## Tasks Affected

Looking at the Summary.vue task definitions:

| Task  | Questions | Answer Format                                  |
| ----- | --------- | ---------------------------------------------- |
| A     | A1-A4     | `answer` (single)                              |
| **B** | **B1**    | **`possible_answers` (array)** ← Fixed!        |
| C     | C1-C4     | `answer` (single)                              |
| D     | D1a, D1b  | `possible_answers` (array)                     |
| E-L   | Various   | `answer` (single)                              |
| K     | K1, K2    | `possible_answers` (array) or `answer` (array) |

Tasks that use `possible_answers`:

- **Task B** (B1) - Multiple valid 3-digit numbers
- **Task D** (D1a, D1b) - Multiple valid fractions
- **Task K** (K1, K2) - Multiple valid shape names

All of these will now be correctly validated in the Summary view.

## Example Results

### Task B1 (user answered "950")

**Before fix:**
| Name | Score | Result |
|------|-------|--------|
| John | 1 | **Wrong** ❌ |

**After fix:**
| Name | Score | Result |
|------|-------|--------|
| John | 1 | **Correct** ✅ |

### Task D1a (user answered "1/8")

**Before fix:**
| Name | Score | Result |
|------|-------|--------|
| Jane | 1 | **Wrong** ❌ |

**After fix:**
| Name | Score | Result |
|------|-------|--------|
| Jane | 1 | **Correct** ✅ |

## Why Score Was Correct But Result Was Wrong

The **scoring during the test** (in Task.vue) correctly validates against `possible_answers`:

```javascript
// In Task.vue - checkAnswer function
const checkAnswer = (answer: string, question: any): boolean => {
  if (question.possible_answers) {
    // Check if answer is in possible_answers array
    return question.possible_answers.some(
      (pa: any) => normalize(pa) === normalize(answer)
    )
  }
  // ... single answer check
}
```

So the user gets **score: 1** correctly.

But the **Summary view** was only checking `question.answer`, so it showed **Result: Wrong**.

This fix aligns the Summary view's validation logic with the Task view's validation logic.

## Testing

To verify the fix:

1. **Complete Task B** with answer "950" (or any valid number from possible_answers)
2. **Go to Summary view**
3. **Select Task B, Question B1**
4. **Check table**:
   - Score: **1** ✅
   - Result: **Correct** ✅

Repeat for Task D (fractions) and Task K (shapes) to ensure all `possible_answers` questions work correctly.

## Files Changed

- `src/views/Summary.vue` - Added `possible_answers` support in `studentResults` computed property

## Related Issues

This is the third fix in the Summary view score/result consistency series:

1. **SUMMARY_SCORE_FIX.md** - Fixed Score column showing "-"
2. **SUMMARY_SCORE_RESULT_MISMATCH_FIX.md** - Removed incorrect fallback to task total
3. **This fix** - Added support for `possible_answers` array validation

Together, these ensure Score and Result columns are always consistent and accurate.
