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
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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

// Get Task F data from the JSON and convert to multiple choice
const taskData = computed(() => {
  return {
    id: 'F',
    name: 'Addition Word Problem',
    points: 1,
    time_limit_seconds: 60,
    questions: [
      {
        id: 'F1',
        prompt:
          'Grade 2 - Maya collected 128 bottles. Grade 2 – Agila collected 93 bottles. How many bottles were collected in all?',
        type: 'multiple_choice',
        answer: '221',
        options: ['221', '211', '231', '201'],
        media: { type: 'image', file: 'task-f.png' },
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
  console.log('Task F completed with answers:', answers)
  console.log('currentAssessment.value at completion:', currentAssessment.value)

  // Calculate score for Task F
  const score = calculateTaskScore(answers, taskData.value.questions, taskData.value.points)
  console.log(`Task F score: ${score}/${taskData.value.points}`)

  // Update assessment with Task F score
  if (currentAssessment.value) {
    console.log('Updating score for assessment:', currentAssessment.value.id)
    const success = await updateTaskScore('F', score)
    if (success) {
      console.log('Task F score saved successfully')
      // Navigate to Task G
      router.push('/task-g')
    } else {
      console.error('Failed to save Task F score')
    }
  } else {
    console.error('No current assessment found')
    console.error('Attempting to create assessment during task completion...')
    const assessment = await getOrCreateAssessment(user.value!, 2) // Use non-null assertion since we know user exists here
    if (assessment) {
      console.log('Created assessment during completion, retrying score update...')
      const success = await updateTaskScore('F', score)
      if (success) {
        console.log('Task F score saved successfully after retry')
        router.push('/task-g')
      } else {
        console.error('Failed to save Task F score even after creating assessment')
      }
    }
  }
}

const onTimeUp = async () => {
  alert('Time is up! Moving to the next section.')
  router.push('/task-g')
}

// Initialize assessment on component mount
onMounted(async () => {
  console.log('TaskF mounted, auth loading:', authLoading.value)
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
