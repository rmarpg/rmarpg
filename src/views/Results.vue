<template>
  <RMALayout>
    <div
      class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div class="mx-auto max-w-3xl">
        <!-- Results Header -->
        <div class="mb-8 text-center">
          <div
            class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
          >
            <svg
              class="h-10 w-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 sm:text-4xl">Assessment Complete!</h1>
          <p class="mt-2 text-lg text-gray-600">
            Congratulations on completing your RMA assessment
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="py-12 text-center">
          <div
            class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"
          ></div>
          <p class="mt-2 text-gray-600">Calculating your results...</p>
        </div>

        <!-- Results Card -->
        <div v-else-if="assessment" class="overflow-hidden rounded-2xl bg-white shadow-xl">
          <!-- Score Section -->
          <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
            <div class="text-center">
              <h2 class="mb-2 text-2xl font-semibold">Your Final Score</h2>
              <div class="mb-2 text-6xl font-bold">{{ assessment.overall_score }}%</div>
              <div class="text-lg opacity-90">
                {{ assessment.total_score }} out of {{ maxPossibleScore }} points
              </div>
              <div class="mt-4 inline-block rounded-full bg-white/20 px-4 py-2">
                <span class="text-sm font-medium">{{
                  getScoreCategory(assessment.overall_score)
                }}</span>
              </div>
            </div>
          </div>

          <!-- Detailed Breakdown -->
          <div class="p-6">
            <h3 class="mb-4 text-lg font-semibold text-gray-900">Task Breakdown</h3>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="(score, task) in taskScores"
                :key="task"
                class="rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div class="flex items-center justify-between">
                  <h4 class="font-medium text-gray-900">{{ getTaskName(task) }}</h4>
                  <div class="text-right">
                    <div class="text-lg font-semibold text-blue-600">{{ score }}%</div>
                    <div class="text-xs text-gray-500">
                      {{ Math.round(((score || 0) / 100) * getTaskMaxScore(task)) }}/{{
                        getTaskMaxScore(task)
                      }}
                    </div>
                  </div>
                </div>
                <div class="mt-2 h-2 rounded-full bg-gray-200">
                  <div
                    class="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                    :style="{ width: `${score || 0}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Performance Insights -->
          <div class="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <h4 class="mb-2 font-medium text-gray-900">Performance Insights</h4>
            <div class="text-sm text-gray-600">
              <div v-if="assessment.overall_score >= 90" class="flex items-center text-green-700">
                <svg class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                Excellent work! You've demonstrated strong mathematical reasoning skills.
              </div>
              <div
                v-else-if="assessment.overall_score >= 70"
                class="flex items-center text-blue-700"
              >
                <svg class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                Good job! You're on the right track with solid understanding in most areas.
              </div>
              <div
                v-else-if="assessment.overall_score >= 50"
                class="flex items-center text-yellow-700"
              >
                <svg class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                Keep practicing! There's room for improvement in several areas.
              </div>
              <div v-else class="flex items-center text-red-700">
                <svg class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                Don't worry! Everyone learns at their own pace. Consider retrying for more practice.
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="border-t border-gray-200 px-6 py-6">
            <div class="flex flex-col gap-4 sm:flex-row">
              <button
                @click="retryAssessment"
                :disabled="retrying"
                class="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span v-if="retrying" class="flex items-center justify-center">
                  <svg
                    class="mr-3 -ml-1 h-4 w-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="m12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10-10-4.477-10-10 4.477-10 10-10zm0 18c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z"
                    ></path>
                  </svg>
                  Checking permissions...
                </span>
                <span v-else>🔄 Retry Assessment</span>
              </button>
              <button
                @click="goHome"
                class="flex-1 rounded-lg bg-gray-600 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
              >
                🏠 Back to Home
              </button>
            </div>
            <div v-if="!canRetry" class="mt-3 text-center text-xs text-red-600">
              {{ retryBlockReason }}
            </div>
            <div v-if="!canRetry" class="mt-3 flex items-center justify-center">
              <button
                @click="requestExtra"
                :disabled="retrying || requestStatus === 'pending'"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {{ requestStatus === 'pending' ? 'Request Sent' : 'Request Extra Try' }}
              </button>
            </div>
            <p class="mt-3 text-center text-xs text-gray-500">
              Assessment completed on {{ formatDate(assessment.assessment_date) }}
            </p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else class="rounded-2xl bg-white p-8 text-center shadow-xl">
          <div
            class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100"
          >
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
              ></path>
            </svg>
          </div>
          <h3 class="mb-2 text-lg font-medium text-gray-900">Unable to Load Results</h3>
          <p class="mb-6 text-gray-600">There was an issue loading your assessment results.</p>
          <button
            @click="goHome"
            class="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    </div>
  </RMALayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useAssessment, type Assessment } from '@/composables/useAssessment'
import RMALayout from '@/layouts/RMALayout.vue'
import { supabase } from '@/lib/supabase-client'

const router = useRouter()
const { user } = useAuth()
const {
  loading: assessmentLoading,
  getBestAssessment,
  canStartAssessment,
  requestExtraAttempt,
  MAX_ATTEMPTS,
} = useAssessment()

const loading = ref(true)
const retrying = ref(false)
const canRetry = ref(true)
const retryBlockReason = ref('')
const requestStatus = ref<'none' | 'pending' | 'approved' | 'denied'>('none')
const assessment = ref<Assessment | null>(null)

// Task configuration for score calculation
const taskConfig = {
  task_a: { name: 'Task A', maxScore: 100 },
  task_b: { name: 'Task B', maxScore: 100 },
  task_c: { name: 'Task C', maxScore: 100 },
  task_d: { name: 'Task D', maxScore: 100 },
  task_e: { name: 'Task E', maxScore: 100 },
  task_f: { name: 'Task F', maxScore: 100 },
  task_g: { name: 'Task G', maxScore: 100 },
  task_h: { name: 'Task H', maxScore: 100 },
  task_i: { name: 'Task I', maxScore: 100 },
  task_j: { name: 'Task J', maxScore: 100 },
  task_k: { name: 'Task K', maxScore: 100 },
  task_l: { name: 'Task L', maxScore: 100 },
}

const maxPossibleScore = computed(() => {
  return Object.values(taskConfig).reduce((sum, config) => sum + config.maxScore, 0)
})

const taskScores = computed(() => {
  if (!assessment.value) return {}

  return {
    task_a: assessment.value.task_a_score,
    task_b: assessment.value.task_b_score,
    task_c: assessment.value.task_c_score,
    task_d: assessment.value.task_d_score,
    task_e: assessment.value.task_e_score,
    task_f: assessment.value.task_f_score,
    task_g: assessment.value.task_g_score,
    task_h: assessment.value.task_h_score,
    task_i: assessment.value.task_i_score,
    task_j: assessment.value.task_j_score,
    task_k: assessment.value.task_k_score,
    task_l: assessment.value.task_l_score,
  }
})

const getTaskName = (taskKey: string): string => {
  return taskConfig[taskKey as keyof typeof taskConfig]?.name || taskKey
}

const getTaskMaxScore = (taskKey: string): number => {
  return taskConfig[taskKey as keyof typeof taskConfig]?.maxScore || 100
}

const getScoreCategory = (score: number): string => {
  if (score >= 90) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Satisfactory'
  return 'Needs Improvement'
}

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

const loadResults = async () => {
  if (!user.value) {
    router.push('/')
    return
  }

  try {
    loading.value = true
    const result = await getBestAssessment(user.value)

    if (result) {
      assessment.value = result
    } else {
      console.warn('No assessment found for user')
    }
  } catch (error) {
    console.error('Error loading assessment results:', error)
  } finally {
    loading.value = false
  }
}

const retryAssessment = async () => {
  if (!user.value) return
  retrying.value = true
  const res = await canStartAssessment(user.value)
  retrying.value = false
  if (!res.allowed) {
    canRetry.value = false
    retryBlockReason.value = res.reason || `Attempt limit reached (${MAX_ATTEMPTS}).`
    // Fetch latest request status
    try {
      const { data } = await supabase
        .from('assessment_retry_requests')
        .select('status')
        .eq('learner_id', user.value.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      requestStatus.value = (data?.status as any) || 'none'
    } catch {
      requestStatus.value = 'none'
    }
    return
  }
  router.push('/welcome')
}

const requestExtra = async () => {
  if (!user.value) return
  retrying.value = true
  const res = await requestExtraAttempt(user.value)
  retrying.value = false
  if (res.success) {
    requestStatus.value = 'pending'
  }
}

const goHome = () => {
  router.push('/welcome')
}

onMounted(loadResults)
</script>
