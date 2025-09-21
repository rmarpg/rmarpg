<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import RMALayout from '@/layouts/RMALayout.vue'

const router = useRouter()

const timeLeft = ref(20)
const timerInterval = ref<number | null>(null)

const userAnswer = ref<string>('')
const isSubmitted = ref(false)
const isCorrect = ref(false)
const showFeedback = ref(false)

const correctAnswer = 8

const startTimer = () => {
  timerInterval.value = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      handleTimeUp()
    }
  }, 1000)
}

const handleTimeUp = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  isSubmitted.value = true
  showFeedback.value = true
}

const handleSubmit = () => {
  const answer = parseInt(userAnswer.value)

  if (!isSubmitted.value) {
    isSubmitted.value = true
    isCorrect.value = answer === correctAnswer
    showFeedback.value = true
  } else if (!isCorrect.value) {
    isCorrect.value = answer === correctAnswer
    if (isCorrect.value) {
      showFeedback.value = true
    }
  } else {
    router.push('/welcome')
  }
}

const getButtonText = () => {
  if (!isSubmitted.value) {
    return 'Submit'
  } else if (!isCorrect.value) {
    return 'Try again'
  } else {
    return 'Next'
  }
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})
</script>

<template>
  <RMALayout>
    <div class="flex flex-col items-center justify-center py-8">
      <div class="mb-8 w-full max-w-sm">
        <div class="mb-2 flex items-center justify-between text-white">
          <span class="text-lg font-medium">2/2</span>
          <span class="font-mono text-lg">{{ formatTime(timeLeft) }}</span>
        </div>

        <p class="mb-8 text-sm text-white">Task 0: Subtraction</p>
      </div>

      <div class="mb-6 min-w-[200px] rounded-lg bg-white p-8 text-center">
        <div class="mb-4 flex justify-center">
          <div class="w-32">
            <div class="mb-2 text-right text-4xl font-bold text-gray-800">23</div>
            <div class="mb-4 text-right text-4xl font-bold text-gray-800">
              <span class="mr-1">-</span>15
            </div>
            <div class="mb-4 border-t-2 border-gray-800"></div>
            <div class="flex justify-end">
              <Input
                v-model="userAnswer"
                type="number"
                :class="[
                  'h-12 w-full text-center text-2xl font-bold',
                  showFeedback && !isCorrect ? 'border-red-500 bg-red-50' : '',
                  showFeedback && isCorrect ? 'border-green-500 bg-green-50' : '',
                ]"
                :disabled="isCorrect || timeLeft <= 0"
                placeholder="?"
              />
            </div>
          </div>
        </div>

        <div v-if="showFeedback" class="mb-4">
          <p :class="['text-lg font-bold', isCorrect ? 'text-green-600' : 'text-red-600']">
            {{ isCorrect ? 'Correct!' : 'Wrong' }}
          </p>
        </div>
      </div>

      <Button
        @click="handleSubmit"
        :disabled="timeLeft <= 0 && !isCorrect"
        class="w-full max-w-sm rounded-lg bg-gray-800 px-6 py-3 text-lg font-medium text-white hover:bg-gray-700"
      >
        {{ getButtonText() }}
      </Button>
    </div>
  </RMALayout>
</template>
