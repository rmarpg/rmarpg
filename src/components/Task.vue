<template>
  <div class="mx-auto mt-8 max-w-7xl">
    <!-- Header with Task Info -->
    <div class="mb-6 rounded-lg bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ task.name }}</h1>
          <p class="text-sm text-gray-600">Task {{ task.id }} • {{ task.points }} points</p>
        </div>
        <div class="flex items-center space-x-4">
          <!-- Timer -->
          <div class="flex items-center space-x-2 rounded-lg bg-orange-100 px-3 py-2">
            <svg
              class="h-5 w-5 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span class="font-mono font-medium text-orange-600">{{ formatTime(timeLeft) }}</span>
          </div>
          <!-- Progress -->
          <div class="text-sm text-gray-600">
            {{ currentQuestionIndex + 1 }} / {{ task.questions.length }}
          </div>
        </div>
      </div>
      <!-- Progress Bar -->
      <div class="mt-3 h-2 w-full rounded-full bg-gray-200">
        <div
          class="h-2 rounded-full bg-blue-500 transition-all duration-300"
          :style="{ width: `${((currentQuestionIndex + 1) / task.questions.length) * 100}%` }"
        ></div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="rounded-lg bg-white p-8 shadow-lg">
      <!-- Featured Number Display (if provided) -->
      <div v-if="featuredNumber" class="mb-8 text-center">
        <div
          class="inline-block rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-white shadow-lg"
        >
          <span class="text-4xl font-bold">{{ featuredNumber }}</span>
        </div>
        <p class="mt-2 text-gray-600">Featured Number</p>
      </div>

      <!-- Question Content -->
      <div class="space-y-6">
        <div>
          <div class="mb-4 flex items-center space-x-3">
            <h2 class="text-lg font-semibold text-gray-900">
              Question {{ currentQuestionIndex + 1 }}
            </h2>
            <!-- Speaker Button -->
            <button
              @click="speakQuestion"
              class="rounded-full bg-blue-100 p-2 text-blue-600 transition-colors duration-200 hover:bg-blue-200"
              :disabled="isSpeaking"
              :class="{ 'animate-pulse bg-blue-200': isSpeaking }"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                ></path>
              </svg>
            </button>
          </div>
          <div
            class="text-lg leading-relaxed text-gray-700"
            v-html="formatPrompt(currentQuestion.prompt)"
          ></div>
        </div>

        <!-- Media Content (if available) -->
        <div v-if="currentQuestion.media" class="flex justify-center">
          <img
            :src="`/${currentQuestion.media.file}`"
            :alt="`Question ${currentQuestion.id} illustration`"
            class="max-w-md"
          />
        </div>

        <!-- Answer Input Slot -->
        <div class="mt-8">
          <slot :question="currentQuestion" :onAnswer="handleAnswer"></slot>
        </div>
      </div>

      <!-- Navigation -->
      <div class="mt-8 flex items-center justify-between border-t pt-6">
        <button
          @click="previousQuestion"
          :disabled="currentQuestionIndex === 0"
          class="rounded-lg bg-gray-100 px-6 py-2 text-gray-700 transition-colors duration-200 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          @click="
            currentQuestionIndex === task.questions.length - 1 ? completeTask() : nextQuestion()
          "
          class="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors duration-200 hover:bg-blue-600"
        >
          {{ currentQuestionIndex === task.questions.length - 1 ? 'Finish' : 'Next' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface Question {
  id: string
  prompt: string
  type: string
  answer?: string
  possible_answers?: string[]
  options?: string[]
  media?: {
    type: string
    file: string
  }
}

interface Task {
  id: string
  name: string
  points: number
  time_limit_seconds: number
  questions: Question[]
}

interface Props {
  task: Task
  featuredNumber?: string | number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  taskComplete: [answers: Record<string, string>]
  timeUp: []
}>()

// State
const currentQuestionIndex = ref(0)
const timeLeft = ref(props.task.time_limit_seconds)
const answers = ref<Record<string, string>>({})
const isSpeaking = ref(false)

// Timer
let timerInterval: NodeJS.Timeout | null = null

// Computed
const currentQuestion = computed(() => props.task.questions[currentQuestionIndex.value])

// Methods
const formatPrompt = (prompt: string) => {
  let formatted = prompt

  // Replace fractions like "1/2" with proper KaTeX fractions
  formatted = formatted.replace(/(\d+)\/(\d+)/g, (match, numerator, denominator) => {
    try {
      const latexFraction = `{\\normalsize\\frac{${numerator}}{${denominator}}}`
      return katex.renderToString(latexFraction, {
        displayMode: false,
        throwOnError: false,
      })
    } catch (error) {
      console.error('KaTeX fraction rendering error:', error)
      return match
    }
  })

  // Replace math expressions like "152 + 234 = ?" with KaTeX rendered math in vertical format
  formatted = formatted.replace(
    /(\d+)\s*([+\-×÷])\s*(\d+)\s*=\s*\?/g,
    (match, num1, operator, num2) => {
      try {
        // Convert operator to LaTeX format
        const latexOperator = operator.replace(/×/g, '\\times').replace(/÷/g, '\\div')

        // Create vertical alignment with right-aligned numbers
        const latexExpr = `\\begin{array}{r} ${num1} \\\\ ${latexOperator} \\: ${num2} \\\\ \\hline \\phantom{${num1}} \\end{array}`

        return katex.renderToString(latexExpr, {
          displayMode: true,
          throwOnError: false,
        })
      } catch (error) {
        console.error('KaTeX rendering error:', error)
        return match // Return original if rendering fails
      }
    },
  )

  return formatted
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const startTimer = () => {
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      stopTimer()
      emit('timeUp')
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const speakQuestion = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(currentQuestion.value.prompt)
    const voices = window.speechSynthesis.getVoices()

    // Priority order for natural-sounding voices (similar to Google Translate quality)
    const voicePriorities = [
      // Premium/Neural voices (highest quality)
      'Microsoft Aria Online',
      'Microsoft Jenny Online',
      'Google US English',
      'Google UK English Female',
      'Chrome OS US English',
      'Chrome OS UK English',
      // High-quality system voices
      'Samantha',
      'Alex',
      'Victoria',
      'Allison',
      'Ava (Premium)',
      'Serena (Premium)',
      // Standard system voices
      'Microsoft Zira',
      'Microsoft Hazel',
      'Apple Samantha',
      'Karen',
      'Moira',
      'Tessa',
    ]

    // Find the best available voice
    let selectedVoice = null

    for (const priorityVoice of voicePriorities) {
      const found = voices.find(
        (v) => v.name.includes(priorityVoice) && v.lang.toLowerCase().startsWith('en'),
      )
      if (found) {
        selectedVoice = found
        break
      }
    }

    // Fallback: look for any high-quality English voice
    if (!selectedVoice) {
      const qualityVoices = voices.filter(
        (v) =>
          v.lang.toLowerCase().startsWith('en') &&
          (v.name.toLowerCase().includes('premium') ||
            v.name.toLowerCase().includes('neural') ||
            v.name.toLowerCase().includes('online') ||
            v.name.toLowerCase().includes('google') ||
            v.name.toLowerCase().includes('microsoft')),
      )
      if (qualityVoices.length > 0) {
        selectedVoice = qualityVoices[0]
      }
    }

    // Final fallback: any English voice
    if (!selectedVoice) {
      const enVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'))
      if (enVoices.length > 0) {
        selectedVoice = enVoices[0]
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    // Optimized settings for natural speech
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 0.8

    isSpeaking.value = true

    utterance.onend = () => {
      isSpeaking.value = false
    }

    utterance.onerror = () => {
      isSpeaking.value = false
    }

    // Handle voices loading asynchronously
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        speakQuestion()
        window.speechSynthesis.onvoiceschanged = null
      }
      return
    }

    window.speechSynthesis.speak(utterance)
  } else {
    alert('Speech synthesis not supported in this browser')
  }
}

const handleAnswer = (answer: string) => {
  answers.value[currentQuestion.value.id] = answer
}

const completeTask = () => {
  emit('taskComplete', answers.value)
}

const nextQuestion = () => {
  if (currentQuestionIndex.value < props.task.questions.length - 1) {
    currentQuestionIndex.value++
  }
}

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

// Lifecycle
onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  stopTimer()
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
})
</script>
