<template>
  <RMALayout>
    <Task :task="taskData" @taskComplete="onTaskComplete" @timeUp="onTimeUp">
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
          <div class="mb-6 text-center">
            <div
              class="rounded-lg bg-blue-50 p-3 font-mono text-lg font-bold text-blue-800 sm:p-4 sm:text-2xl"
            >
              {{ question.prompt }}
            </div>
          </div>

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
              <span class="text-sm sm:text-base">{{ option }}</span>
            </Button>
          </div>
        </div>
      </template>
    </Task>
  </RMALayout>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Task from '@/components/Task.vue'
import RMALayout from '@/layouts/RMALayout.vue'
import { Button } from '@/components/ui/button'
import { useAssessment } from '@/composables/useAssessment'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const currentAnswer = ref('')
const { user, loading: authLoading } = useAuth()
const { getOrCreateAssessment, updateTaskScore, calculateTaskScore, currentAssessment } =
  useAssessment()

// Get Task C data from the JSON
const taskData = computed(() => {
  // Task C from rma.json
  return {
    id: 'C',
    name: 'Missing Number in Patterns',
    points: 4,
    time_limit_seconds: 120,
    questions: [
      {
        id: 'C1',
        prompt: 'Find the missing number: 65, 60, 55, 50, __ , 40',
        type: 'multiple_choice',
        answer: '45',
        options: ['35', '45', '55', '65'],
      },
      {
        id: 'C2',
        prompt: 'Find the missing number: 10, 13, 16, 19, 22, __',
        type: 'multiple_choice',
        answer: '25',
        options: ['23', '24', '25', '26'],
      },
      {
        id: 'C3',
        prompt: 'Find the missing number: 450, 550, 650, __ , 850, 950',
        type: 'multiple_choice',
        answer: '750',
        options: ['700', '720', '750', '780'],
      },
      {
        id: 'C4',
        prompt: 'Find the missing number: 350, 300, 250, 200, __ , 100',
        type: 'multiple_choice',
        answer: '150',
        options: ['120', '130', '150', '170'],
      },
    ],
  }
})

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
  console.log('Task C completed with answers:', answers)
  console.log('currentAssessment.value at completion:', currentAssessment.value)

  // Calculate score for Task C
  const score = calculateTaskScore(answers, taskData.value.questions, taskData.value.points)
  console.log(`Task C score: ${score}/${taskData.value.points}`)

  // Update assessment with Task C score
  if (currentAssessment.value) {
    console.log('Updating score for assessment:', currentAssessment.value.id)
    const success = await updateTaskScore('C', score)
    if (success) {
      console.log('Task C score saved successfully')
      // Navigate to Task D
      router.push('/task-d')
    } else {
      console.error('Failed to save Task C score')
    }
  } else {
    console.error('No current assessment found')
    console.error('Attempting to create assessment during task completion...')
    const assessment = await getOrCreateAssessment(user.value!, 2) // Use non-null assertion since we know user exists here
    if (assessment) {
      console.log('Created assessment during completion, retrying score update...')
      const success = await updateTaskScore('C', score)
      if (success) {
        console.log('Task C score saved successfully after retry')
        router.push('/task-d')
      } else {
        console.error('Failed to save Task C score even after creating assessment')
      }
    }
  }
}

const onTimeUp = async () => {
  alert('Time is up! Moving to the next section.')
  router.push('/task-d')
}

// Initialize assessment on component mount
onMounted(async () => {
  console.log('TaskC mounted, auth loading:', authLoading.value)
  console.log('User at mount:', user.value)

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
