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
              <div class="text-xl font-semibold text-gray-900">{{ scorePercent }}%</div>
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
import { ref, computed, onMounted } from 'vue'
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

const currentTask = computed(() => tasks.find((t) => t.id === selectedTaskId.value))
const questionsCount = computed(() => currentTask.value?.questions?.length || 0)

const scorePercent = computed(() => {
  if (!assessment.value) return 0
  const key = `task_${selectedTaskId.value.toLowerCase()}_score` as keyof Assessment
  const val = assessment.value[key] as unknown as number
  return Number(val || 0)
})

const correctCount = computed(() => Math.round((scorePercent.value / 100) * questionsCount.value))
const wrongCount = computed(() => Math.max(questionsCount.value - correctCount.value, 0))

const chartOptions = computed((): Highcharts.Options => {
  return {
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
  }
})

onMounted(async () => {
  if (!user.value) return
  assessment.value = await getBestAssessment(user.value)
})
</script>
