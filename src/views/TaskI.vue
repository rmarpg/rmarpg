<template>
  <RMALayout>
    <Task :task="taskData" @taskComplete="onTaskComplete" @timeUp="onTimeUp">
      <template #default="{ question, onAnswer }">
        <!-- Special handling for I1 and I2 with custom multiplication choices -->
        <div
          v-if="question.id === 'I1' || question.id === 'I2'"
          class="space-y-6"
          :key="question.id"
        >
          <label class="block text-sm font-medium text-gray-700"> Choose your answer: </label>

          <!-- Custom multiplication equation choices -->
          <div class="grid gap-4">
            <Button
              v-for="(choice, index) in getMultiplicationChoices(question.id)"
              :key="`${question.id}-${choice.letter}`"
              @click="selectAnswer(choice.letter, onAnswer, question.id)"
              :variant="answers[question.id] === choice.letter ? 'default' : 'outline'"
              class="h-auto cursor-pointer justify-center border-2 p-6 text-center"
            >
              <div class="flex flex-col items-center space-y-2">
                <div class="font-mono text-lg" v-html="formatMultiplication(choice.equation)"></div>
                <div class="text-xl font-bold">{{ choice.letter }}</div>
              </div>
            </Button>
          </div>
        </div>

        <!-- Special handling for I3 subtasks with numeric input -->
        <div v-else-if="question.id.startsWith('I3')" class="space-y-6">
          <label class="block text-sm font-medium text-gray-700"> Enter your answer: </label>

          <!-- Numeric input for fill-in-the-blank -->
          <div class="flex items-center justify-center">
            <div class="flex items-center space-x-4 text-2xl">
              <span v-html="formatMathExpression(question.prompt)"></span>
              <input
                v-model="answers[question.id]"
                @input="onAnswer(answers[question.id])"
                type="number"
                class="no-spinners h-12 w-20 rounded border-2 border-gray-300 text-center text-xl focus:border-blue-500 focus:outline-none"
                placeholder="?"
              />
            </div>
          </div>

          <!-- Submit button for numeric answers -->
          <div class="flex justify-center">
            <Button
              @click="onAnswer(answers[question.id])"
              :disabled="!answers[question.id]"
              class="px-8 py-3 text-lg"
            >
              Submit Answer
            </Button>
          </div>
        </div>
        <!-- Standard multiple choice for other questions -->
        <div v-else class="space-y-4">
          <label class="block text-sm font-medium text-gray-700"> Choose your answer: </label>

          <div v-if="question.type === 'multiple_choice'" class="grid gap-3">
            <Button
              v-for="(option, index) in question.options"
              :key="index"
              @click="selectAnswer(option, onAnswer, question.id)"
              :variant="answers[question.id] === option ? 'default' : 'outline'"
              class="h-auto cursor-pointer justify-start p-4 text-left whitespace-normal"
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
import { useRouter } from 'vue-router'
import Task from '@/components/Task.vue'
import RMALayout from '@/layouts/RMALayout.vue'
import { Button } from '@/components/ui/button'
import { useAssessment } from '@/composables/useAssessment'
import { useAuth } from '@/composables/useAuth'
import katex from 'katex'

const router = useRouter()
const { user, loading: authLoading } = useAuth()
const { getOrCreateAssessment, updateTaskScore, calculateTaskScore, currentAssessment } =
  useAssessment()

// Custom multiplication choices for I1 and I2 based on the provided images
const multiplicationChoicesI1 = [
  { letter: 'A', equation: '12 × 1 = 12' },
  { letter: 'B', equation: '2 × 6 = 12' },
  { letter: 'C', equation: '4 × 3 = 12' },
]

const multiplicationChoicesI2 = [
  { letter: 'A', equation: '4 × 5 = 20' },
  { letter: 'B', equation: '2 × 10 = 20' },
  { letter: 'C', equation: '4 × 5 = 10' },
]

// Simple answer tracking per question
const answers = ref<Record<string, string>>({
  I1: '',
  I2: '',
  I3a: '',
  I3b: '',
  I3c: '',
  I3d: '',
})

// Get multiplication choices based on question ID
const getMultiplicationChoices = (questionId: string) => {
  return questionId === 'I1' ? multiplicationChoicesI1 : multiplicationChoicesI2
}

// Format multiplication equations with KaTeX
const formatMultiplication = (equation: string) => {
  try {
    // Replace × with proper LaTeX multiplication symbol and format
    const latexEquation = equation.replace(/×/g, '\\times')
    return katex.renderToString(latexEquation, {
      displayMode: false,
      throwOnError: false,
    })
  } catch (error) {
    console.error('KaTeX multiplication rendering error:', error)
    return equation
  }
}

