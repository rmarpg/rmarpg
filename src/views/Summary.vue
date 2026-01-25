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
            <label class="mb-1 block text-sm font-medium text-gray-700">Task</label>
            <select
              v-model="selectedTaskId"
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option v-for="t in tasks" :key="t.id" :value="t.id">
                {{ t.id }} — {{ t.name }}
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

        <div v-if="!assessment" class="text-center text-sm text-gray-500">
          No assessment found. Complete an assessment to view summary.
        </div>

        <div v-else class="grid gap-6 lg:grid-cols-2">
          <!-- Pie chart -->
          <div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <Chart :options="chartOptions" :highcharts="Highcharts" class="h-80" />
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
import { Chart } from 'highcharts-vue'
import * as Highcharts from 'highcharts'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import rma from '@/data/rma.json'
import { useAuth } from '@/composables/useAuth'
import { useAssessment, type Assessment } from '@/composables/useAssessment'

// Set Highcharts options for consistency
Highcharts.setOptions({
  lang: { thousandsSep: ',', decimalPoint: '.' },
})

const { user } = useAuth()
const { getBestAssessment } = useAssessment()

const assessment = ref<Assessment | null>(null)
const tasks = (rma as any).assessment.tasks as Array<{ id: string; name: string; questions: any[] }>
const selectedTaskId = ref<string>(tasks[0]?.id || 'A')
const selectedQuestionId = ref<string>(tasks[0]?.questions?.[0]?.id || '')

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
    const progressCol = `task_${taskId.toLowerCase()}_progress`
    const progress = (a as any)[progressCol]

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
      // Fallback: check task score. If user has full TASK_MAX_SCORE, consider them correct.
      const scoreKey = `task_${taskId.toLowerCase()}_score`
      const score = Number((a as any)[scoreKey] ?? 0)
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

const chartOptions = computed((): Highcharts.Options => ({
  chart: { type: 'pie', backgroundColor: 'transparent', height: 320 },
  title: { text: undefined },
  tooltip: { pointFormat: '<b>{point.y}</b> ({point.percentage:.1f}%)' },
  plotOptions: {
    pie: {
      dataLabels: {
        enabled: true,
        format: '<b>{point.name}</b><br>{point.y} ({point.percentage:.1f}%)',
        style: { fontSize: '13px', fontWeight: '500' },
      },
      size: '80%',
      borderWidth: 2,
      borderColor: '#ffffff',
    },
  },
  series: [
    {
      name: 'Answers',
      type: 'pie',
      data: [
        { name: 'Correct', y: correctCount.value, color: '#22c55e' },
        { name: 'Wrong', y: wrongCount.value, color: '#ef4444' },
      ],
    } as Highcharts.SeriesPieOptions,
  ],
  credits: { enabled: false },
}))

// Fetch learners' best assessments for grade level
const fetchLearnerAssessments = async () => {
  try {
    const { data, error } = await (await import('@/lib/supabase-client')).supabase
      .from('assessments')
      .select(
        `*, profiles!learner_id ( first_name, last_name, section )`,
      )
      .eq('grade_level', 2)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assessments for summary:', error)
      return
    }

    const byUser: Record<string, any> = {}
    for (const a of (data || [])) {
      const key = a.learner_id
      if (!key) continue
      const existing = byUser[key]
      if (!existing || (a.total_score ?? 0) > (existing.total_score ?? 0)) {
        byUser[key] = a
      }
    }

    learnerAssessments.value = Object.values(byUser)
  } catch (err) {
    console.error('Unexpected error fetching learner assessments:', err)
  }
}

onMounted(async () => {
  await fetchLearnerAssessments()
})

// Keep selectedQuestionId in sync when task changes
watch(selectedTaskId, (newId) => {
  selectedQuestionId.value = tasks.find((t) => t.id === newId)?.questions?.[0]?.id || ''
})
</script>
