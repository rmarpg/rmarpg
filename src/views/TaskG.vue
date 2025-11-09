<template>
  <RMALayout>
    <!-- Image Display Phase -->
    <div v-if="showImage" class="mx-auto mt-8 max-w-7xl">
      <!-- Header matching Task component style -->
      <div class="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Subtraction</h1>
            <p class="text-sm text-gray-600">Task G • 4 points</p>
          </div>
          <div class="flex items-center space-x-4">
            <!-- Image Timer -->
            <div class="flex items-center space-x-2 rounded-lg bg-blue-100 px-3 py-2">
              <svg
                class="h-5 w-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                ></path>
              </svg>
              <span class="font-mono font-medium text-blue-600">{{ imageTimeLeft }}s</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content matching Task component style -->
      <div class="rounded-lg bg-white p-8 shadow-lg">
        <div class="space-y-6 text-center">
          <h2 class="text-lg font-semibold text-gray-900">Study this image carefully</h2>

          <!-- Display the task-g.png image -->
          <div class="flex justify-center">
            <img
              src="/task-g.png"
              alt="Task G Subtraction Image"
              class="h-auto max-h-96 max-w-full"
              @error="onImageError"
            />
          </div>

          <p class="text-gray-600">The task will begin automatically when the timer ends.</p>
        </div>
      </div>
    </div>

    <!-- Task Phase -->
    <Task v-else :task="taskData" @taskComplete="onTaskComplete" @timeUp="onTimeUp">
      <template
        #default="{
          question,
          onAnswer,
          feedbackState,
          isShowingFeedback,
          hasAnsweredCurrentQuestion,
        }"
      >
        <!-- Multiple Choice Buttons -->
        <div class="space-y-4">
          <label class="block text-sm font-medium text-gray-700"> Choose your answer: </label>

          <!-- Multiple Choice Options -->
          <div v-if="question.type === 'multiple_choice'" class="grid gap-3 sm:gap-4">
            <Button
              v-for="(option, index) in question.options"
              :key="index"
              @click="!hasAnsweredCurrentQuestion && selectAnswer(option, onAnswer)"
              :variant="currentAnswer === option ? 'default' : 'outline'"
              :disabled="hasAnsweredCurrentQuestion"
              :class="[
                'h-auto min-h-[48px] touch-manipulation justify-start p-3 text-left whitespace-normal transition-all duration-300 sm:p-4',
                hasAnsweredCurrentQuestion
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer hover:shadow-md active:scale-[0.98]',
                getButtonFeedbackClass(option, question, feedbackState),
              ]"
            >
              <span class="mr-2 flex-shrink-0 text-sm font-medium sm:mr-3 sm:text-base">
                {{ String.fromCharCode(65 + index) }}.
              </span>
              <span class="text-sm sm:text-base">{{ option }}</span>
            </Button>
          </div>
        </div>
      </template>
    </Task>
  </RMALayout>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Task from '@/components/Task.vue'
import RMALayout from '@/layouts/RMALayout.vue'
import { Button } from '@/components/ui/button'
import { useAssessment } from '@/composables/useAssessment'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const currentAnswer = ref('')
const showImage = ref(true)
const imageTimeLeft = ref(15) // 15 seconds for TaskG
const imageTimer = ref<NodeJS.Timeout | null>(null)

const { user, loading: authLoading } = useAuth()
const { getOrCreateAssessment, updateTaskScore, calculateTaskScore, currentAssessment } =
  useAssessment()

// Get Task G data from the JSON and convert to multiple choice
const taskData = computed(() => {
  return {
    id: 'G',
    name: 'Subtraction',
    points: 4,
    time_limit_seconds: 90,
    questions: [
      {
        id: 'G1',
        prompt: 'Take away 14 mangoes from the picture of mangoes. How many are left?',
        type: 'multiple_choice',
        answer: '21',
        options: ['21', '19', '23', '17'],
        media: { type: 'image', file: 'task-g.png' },
      },
      {
        id: 'G2a',
        prompt: '92 - 21 = ?',
        type: 'multiple_choice',
        answer: '71',
        options: ['71', '81', '61', '73'],
      },
      {
        id: 'G2b',
        prompt: '137 - 75 = ?',
        type: 'multiple_choice',
        answer: '62',
        options: ['62', '52', '72', '58'],
      },
      {
        id: 'G2c',
        prompt: '396 - 178 = ?',
        type: 'multiple_choice',
        answer: '218',
        options: ['218', '208', '228', '214'],
      },
    ],
  }
})

