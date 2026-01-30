<template>
  <DashboardLayout>
    <div class="space-y-6">
      <header>
        <h2 class="text-xl font-semibold text-neutral-800 sm:text-2xl">Summary</h2>
        <p class="mt-1 text-sm text-neutral-600 sm:text-base">Assessment summary and overview</p>
      </header>

      <div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
        <div class="mb-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Section</label>
            <select
              v-model="selectedSection"
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none mb-3"
            >
              <option value="Grade 2">Grade 2</option>
            </select>

            <label class="mb-1 block text-sm font-medium text-gray-700">Task</label>
            <select
              v-model="selectedTaskId"
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option v-for="t in tasks" :key="t.id" :value="t.id">
                {{ t.id }} — {{ t.name }}
              </option>
            </select>

            <label class="mt-3 mb-1 block text-sm font-medium text-gray-700">Question</label>
            <select
              v-model="selectedQuestionId"
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option
                v-for="q in currentTask?.questions || []"
                :key="q.id"
                :value="q.id"
              >
                {{ q.id }} — {{ q.prompt || q.title || q.text || q.id }}
              </option>
            </select>
          </div>
          <div class="flex items-end justify-between">
            <div>
              <div class="text-sm text-gray-500">Questions</div>
              <div class="text-xl font-semibold text-gray-900">{{ questionsCount }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">Score</div>
              <div class="text-xl font-semibold text-gray-900">{{ percentCorrect }}%</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">Correct</div>
              <div class="text-xl font-semibold text-green-700">{{ correctCount }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">Wrong</div>
              <div class="text-xl font-semibold text-red-700">{{ wrongCount }}</div>
            </div>
          </div>
        </div>

        <div v-if="learnerAssessments.length === 0" class="text-center text-sm text-gray-500">
          No assessments found. Complete an assessment to view summary.
        </div>

        <div v-else class="grid gap-6 lg:grid-cols-2">
          <!-- Students table -->
          <div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 overflow-auto">
            <h3 class="mb-3 text-lg font-semibold text-gray-900">Students</h3>
            <table class="min-w-full divide-y divide-gray-200 text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left font-medium text-gray-600">Name</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-600">Section</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-600">Learner ID</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-600">Score</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-600">Result</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 bg-white">
                <tr v-for="r in studentResults" :key="r.assessment?.id">
                  <td class="px-3 py-2">
                    {{ r.assessment?.profiles?.first_name }} {{ r.assessment?.profiles?.last_name }}
                  </td>
                  <td class="px-3 py-2">{{ r.assessment?.profiles?.section || '-' }}</td>
                  <td class="px-3 py-2">{{ (r.assessment?.learner_id || '')?.slice(0,8) }}</td>
                  <td class="px-3 py-2">{{ r.assessment ? ((r.assessment._taskScores?.[selectedTaskId.toUpperCase()]?.score) ?? '-') : '-' }}</td>
                  <td class="px-3 py-2">
                    <span
                      :class="r.correct ? 'inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800' : 'inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800'"
                    >
                      {{ r.correct ? 'Correct' : 'Wrong' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Details -->
          <div class="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200">
            <h3 class="mb-3 text-lg font-semibold text-gray-900">Task Details</h3>
            <p class="text-sm text-gray-700">
              <span class="font-medium">{{ currentTask?.name }}</span>
              ({{ selectedTaskId }}) has {{ questionsCount }} questions.
              Based on your score, approximately
              <span class="text-green-700 font-semibold">{{ correctCount }}</span>
              are correct and
              <span class="text-red-700 font-semibold">{{ wrongCount }}</span>
              are wrong.
            </p>
            <p class="mt-2 text-xs text-gray-500">
              Note: Correct vs wrong is approximated from percentage score and question count.
            </p>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
// Charting removed: use students table instead of a pie chart
import DashboardLayout from '@/layouts/DashboardLayout.vue'
// removed unused imports: useAuth, useAssessment, Assessment


// `assessment` and the auth/assessment helpers were unused — removed to clean up.
// `rma.json` retained in repo for storage but not imported at runtime.
// Tasks are defined inline here so Summary doesn't depend on the JSON import.
const tasks = [
  { id: 'A', name: 'Number Identification', points: 4, questions: [ { id: 'A1', prompt: 'How do you read this number? (375)', type: 'short_answer', answer: 'Three hundred seventy-five' }, { id: 'A2', prompt: 'What is the place value of the digit 7 in this number?', type: 'short_answer', answer: 'Tens place' }, { id: 'A3', prompt: 'What is the value of the digit 7 in this number?', type: 'short_answer', answer: 'Seventy' }, { id: 'A4', prompt: 'What is the expanded form of this number?', type: 'short_answer', answer: '300 + 70 + 5' } ] },
  { id: 'B', name: 'Number Discrimination', points: 1, questions: [ { id: 'B1', prompt: 'Find a three-digit number greater than 857, with digit 5 in the tens place.', type: 'numeric', possible_answers: [ '858','859','950','951','952','953','954','955','956','957','958','959' ] } ] },
  { id: 'C', name: 'Missing Number in Patterns', points: 4, questions: [ { id: 'C1', prompt: '65, 60, 55, 50, __ , 40', type: 'numeric', answer: '45' }, { id: 'C2', prompt: '10, 13, 16, 19, 22, __', type: 'numeric', answer: '25' }, { id: 'C3', prompt: '450, 550, 650, __ , 850, 950', type: 'numeric', answer: '750' }, { id: 'C4', prompt: '350, 300, 250, 200, __ , 100', type: 'numeric', answer: '150' } ] },
  { id: 'D', name: 'Missing Unit Fractions', points: 2, questions: [ { id: 'D1a', prompt: 'Fill in missing fraction between 1/10 and 1/7', type: 'short_answer', possible_answers: ['1/8','1/9'] }, { id: 'D1b', prompt: 'Fill in missing fraction between 1/4 and 1/2', type: 'short_answer', possible_answers: ['1/3','1/2'] } ] },
  { id: 'E', name: 'Addition', points: 4, questions: [ { id: 'E1', prompt: 'Find the sum of the blocks representation (image shown).', type: 'numeric', answer: '355' }, { id: 'E2', prompt: 'Find the sum of the blocks representation (image shown).', type: 'numeric', answer: '282' }, { id: 'E3a', prompt: '152 + 234 = ?', type: 'numeric', answer: '386' }, { id: 'E3b', prompt: '457 + 36 = ?', type: 'numeric', answer: '493' } ] },
  { id: 'F', name: 'Addition Word Problem', points: 1, questions: [ { id: 'F1', prompt: 'Grade 2 - Maya collected 128 bottles. Grade 2 – Agila collected 93 bottles. How many bottles were collected in all?', type: 'word_problem', answer: '221' } ] },
  { id: 'G', name: 'Subtraction', points: 4, questions: [ { id: 'G1', prompt: 'Take away 14 mangoes from the picture of mangoes. How many are left?', type: 'numeric', answer: '21' }, { id: 'G2a', prompt: '92 - 21 = ?', type: 'numeric', answer: '71' }, { id: 'G2b', prompt: '137 - 75 = ?', type: 'numeric', answer: '62' }, { id: 'G2c', prompt: '396 - 178 = ?', type: 'numeric', answer: '218' } ] },
  { id: 'H', name: 'Subtraction Word Problem', points: 2, questions: [ { id: 'H1', prompt: 'Jose harvested 125 mangoes. He gave 12 to his neighbor. How many were left?', type: 'word_problem', answer: '113' }, { id: 'H2', prompt: 'Carla bought clothes for P225.00. How much was her change if she gave P250.00?', type: 'word_problem', answer: '25' } ] },
  { id: 'I', name: 'Multiplication', points: 6, questions: [ { id: 'I1', prompt: 'Which multiplication sentence best describes the grouping of candies? (A, B, or C)', type: 'multiple_choice', options: ['A','B','C'], answer: 'C' }, { id: 'I2', prompt: 'Which multiplication sentence best describes the arrangement of stars? (A, B, or C)', type: 'multiple_choice', options: ['A','B','C'], answer: 'A' }, { id: 'I3a', prompt: '4 x 1 = ?', type: 'numeric', answer: '4' }, { id: 'I3b', prompt: '5 x 4 = ?', type: 'numeric', answer: '20' }, { id: 'I3c', prompt: '__ x 9 = 0', type: 'numeric', answer: '0' }, { id: 'I3d', prompt: '2 x __ = 18', type: 'numeric', answer: '9' } ] },
  { id: 'J', name: 'Division', points: 4, questions: [ { id: 'J1', prompt: 'Divide the balls equally into three groups. How many balls are in each group?', type: 'numeric', answer: '4' }, { id: 'J2a', prompt: '25 ÷ 5 = ?', type: 'numeric', answer: '5' }, { id: 'J2b', prompt: '32 ÷ 4 = ?', type: 'numeric', answer: '8' }, { id: 'J3', prompt: 'Word problem: Fifteen papayas are to be placed in baskets. If each basket contains 3 papayas, how many baskets are needed?', type: 'word_problem', answer: '5' } ] },
{ id: 'K', name: 'Geometric Pattern', points: 7, questions: [ { id: 'K1', prompt: 'Name the shapes in the pattern.', type: 'short_answer', possible_answers: ['circle','half-circle','semi-circle','square'] }, { id: 'K2', prompt: 'Draw the missing shapes in the pattern (circle, half-circle, square, circle).', type: 'drawing', answer: ['circle','half-circle','square','circle'] } ] },
  { id: 'L', name: '3D Shapes', points: 5, questions: [ { id: 'L1', prompt: 'Encircle the figures that have a flat surface.', type: 'click_select', answer: 'pyramid,rectangle' }, { id: 'L2', prompt: 'Encircle the figures that have a curved surface.', type: 'click_select', answer: 'cone,sphere' } ] }
] as Array<{ id: string; name: string; points: number; questions: any[] }>

const selectedTaskId = ref<string>(tasks[0]?.id || 'A')
const selectedQuestionId = ref<string>(tasks[0]?.questions?.[0]?.id || '')
const selectedSection = ref<string>('Grade 2')

// Per-task correctness should use the task's `points` value; no global TASK_MAX_SCORE.

// All learners' best assessments (one per learner) for the grade. We fetch
// assessments and group by learner_id similar to Scoresheet to avoid duplicates.
const learnerAssessments = ref<Array<any>>([])

const currentTask = computed(() => tasks.find((t) => t.id === selectedTaskId.value))
const currentQuestion = computed(() => currentTask.value?.questions?.find((q) => q.id === selectedQuestionId.value))
const questionsCount = computed(() => currentTask.value?.questions?.length || 0)

// Build per-question correctness by checking saved progress (answers) when present,
// otherwise fallback to treating full-task scores as fully-correct.
const studentResults = computed(() => {
  const taskId = selectedTaskId.value
  const question = currentQuestion.value
  const results: Array<{ assessment: any; correct: boolean }> = []
  if (!question) return results

  for (const a of learnerAssessments.value) {
  const taskKey = selectedTaskId.value.toUpperCase()
  const taskMap = (a as any)._taskScores || {}
  // Prefer subtask entry for the selected question, fall back to task-level (subtask='')
  const subtaskKey = question.id
  const entry = (taskMap[taskKey] && (taskMap[taskKey][subtaskKey] || taskMap[taskKey][''])) || {}
  const progress = entry?.progress

    let isCorrect = false

    if (progress && progress.answers && typeof progress.answers === 'object') {
      const ans = progress.answers[question.id]
      if (ans !== undefined && ans !== null) {
        const normalize = (s: any) => String(s).toLowerCase().trim()
        const expected = question.answer
        if (expected !== undefined) {
          isCorrect = normalize(ans) === normalize(expected)
        }
      }
    } else {
      // Fallback: check stored per-task score. Use the task's configured `points`.
      const score = Number(entry.score ?? 0)
      const taskMax = currentTask.value?.points ?? 0
      isCorrect = taskMax > 0 ? score >= taskMax : false
    }

    results.push({ assessment: a, correct: isCorrect })
  }

  return results
})

const correctCount = computed(() => studentResults.value.filter((r) => r.correct).length)
const wrongCount = computed(() => studentResults.value.filter((r) => !r.correct).length)
const percentCorrect = computed(() => {
  const total = studentResults.value.length || 1
  return Math.round((correctCount.value / total) * 100)
})

// chartOptions removed; rendering a students table instead

// Fetch learners' best assessments for grade level
const fetchLearnerAssessments = async () => {
  try {
    // Determine grade_level from selectedSection (e.g. "Grade 2" -> 2)
    const gradeLevel = Number((selectedSection.value || 'Grade 2').match(/\d+/)?.[0] || 2)

    const { data, error } = await (await import('@/lib/supabase-client')).supabase
      .from('assessments')
      .select(
        `*, profiles!learner_id ( first_name, last_name, section )`,
      )
      .eq('grade_level', gradeLevel)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assessments for summary:', error)
      return
    }

    const byUser: Record<string, any> = {}
    for (const a of (data || [])) {
      // Exclude admin/system rows
      if (a?.profiles?.first_name === 'Administrator') continue

      const key = a.learner_id
      if (!key) continue
      const existing = byUser[key]
      if (!existing || (a.total_score ?? 0) > (existing.total_score ?? 0)) {
        byUser[key] = a
      }
    }

    const assessments = Object.values(byUser)

    // Fetch per-task scores/progress for these assessments and attach to each row
    try {
      const ids = assessments.map((a: any) => a.id).filter(Boolean)
      if (ids.length > 0) {
        const { data: taskRows, error: taskErr } = await (await import('@/lib/supabase-client')).supabase
          .from('assessment_task_scores')
          .select('assessment_id, task, subtask, score, progress')
          .in('assessment_id', ids)

        if (taskErr) {
          console.warn('Failed to fetch assessment_task_scores for summary:', taskErr)
        } else if (taskRows) {
          const map: Record<string, Record<string, Record<string, any>>> = {}
          for (const r of taskRows) {
            map[r.assessment_id] = map[r.assessment_id] || {}
            map[r.assessment_id][r.task] = map[r.assessment_id][r.task] || {}
            // Use empty-string subtask as task-level aggregate
            const subkey = r.subtask ?? ''
            map[r.assessment_id][r.task][subkey] = { score: r.score, progress: r.progress }
          }

          for (const a of assessments) {
            a._taskScores = map[a.id] || {}
          }
        }
      }
    } catch (err) {
      console.error('Error fetching per-task scores for summary:', err)
    }

    learnerAssessments.value = assessments
  } catch (err) {
    console.error('Unexpected error fetching learner assessments:', err)
  }
}

onMounted(async () => {
  await fetchLearnerAssessments()
})

// Refetch when selectedSection changes
watch(selectedSection, async () => {
  await fetchLearnerAssessments()
})

// Keep selectedQuestionId in sync when task changes
watch(selectedTaskId, (newId) => {
  selectedQuestionId.value = tasks.find((t) => t.id === newId)?.questions?.[0]?.id || ''
})
</script>
