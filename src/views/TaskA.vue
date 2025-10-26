<template>
  <RMALayout>
    <Task :task="taskData" :featuredNumber="375" @taskComplete="onTaskComplete" @timeUp="onTimeUp">
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

// Get Task A data from the JSON
const taskData = computed(() => {
  // Task A from rma.json
  return {
    id: 'A',
    name: 'Number Identification',
    points: 4,
    time_limit_seconds: 55,
    questions: [
      {
        id: 'A1',
        prompt: 'How do you read this number? (375)',
        type: 'multiple_choice',
        answer: 'Three hundred seventy-five',
        options: [
          'Three hundred seventy-five',
          'Three hundred and seventy-five',
          'Thirty-seven five',
          'Three seven five',
        ],
      },
      {
        id: 'A2',
        prompt: 'What is the place value of the digit 7 in this number?',
        type: 'multiple_choice',
        answer: 'Tens place',
        options: ['Ones place', 'Tens place', 'Hundreds place', 'Thousands place'],
      },
      {
        id: 'A3',
        prompt: 'What is the value of the digit 7 in this number?',
        type: 'multiple_choice',
        answer: 'Seventy',
        options: ['Seven', 'Seventy', 'Seven hundred', 'Three hundred'],
      },
      {
        id: 'A4',
        prompt: 'What is the expanded form of this number?',
        type: 'multiple_choice',
        answer: '300 + 70 + 5',
        options: ['3 + 7 + 5', '30 + 70 + 50', '300 + 70 + 5', '375 + 0 + 0'],
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
  console.log('Task A completed with answers:', answers)
  console.log('currentAssessment.value at completion:', currentAssessment.value)

  // Calculate score for Task A
  const score = calculateTaskScore(answers, taskData.value.questions, taskData.value.points)
  console.log(`Task A score: ${score}/${taskData.value.points}`)

  // Update assessment with Task A score
  if (currentAssessment.value) {
    console.log('Updating score for assessment:', currentAssessment.value.id)
    const success = await updateTaskScore('A', score)
    if (success) {
      console.log('Task A score saved successfully')
      // Navigate to Task B
      router.push('/task-b')
    } else {
      console.error('Failed to save Task A score')
    }
  } else {
    console.error('No current assessment found')
    console.error('Attempting to create assessment during task completion...')
    const assessment = await getOrCreateAssessment(user.value!, 2) // Use non-null assertion since we know user exists here
    if (assessment) {
      console.log('Created assessment during completion, retrying score update...')
      const success = await updateTaskScore('A', score)
      if (success) {
        console.log('Task A score saved successfully after retry')
        router.push('/task-b')
      } else {
        console.error('Failed to save Task A score even after creating assessment')
      }
    }
  }
}

const onTimeUp = async () => {
  alert('Time is up! Moving to the next section.')
  router.push('/task-b')
}

// Initialize assessment on component mount
onMounted(async () => {
  console.log('TaskA mounted, auth loading:', authLoading.value)
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
} // Watch for question changes to reset current answer
watch(
  () => taskData.value,
  () => {
    currentAnswer.value = ''
  },
  { deep: true },
)
</script>
