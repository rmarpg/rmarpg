<template>
  <RMALayout>
    <Task :task="taskData" @taskComplete="onTaskComplete" @timeUp="onTimeUp">
      <template #default="{ question, onAnswer }">
        <!-- Image-based division question (J1) -->
        <div v-if="question.id === 'J1'" class="space-y-6">
          <div class="flex justify-center">
            <img
              :src="`/${question.media?.file}`"
              :alt="question.prompt"
              class="max-w-md rounded-lg border shadow-sm"
            />
          </div>

          <div class="space-y-4">
            <label class="block text-sm font-medium text-gray-700">Enter your answer:</label>
            <div class="flex items-center justify-center">
              <input
                v-model="answers[question.id]"
                @input="onAnswer(answers[question.id])"
                type="number"
                class="no-spinners h-12 w-20 rounded border-2 border-gray-300 text-center text-xl focus:border-blue-500 focus:outline-none"
                placeholder="?"
              />
            </div>

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
        </div>

        <!-- Numeric division problems (J2a, J2b) -->
        <div v-else-if="question.id === 'J2a' || question.id === 'J2b'" class="space-y-6">
          <div class="flex items-center justify-center">
            <div class="font-mono text-3xl" v-html="formatMathExpression(question.prompt)"></div>
          </div>

          <div class="space-y-4">
            <label class="block text-center text-sm font-medium text-gray-700"
              >Enter your answer:</label
            >
            <div class="flex items-center justify-center">
              <input
                v-model="answers[question.id]"
                @input="onAnswer(answers[question.id])"
                type="number"
                class="no-spinners h-12 w-20 rounded border-2 border-gray-300 text-center text-xl focus:border-blue-500 focus:outline-none"
                placeholder="?"
              />
            </div>

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
        </div>

        <!-- Word problem (J3) -->
        <div v-else-if="question.id === 'J3'" class="space-y-6">
          <div class="rounded-lg border bg-blue-50 p-6 text-center text-lg leading-relaxed">
            {{ question.prompt }}
          </div>

          <div class="space-y-4">
            <label class="block text-center text-sm font-medium text-gray-700"
              >Enter your answer:</label
            >
            <div class="flex items-center justify-center">
              <input
                v-model="answers[question.id]"
                @input="onAnswer(answers[question.id])"
                type="number"
                class="no-spinners h-12 w-20 rounded border-2 border-gray-300 text-center text-xl focus:border-blue-500 focus:outline-none"
                placeholder="?"
              />
            </div>

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
        </div>
      </template>
    </Task>
  </RMALayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Task from '@/components/Task.vue'
import RMALayout from '@/layouts/RMALayout.vue'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/composables/useAuth'
import { useAssessment } from '@/composables/useAssessment'

// Simple answer tracking per question
const answers = ref<Record<string, string>>({
  J1: '',
  J2a: '',
  J2b: '',
  J3: '',
})

const router = useRouter()
const { user, loading: authLoading } = useAuth()
const { getOrCreateAssessment, updateTaskScore, calculateTaskScore, currentAssessment } =
  useAssessment()

// Format mathematical expressions for display
const formatMathExpression = (prompt: string) => {
  // Handle division symbols and mathematical formatting
  return prompt.replace(/÷/g, '÷').replace(/\?/g, '<span class="text-blue-600 font-bold">?</span>')
}

// Get Task J data with proper TypeScript types
const taskData = computed(() => {
  return {
    id: 'J',
    name: 'Division',
    points: 4,
    time_limit_seconds: 75,
    questions: [
      {
        id: 'J1',
        prompt: 'Divide the balls equally into three groups. How many balls are in each group?',
        type: 'numeric',
        answer: '4',
        media: { type: 'image', file: 'balls-division.png' },
      },
      {
        id: 'J2a',
        prompt: '25 ÷ 5 = ?',
        type: 'numeric',
        answer: '5',
      },
      {
        id: 'J2b',
        prompt: '32 ÷ 4 = ?',
        type: 'numeric',
        answer: '8',
      },
      {
        id: 'J3',
        prompt:
          'Word problem: Fifteen papayas are to be placed in baskets. If each basket contains 3 papayas, how many baskets are needed?',
        type: 'word_problem',
        answer: '5',
      },
    ],
  }
})

const onTaskComplete = async (taskAnswers: Record<string, string>) => {
  console.log('Task J completed with answers:', taskAnswers)
  console.log('currentAssessment.value at completion:', currentAssessment.value)

  // Calculate score for Task J
  const score = calculateTaskScore(taskAnswers, taskData.value.questions, taskData.value.points)
  console.log(`Task J score: ${score}/${taskData.value.points}`)

  // Update assessment with Task J score
  if (currentAssessment.value) {
    console.log('Updating score for assessment:', currentAssessment.value.id)
    const success = await updateTaskScore('J', score)
    if (success) {
      console.log('Task J score saved successfully')
      // Navigate to Task K
      router.push('/task-k')
    } else {
      console.error('Failed to save Task J score')
    }
  } else {
    console.error('No current assessment found')
  }
}

const onTimeUp = () => {
  console.log('Time up for Task J')
  router.push('/task-k')
}

// Initialize assessment when component mounts
const initializeAssessment = async () => {
  if (user.value) {
    console.log('Initializing assessment for user:', user.value.email)
    await getOrCreateAssessment(user.value)
    console.log('Assessment initialized, currentAssessment.value:', currentAssessment.value)
  } else {
    console.error('No user found during assessment initialization')
  }
}

// Initialize when user is available
if (!authLoading.value) {
  if (user.value) {
    initializeAssessment()
  } else {
    console.error('No user found during assessment initialization')
  }
}
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