// Format math expressions for I3 questions (fill-in-the-blank)
const formatMathExpression = (prompt: string) => {
  try {
    // Extract the math part from prompts like "4 x 1 = ?" or "__ x 9 = 0"
    const mathPart = prompt.match(/([\d_]+\s*[x×]\s*[\d_]+\s*=\s*[\d?_]+)/)?.[0]
    if (mathPart) {
      const latexExpr = mathPart.replace(/x|×/g, '\\times').replace(/__/g, '\\phantom{0}')
      return katex.renderToString(latexExpr, {
        displayMode: false,
        throwOnError: false,
      })
    }
    return prompt
  } catch (error) {
    console.error('KaTeX math expression rendering error:', error)
    return prompt
  }
}

// Simplified numeric input handling - using v-model directly

// Get Task I data from the JSON with I1, I2, and I3 subtasks
const taskData = computed(() => {
  return {
    id: 'I',
    name: 'Multiplication',
    points: 6, // Full points for all subtasks
    time_limit_seconds: 70,
    questions: [
      {
        id: 'I1',
        prompt: 'Which multiplication sentence best describes the grouping of candies?',
        type: 'multiple_choice',
        answer: 'C',
        options: ['A', 'B', 'C'],
        media: { type: 'image', file: 'candies-grouping.png' },
      },
      {
        id: 'I2',
        prompt: 'Which multiplication sentence best describes the arrangement of stars?',
        type: 'multiple_choice',
        answer: 'A',
        options: ['A', 'B', 'C'],
        media: { type: 'image', file: 'stars-arrangement.png' },
      },
      {
        id: 'I3a',
        prompt: '4 × 1 = ?',
        type: 'numeric',
        answer: '4',
      },
      {
        id: 'I3b',
        prompt: '5 × 4 = ?',
        type: 'numeric',
        answer: '20',
      },
      {
        id: 'I3c',
        prompt: '__ × 9 = 0',
        type: 'numeric',
        answer: '0',
      },
      {
        id: 'I3d',
        prompt: '2 × __ = 18',
        type: 'numeric',
        answer: '9',
      },
    ],
  }
})

// Methods
const selectAnswer = (option: string, onAnswer: (answer: string) => void, questionId?: string) => {
  if (questionId) {
    answers.value[questionId] = option
  }
  onAnswer(option)
}

const onTaskComplete = async (answers: Record<string, string>) => {
  console.log('Task I completed with answers:', answers)
  console.log('currentAssessment.value at completion:', currentAssessment.value)

  // Calculate score for Task I
  const score = calculateTaskScore(answers, taskData.value.questions, taskData.value.points)
  console.log(`Task I score: ${score}/${taskData.value.points}`)

  // Update assessment with Task I score
  if (currentAssessment.value) {
    console.log('Updating score for assessment:', currentAssessment.value.id)
    const success = await updateTaskScore('I', score)
    if (success) {
      console.log('Task I score saved successfully')
      // Navigate back to welcome page
      router.push('/welcome')
    } else {
      console.error('Failed to save Task I score')
    }
  } else {
    console.error('No current assessment found')
    console.error('Attempting to create assessment during task completion...')
    const assessment = await getOrCreateAssessment(user.value!, 2)
    if (assessment) {
      console.log('Created assessment during completion, retrying score update...')
      const success = await updateTaskScore('I', score)
      if (success) {
        console.log('Task I score saved successfully after retry')
        router.push('/welcome')
      } else {
        console.error('Failed to save Task I score even after creating assessment')
      }
    }
  }
}

const onTimeUp = async () => {
  alert('Time is up! Moving to the next section.')
  router.push('/welcome')
}

// Initialize assessment on component mount
onMounted(async () => {
  console.log('TaskI mounted, auth loading:', authLoading.value)
  console.log('User at mount:', user.value)

  // Wait for auth to complete if still loading
  if (authLoading.value) {
    console.log('Auth still loading, waiting...')
    const stopWatching = watch(
      authLoading,
      async (isLoading) => {
        if (!isLoading) {
          console.log('Auth loading completed, user:', user.value)
          stopWatching()
          await initializeAssessment()
        }
      },
      { immediate: true },
    )
  } else {
    await initializeAssessment()
  }
})

const initializeAssessment = async () => {
  if (user.value) {
    console.log('Initializing assessment for user:', user.value.id)
    const assessment = await getOrCreateAssessment(user.value, 2)
    if (assessment) {
      console.log('Assessment ready:', assessment.id)
      console.log('currentAssessment.value:', currentAssessment.value)
    } else {
      console.error('Failed to get or create assessment')
    }
  } else {
    console.error('No user found during assessment initialization')
  }
}

// Simplified approach - no watcher needed since we track answers per question directly
</script>

<style scoped>
/* Hide number input spinners/incrementors */
.no-spinners::-webkit-outer-spin-button,
.no-spinners::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.no-spinners[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
