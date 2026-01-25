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
import rma from '@/data/rma.json'
// removed unused imports: useAuth, useAssessment, Assessment


// `assessment` and the auth/assessment helpers were unused — removed to clean up.
const tasks = (rma as any).assessment.tasks as Array<{ id: string; name: string; questions: any[] }>
const selectedTaskId = ref<string>(tasks[0]?.id || 'A')
const selectedQuestionId = ref<string>(tasks[0]?.questions?.[0]?.id || '')
const selectedSection = ref<string>('Grade 2')

const TASK_MAX_SCORE = 40

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
    const entry = taskMap[taskKey] || {}
    const progress = entry.progress

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
      // Fallback: check stored per-task score. If user has full TASK_MAX_SCORE, consider them correct.
      const score = Number(entry.score ?? 0)
      isCorrect = score >= TASK_MAX_SCORE
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
          .select('assessment_id, task, score, progress')
          .in('assessment_id', ids)

        if (taskErr) {
          console.warn('Failed to fetch assessment_task_scores for summary:', taskErr)
        } else if (taskRows) {
          const map: Record<string, Record<string, any>> = {}
          for (const r of taskRows) {
            map[r.assessment_id] = map[r.assessment_id] || {}
            map[r.assessment_id][r.task] = { score: r.score, progress: r.progress }
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
