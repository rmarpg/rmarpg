<template>
  <RMALayout>
    <Task :task="taskData" :featuredNumber="375" @taskComplete="onTaskComplete" @timeUp="onTimeUp">
      <template #default="{ question, onAnswer }">
        <!-- Answer Input based on question type -->
        <div class="space-y-4">
          <label class="block text-sm font-medium text-gray-700"> Your Answer: </label>

          <!-- Short Answer Input -->
          <div v-if="question.type === 'short_answer'" class="space-y-2">
            <Input
              v-model="currentAnswer"
              @input="onAnswer(currentAnswer)"
              placeholder="Type your answer here..."
              autocomplete="off"
            />
            <p class="text-sm text-gray-500">
              {{ getAnswerHint(question) }}
            </p>
          </div>

          <!-- Numeric Input -->
          <div v-if="question.type === 'numeric'" class="space-y-2">
            <Input
              v-model.number="currentAnswer"
              @input="onAnswer(currentAnswer.toString())"
              type="number"
              placeholder="Enter a number..."
            />
          </div>

          <!-- Answer Feedback (if answer provided) -->
          <div v-if="currentAnswer" class="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p class="text-blue-800"><strong>Your answer:</strong> {{ currentAnswer }}</p>
          </div>
        </div>
      </template>
    </Task>
  </RMALayout>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import Task from '@/components/Task.vue'
import RMALayout from '@/layouts/RMALayout.vue'
import { Input } from '@/components/ui/input'

const router = useRouter()
const currentAnswer = ref('')

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
        type: 'short_answer',
        answer: 'Three hundred seventy-five',
      },
      {
        id: 'A2',
        prompt: 'What is the place value of the digit 7 in this number?',
        type: 'short_answer',
        answer: 'Tens place',
      },
      {
        id: 'A3',
        prompt: 'What is the value of the digit 7 in this number?',
        type: 'short_answer',
        answer: 'Seventy',
      },
      {
        id: 'A4',
        prompt: 'What is the expanded form of this number?',
        type: 'short_answer',
        answer: '300 + 70 + 5',
      },
    ],
  }
})

// Methods
const getAnswerHint = (question: any) => {
  switch (question.id) {
    case 'A1':
      return 'Example: "Three hundred seventy-five"'
    case 'A2':
      return 'Example: "Tens place", "Hundreds place", etc.'
    case 'A3':
      return 'Example: "Seventy", "Three hundred", etc.'
    case 'A4':
      return 'Example: "300 + 70 + 5"'
    default:
      return 'Type your answer clearly'
  }
}

const onTaskComplete = (answers: Record<string, string>) => {
  console.log('Task A completed with answers:', answers)
  // Navigate to next task or results
  router.push('/scoresheet')
}

const onTimeUp = () => {
  alert('Time is up! Moving to the next section.')
  router.push('/scoresheet')
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
