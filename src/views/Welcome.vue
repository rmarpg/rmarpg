<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'
import RMALayout from '@/layouts/RMALayout.vue'
import Leaderboard from '@/components/Leaderboard.vue'
import { useAuth } from '@/composables/useAuth'
import { useAssessment } from '@/composables/useAssessment'
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase-client'

const router = useRouter()
const { user } = useAuth()
const {
  getCurrentAssessment,
  createAssessment,
  canStartAssessment,
  requestExtraAttempt,
  MAX_ATTEMPTS,
} = useAssessment()
const hasPerfectScore = ref(false)
const attempts = ref<number>(0)
const canStart = ref<boolean>(false)
const startBlockReason = ref<string>('')
const requestStatus = ref<'none' | 'pending' | 'approved' | 'denied'>('none')
const requesting = ref(false)
const hasOngoingAssessment = ref(false)
const isLoading = ref(true)

const checkPerfectScore = async () => {
  if (!user.value) {
    hasPerfectScore.value = false
    return
  }

  try {
    const assessment = await getCurrentAssessment(user.value)
    if (assessment) {
      const overall = Number(assessment.overall_score || 0)
      if (!isNaN(overall)) {
        hasPerfectScore.value = overall >= 100
        return
      }

      hasPerfectScore.value = Number(assessment.total_score) === 100
    }
  } catch (e) {
    console.error('Error checking perfect score:', e)
    hasPerfectScore.value = false
  }
}

onMounted(() => {
  checkPerfectScore()
  refreshStartPermission()
})

// Also react to auth changes
watch(user, () => {
  checkPerfectScore()
  refreshStartPermission()
})

const refreshStartPermission = async () => {
  isLoading.value = true
  if (!user.value) {
    attempts.value = 0
    canStart.value = false
    startBlockReason.value = 'Please login to start the assessment.'
    requestStatus.value = 'none'
    hasOngoingAssessment.value = false
    isLoading.value = false
    return
  }

  // Check for ongoing assessment
  try {
    const assessment = await getCurrentAssessment(user.value)
    // An assessment is ongoing if it exists and is not completed
    hasOngoingAssessment.value = !!assessment
  } catch {
    hasOngoingAssessment.value = false
  }

  const res = await canStartAssessment(user.value)
  attempts.value = res.attempts ?? 0
  canStart.value = res.allowed
  startBlockReason.value = res.reason || ''
  // Check for latest retry request status
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
  isLoading.value = false
}

const startAssessment = async () => {
  if (!user.value) return
  const res = await canStartAssessment(user.value)
  if (!res.allowed) {
    startBlockReason.value = res.reason || 'Attempt limit reached.'
    return
  }
  const created = await createAssessment(user.value, 2)
  if (created?.id) {
    router.push('/task-a')
  }
}

const requestExtra = async () => {
  if (!user.value) return
  requesting.value = true
  const result = await requestExtraAttempt(user.value)
  requesting.value = false
  if (result.success) {
    requestStatus.value = 'pending'
  }
}
</script>

<style scoped>
[v-cloak] {
  display: none;
}
</style>

<template>
  <RMALayout>
    <div class="mt-4 grid gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-2">
      <!-- Welcome Section -->
      <section class="order-2 flex flex-col items-center justify-center lg:order-1">
        <div class="px-4 text-center">
          <div class="flex items-center justify-center gap-2">
            <h1 class="text-2xl font-bold text-white sm:text-3xl">Welcome!</h1>
          </div>
          <p class="mt-2 text-sm text-white/80 sm:text-base">You have 20s to finish 2 questions</p>
          <p class="mt-2 text-sm text-white/60">
            Grade 2 RMA. This quiz consist of 11 Tasks with 1-4 questions each
          </p>

          <div class="mt-6 sm:mt-8">
            <Button
              v-cloak
              class="w-full px-6 py-3 text-base sm:w-auto"
              :disabled="!canStart && !hasOngoingAssessment"
              @click="startAssessment"
            >
              {{
                !canStart && !hasOngoingAssessment
                  ? `Locked (${attempts}/${MAX_ATTEMPTS})`
                  : hasOngoingAssessment
                    ? 'Resume Assessment'
                    : "Let's do this!"
              }}
            </Button>
            <div v-cloak v-if="!isLoading && !canStart" class="mt-3 text-xs text-white/80">
              {{ startBlockReason }}
            </div>
            <div v-cloak v-if="!isLoading && !canStart" class="mt-4 flex items-center justify-center gap-2">
              <Button
                class="px-4 py-2"
                variant="secondary"
                :disabled="requesting || requestStatus === 'pending'"
                @click="requestExtra"
              >
                {{ requestStatus === 'pending' ? 'Request Sent' : 'Request Extra Try' }}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <!-- Leaderboard Section -->
      <section class="order-1 flex items-center justify-center lg:order-2">
        <div class="w-full max-w-sm sm:max-w-md">
          <div v-if="hasPerfectScore" class="mb-4 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-200 p-4 shadow-md text-center">
            <div class="flex items-center justify-center space-x-3">
              <div class="text-3xl">🏆</div>
              <div class="text-left">
                <div class="font-semibold text-yellow-900">Perfectionist</div>
                <div class="text-xs text-yellow-800">Congratulations on acing the assessment!</div>
              </div>
            </div>
          </div>
          <Leaderboard />
        </div>
      </section>
    </div>
  </RMALayout>
</template>
