<template>
  <div class="mx-auto mt-4 max-w-7xl px-3 sm:mt-8 sm:px-4 lg:px-6">
    <!-- Header with Task Info -->
    <div class="mb-4 rounded-lg bg-white p-3 shadow-sm sm:mb-6 sm:p-4 lg:p-6">
      <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 class="text-xl font-bold text-gray-900 sm:text-2xl">{{ task.name }}</h1>
          <p class="text-sm text-gray-600">Task {{ task.id }} • {{ task.points }} points</p>
        </div>
        <div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
          <!-- Timer -->
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
            <!-- Image Re-view Button -->
            <button
              v-if="hasFeaturedImages"
              @click="
                () => {
                  currentImageIndex = 0
                  showImageModal = true
                }
              "
              class="flex items-center space-x-2 rounded-lg bg-blue-100 px-3 py-2 text-blue-600 transition-colors hover:bg-blue-200"
              title="Re-view featured images"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              <span class="hidden text-sm font-medium sm:inline"
                >View Images ({{ featuredImages.length }})</span
              >
            </button>
            <!-- Progress -->
            <div class="text-sm text-gray-600">
              {{ currentQuestionIndex + 1 }} / {{ task.questions.length }}
            </div>
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
    <div class="rounded-lg bg-white p-4 shadow-lg sm:p-6 lg:p-8">
      <!-- Featured Number Display (if provided) -->
      <div v-if="featuredNumber" class="mb-6 text-center sm:mb-8">
        <div
          class="inline-block rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-white shadow-lg sm:px-8 sm:py-4"
        >
          <span class="text-2xl font-bold sm:text-3xl lg:text-4xl">{{ featuredNumber }}</span>
        </div>
        <p class="mt-2 text-gray-600">Featured Number</p>
      </div>

      <!-- Question Content -->
      <div class="space-y-4 sm:space-y-6">
        <div>
          <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <h2 class="text-lg font-semibold text-gray-900">
              Question {{ currentQuestionIndex + 1 }}
            </h2>
            <!-- Speaker Button -->
            <button
              @click="speakQuestion"
              class="self-start rounded-full bg-blue-100 p-2 text-blue-600 transition-colors duration-200 hover:bg-blue-200"
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
            class="text-base leading-relaxed text-gray-700 sm:text-lg"
            v-html="formatPrompt(currentQuestion.prompt)"
          ></div>
        </div>

        <!-- Media Content (if available) -->
        <div v-if="currentQuestion.media" class="flex justify-center">
          <img
            :src="`/${currentQuestion.media.file}`"
            :alt="`Question ${currentQuestion.id} illustration`"
            class="h-auto max-w-sm sm:max-w-md"
          />
        </div>

        <!-- Answer Input Slot -->
        <div class="mt-6 sm:mt-8">
          <slot
            :question="currentQuestion"
            :onAnswer="handleAnswer"
            :feedbackState="feedbackState"
            :isShowingFeedback="isShowingFeedback"
            :hasAnsweredCurrentQuestion="hasAnsweredCurrentQuestion"
          ></slot>
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

    <!-- Image Re-view Modal -->
    <div
      v-if="showImageModal"
      class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
      @click="showImageModal = false"
    >
      <div class="relative max-h-[90vh] max-w-[90vw] rounded-lg bg-white p-6 shadow-xl" @click.stop>
        <!-- Modal Header -->
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Featured Images - {{ task.name }}</h3>
          <button
            @click="showImageModal = false"
            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <!-- Image Navigation -->
        <div
          v-if="featuredImages.length > 1"
          class="mb-4 flex items-center justify-center space-x-4"
        >
          <button
            @click="currentImageIndex = Math.max(0, currentImageIndex - 1)"
            :disabled="currentImageIndex === 0"
            class="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </button>
          <span class="text-sm text-gray-600">
            {{ currentImageIndex + 1 }} / {{ featuredImages.length }}
          </span>
          <button
            @click="currentImageIndex = Math.min(featuredImages.length - 1, currentImageIndex + 1)"
            :disabled="currentImageIndex === featuredImages.length - 1"
            class="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </button>
        </div>

        <!-- Current Image -->
        <div class="flex justify-center">
          <div v-if="featuredImages[currentImageIndex]" class="text-center">
            <img
              :src="featuredImages[currentImageIndex].src"
              :alt="featuredImages[currentImageIndex].alt"
              class="max-h-[60vh] max-w-full rounded-lg shadow-md"
              @error="onImageError"
            />
            <p class="mt-2 text-sm text-gray-600">
              {{ featuredImages[currentImageIndex].description }}
            </p>
          </div>
        </div>

        <!-- Close Button -->
        <div class="mt-6 text-center">
          <button
            @click="showImageModal = false"
            class="rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
          >
            Close
          </button>
        </div>
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
  answerFeedback: [isCorrect: boolean, questionId: string]
}>()

