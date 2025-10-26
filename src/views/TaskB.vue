<template>
  <RMALayout>
    <Task :task="taskData" :featuredNumber="857" @taskComplete="onTaskComplete" @timeUp="onTimeUp">
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
          <div v-if="question.type === 'multiple_choice'" class="grid gap-3">
            <Button
              v-for="(option, index) in question.options"
              :key="index"
              @click="!hasAnsweredCurrentQuestion && selectAnswer(option, onAnswer)"
              :variant="currentAnswer === option ? 'default' : 'outline'"
              :disabled="hasAnsweredCurrentQuestion"
              :class="[
                'h-auto justify-start p-4 text-left whitespace-normal transition-all duration-300',
                hasAnsweredCurrentQuestion ? 'cursor-not-allowed' : 'cursor-pointer',
                getButtonFeedbackClass(option, question, feedbackState),
              ]"
            >
              <span class="mr-3 font-medium">{{ String.fromCharCode(65 + index) }}.</span>
              {{ option }}
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

// Get Task B data from the JSON
const taskData = computed(() => {
  // Task B from rma.json
  return {
    id: 'B',
    name: 'Number Discrimination',
    points: 1,
    time_limit_seconds: 40,
    questions: [
      {
        id: 'B1',
        prompt: 'Find a three-digit number greater than 857, with digit 5 in the tens place.',
        type: 'multiple_choice',
        answer: '950',
        options: ['852', '950', '847', '963'],
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
  console.log('Task B completed with answers:', answers)
  console.log('currentAssessment.value at completion:', currentAssessment.value)

  // Calculate score for Task B
  const score = calculateTaskScore(answers, taskData.value.questions, taskData.value.points)
  console.log(`Task B score: ${score}/${taskData.value.points}`)

  // Update assessment with Task B score
  if (currentAssessment.value) {
    console.log('Updating score for assessment:', currentAssessment.value.id)
    const success = await updateTaskScore('B', score)
    if (success) {
      console.log('Task B score saved successfully')
      // Navigate to Task C
      router.push('/task-c')
    } else {
      console.error('Failed to save Task B score')
    }
  } else {
    console.error('No current assessment found')
    console.error('Attempting to create assessment during task completion...')
    const assessment = await getOrCreateAssessment(user.value!, 2) // Use non-null assertion since we know user exists here
    if (assessment) {
      console.log('Created assessment during completion, retrying score update...')
      const success = await updateTaskScore('B', score)
      if (success) {
        console.log('Task B score saved successfully after retry')
        router.push('/task-c')
      } else {
        console.error('Failed to save Task B score even after creating assessment')
      }
    }
  }
}

const onTimeUp = async () => {
  alert('Time is up! Moving to the next section.')
  router.push('/task-c')
}

// Initialize assessment on component mount
onMounted(async () => {
  console.log('TaskB mounted, auth loading:', authLoading.value)
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