// Start the image display timer
const startImageTimer = () => {
  imageTimer.value = setInterval(() => {
    imageTimeLeft.value--
    if (imageTimeLeft.value <= 0) {
      showImage.value = false
      if (imageTimer.value) {
        clearInterval(imageTimer.value)
        imageTimer.value = null
      }
    }
  }, 1000)
}

// Handle image loading errors
const onImageError = (event: Event) => {
  console.error('Failed to load task-g.png image')
  // Continue with the task even if image fails to load
}

// Methods
const selectAnswer = (option: string, onAnswer: (answer: string) => void) => {
  currentAnswer.value = option
  onAnswer(option)
}

const getButtonFeedbackClass = (option: string, question: any, feedbackState: any) => {
  if (!feedbackState || feedbackState.questionId !== question.id) {
    return ''
  }

  // Show feedback for the selected answer
  if (currentAnswer.value === option) {
    return feedbackState.isCorrect
      ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200'
      : 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200'
  }

  // Show correct answer if user selected wrong
  if (!feedbackState.isCorrect && option === question.answer) {
    return 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200'
  }

  return ''
}

const onTaskComplete = async (answers: Record<string, string>) => {
  console.log('Task G completed with answers:', answers)
  console.log('currentAssessment.value at completion:', currentAssessment.value)

  // Calculate score for Task G
  const score = calculateTaskScore(answers, taskData.value.questions, taskData.value.points)
  console.log(`Task G score: ${score}/${taskData.value.points}`)

  // Update assessment with Task G score
  if (currentAssessment.value) {
    console.log('Updating score for assessment:', currentAssessment.value.id)
    const success = await updateTaskScore('G', score)
    if (success) {
      console.log('Task G score saved successfully')
      // Navigate to Task H
      router.push('/task-h')
    } else {
      console.error('Failed to save Task G score')
    }
  } else {
    console.error('No current assessment found')
    console.error('Attempting to create assessment during task completion...')
    const assessment = await getOrCreateAssessment(user.value!, 2) // Use non-null assertion since we know user exists here
    if (assessment) {
      console.log('Created assessment during completion, retrying score update...')
      const success = await updateTaskScore('G', score)
      if (success) {
        console.log('Task G score saved successfully after retry')
        router.push('/task-h')
      } else {
        console.error('Failed to save Task G score even after creating assessment')
      }
    }
  }
}

const onTimeUp = async () => {
  alert('Time is up! Moving to the next section.')
  router.push('/task-h')
}

// Initialize assessment on component mount
onMounted(async () => {
  console.log('TaskG mounted, auth loading:', authLoading.value)
  console.log('User at mount:', user.value)

  // Start the image timer
  startImageTimer()

  // Wait for auth to complete if still loading
  if (authLoading.value) {
    console.log('Auth still loading, waiting...')
    // Watch for auth loading to complete
    const stopWatching = watch(
      authLoading,
      async (isLoading) => {
        if (!isLoading) {
          console.log('Auth loading completed, user:', user.value)
          stopWatching() // Stop watching
          await initializeAssessment()
        }
      },
      { immediate: true },
    )
  } else {
    // Auth already completed
    await initializeAssessment()
  }
})

// Clean up timer on unmount
onUnmounted(() => {
  if (imageTimer.value) {
    clearInterval(imageTimer.value)
    imageTimer.value = null
  }
})

const initializeAssessment = async () => {
  if (user.value) {
    console.log('Initializing assessment for user:', user.value.id)
    const assessment = await getOrCreateAssessment(user.value, 2) // Pass user and default to grade 2
    if (assessment) {
      console.log('Assessment ready:', assessment.id)
      console.log('currentAssessment.value:', currentAssessment.value)
    } else {
      console.error('Failed to get or create assessment')
    }
  } else {
    console.error('No user found during assessment initialization')
    console.error('This might indicate an authentication issue')
  }
}

// Watch for question changes to reset current answer
watch(
  () => taskData.value,
  () => {
    currentAnswer.value = ''
  },
  { deep: true },
)
</script>