// State
const currentQuestionIndex = ref(0)
const timeLeft = ref(props.task.time_limit_seconds)
const answers = ref<Record<string, string>>({})
const isSpeaking = ref(false)
const feedbackState = ref<{ questionId: string; isCorrect: boolean } | null>(null)
const isShowingFeedback = ref(false)
const hasAnsweredCurrentQuestion = ref(false)

// Image re-view functionality
const showImageModal = ref(false)
const currentImageIndex = ref(0)

// Audio elements for feedback
const correctAudio = ref<HTMLAudioElement | null>(null)
const wrongAudio = ref<HTMLAudioElement | null>(null)

// Timer
let timerInterval: NodeJS.Timeout | null = null

// Computed
const currentQuestion = computed(() => props.task.questions[currentQuestionIndex.value])

// Image re-view computed properties
const featuredImages = computed(() => {
  const images: Array<{ src: string; alt: string; description: string }> = []

  // Collect all unique images from task questions
  const imageFiles = new Set<string>()

  props.task.questions.forEach((question) => {
    if (question.media?.type === 'image' && question.media.file) {
      if (!imageFiles.has(question.media.file)) {
        imageFiles.add(question.media.file)
        images.push({
          src: `/${question.media.file}`,
          alt: `Question ${question.id} illustration`,
          description: `Image for ${question.prompt.length > 50 ? question.prompt.substring(0, 50) + '...' : question.prompt}`,
        })
      }
    }
  })

  // Add task-specific featured images
  const taskSpecificImages: Record<string, { src: string; alt: string; description: string }> = {
    E: {
      src: '/task-e.png',
      alt: 'Task E Featured Image',
      description: 'Addition task featured image',
    },
    G: {
      src: '/task-g.png',
      alt: 'Task G Featured Image',
      description: 'Subtraction task featured image',
    },
    K: {
      src: '/task-k.png',
      alt: 'Task K Featured Image',
      description: 'Geometric pattern task featured image',
    },
  }

  if (taskSpecificImages[props.task.id]) {
    // Add task-specific image at the beginning if not already present
    const taskImage = taskSpecificImages[props.task.id]
    if (!images.find((img) => img.src === taskImage.src)) {
      images.unshift(taskImage)
    }
  }

  return images
})

const hasFeaturedImages = computed(() => featuredImages.value.length > 0)

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
  // Don't allow new answers if already answered this question
  if (hasAnsweredCurrentQuestion.value) {
    return
  }

  answers.value[currentQuestion.value.id] = answer
  hasAnsweredCurrentQuestion.value = true

  // Check if answer is correct and provide feedback
  const isCorrect = checkAnswer(answer, currentQuestion.value)
  provideFeedback(isCorrect, currentQuestion.value.id)

  // Emit feedback event for task-specific handling
  emit('answerFeedback', isCorrect, currentQuestion.value.id)
}

const checkAnswer = (userAnswer: string, question: Question): boolean => {
  const correctAnswer = question.answer?.toString().toLowerCase().trim()
  const userAnswerNormalized = userAnswer.toString().toLowerCase().trim()
  return correctAnswer === userAnswerNormalized
}

const provideFeedback = (isCorrect: boolean, questionId: string) => {
  // Set feedback state for visual feedback and disable interactions
  feedbackState.value = { questionId, isCorrect }
  isShowingFeedback.value = true

  // Play audio feedback
  if (isCorrect && correctAudio.value) {
    correctAudio.value.currentTime = 0
    correctAudio.value.play().catch(console.error)
  } else if (!isCorrect && wrongAudio.value) {
    wrongAudio.value.currentTime = 0
    wrongAudio.value.play().catch(console.error)
  }

  // Clear feedback state after 2 seconds
  setTimeout(() => {
    feedbackState.value = null
    isShowingFeedback.value = false
  }, 2000)
}

const completeTask = () => {
  emit('taskComplete', answers.value)
}

const nextQuestion = () => {
  if (currentQuestionIndex.value < props.task.questions.length - 1) {
    currentQuestionIndex.value++
    // Reset answer state for new question
    hasAnsweredCurrentQuestion.value = false
    isShowingFeedback.value = false
    feedbackState.value = null
  }
}

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    // Reset answer state for new question
    hasAnsweredCurrentQuestion.value = false
    isShowingFeedback.value = false
    feedbackState.value = null
  }
}

// Initialize audio feedback
const initializeAudio = () => {
  correctAudio.value = new Audio('/correct.mp3')
  wrongAudio.value = new Audio('/wrong.mp3')

  // Preload audio files
  if (correctAudio.value) {
    correctAudio.value.preload = 'auto'
    correctAudio.value.volume = 0.7
  }
  if (wrongAudio.value) {
    wrongAudio.value.preload = 'auto'
    wrongAudio.value.volume = 0.7
  }
}

// Image error handler
const onImageError = (event: Event) => {
  console.error('Failed to load image in modal:', event)
}

// Lifecycle
onMounted(() => {
  startTimer()
  initializeAudio()
})

onUnmounted(() => {
  stopTimer()
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
})
</script>
