<template>
  <div class="mx-auto mt-4 max-w-7xl px-3 sm:mt-8 sm:px-4 lg:px-6">
    <!-- Progress Restored Banner -->
    <div
      v-if="progressRestored"
      class="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <div>
            <p class="text-sm font-medium text-blue-900">Progress Restored</p>
            <p class="text-xs text-blue-700">
              Continuing from question {{ currentQuestionIndex + 1 }} of
              {{ task.questions.length }}
            </p>
          </div>
        </div>
        <button
          @click="restartTask"
          class="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-blue-600 shadow-sm transition-colors hover:bg-blue-100"
        >
          Restart Task
        </button>
      </div>
    </div>

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
            :clearAnswer="clearChildAnswer"
          ></slot>
        </div>
      </div>

      <!-- Navigation - Auto-advance with countdown dialog -->
      <div class="mt-8 border-t pt-6">
        <!-- Navigation content removed - using countdown dialog instead -->
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

    <!-- Countdown Alert Dialog -->
    <AlertDialog v-model:open="showCountdownDialog">
      <AlertDialogContent class="max-w-md">
        <div class="text-center">
          <!-- Feedback Icon -->
          <div class="mb-4 flex justify-center">
            <div v-if="feedbackState">
              <div
                v-if="feedbackState.isCorrect"
                class="flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
              >
                <svg
                  class="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <div
                v-else
                class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100"
              >
                <svg
                  class="h-8 w-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </div>
            </div>
          </div>

          <!-- Feedback Message -->
          <AlertDialogHeader class="mb-4">
            <AlertDialogTitle class="text-center text-lg font-semibold text-gray-900">
              {{ feedbackState?.isCorrect ? 'Correct!' : 'Incorrect' }}
            </AlertDialogTitle>
            <!-- Partial Score Display for Task K -->
            <div v-if="feedbackState?.partialScore" class="mt-2">
              <p class="text-center text-sm text-gray-600">
                {{ feedbackState.partialScore.correct }} out of
                {{ feedbackState.partialScore.total }} correct
              </p>
              <div
                v-if="
                  feedbackState.partialScore.details &&
                  feedbackState.partialScore.details.length > 0
                "
                class="mt-1 text-center text-xs text-gray-500"
              >
                <span class="font-medium">
                  {{
                    feedbackState.partialScore.taskType === 'order'
                      ? 'Correct order:'
                      : feedbackState.partialScore.taskType === 'selection'
                        ? 'Correct selection:'
                        : 'Correct shapes:'
                  }}
                </span>
                {{ feedbackState.partialScore.details.join(', ') }}
              </div>
            </div>
          </AlertDialogHeader>

          <!-- Countdown -->
          <p class="mb-4 text-gray-600">
            {{
              currentQuestionIndex === task.questions.length - 1
                ? 'Finishing task'
                : 'Next question'
            }}
            in...
          </p>

          <!-- Large Countdown Number -->
          <div class="mb-4 text-6xl font-bold text-blue-600">
            {{ countdownSeconds }}
          </div>

          <!-- Progress Message -->
          <p class="text-sm text-gray-500">
            Question {{ currentQuestionIndex + 1 }} of {{ task.questions.length }}
          </p>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAssessment } from '@/composables/useAssessment'
import { useAuth } from '@/composables/useAuth'

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

// Initialize composables
const {
  currentAssessment,
  saveTaskProgress,
  loadTaskProgress,
  clearTaskProgress,
  recordSubtaskScore,
} = useAssessment()
const { user } = useAuth()

// State
const currentQuestionIndex = ref(0)
const timeLeft = ref(props.task.time_limit_seconds)
const answers = ref<Record<string, string>>({})
const isSpeaking = ref(false)
const feedbackState = ref<{
  questionId: string
  isCorrect: boolean
  partialScore?: {
    correct: number
    total: number
    details?: string[]
    taskType?: 'shapes' | 'order' | 'selection'
  }
} | null>(null)
const isShowingFeedback = ref(false)
const hasAnsweredCurrentQuestion = ref(false)
const progressRestored = ref(false)

// Task K partial scoring - generalized for all K subtasks
const currentTaskKScore = ref<{
  correct: number
  total: number
  userShapes: string[]
  expectedShapes: string[]
} | null>(null)

// Countdown dialog state
const showCountdownDialog = ref(false)
const countdownSeconds = ref(3)
let countdownInterval: NodeJS.Timeout | null = null

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
      // Save progress every second as timer counts down
      saveProgress()
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
  console.log('[handleAnswer] Called:', {
    questionId: currentQuestion.value.id,
    answer,
    hasAssessment: !!currentAssessment.value,
    assessmentId: currentAssessment.value?.id,
  })

  // Don't allow new answers if already answered this question
  if (hasAnsweredCurrentQuestion.value) {
    console.log('[handleAnswer] Question already answered, skipping')
    return
  }

  answers.value[currentQuestion.value.id] = answer
  hasAnsweredCurrentQuestion.value = true

  // Save progress after answering
  saveProgress()

  // Check if answer is correct and provide feedback
  const isCorrect = checkAnswer(answer, currentQuestion.value)
  provideFeedback(isCorrect, currentQuestion.value.id)

  // Emit feedback event for task-specific handling
  emit('answerFeedback', isCorrect, currentQuestion.value.id)

  // Record per-subtask score (questions within a task)
  try {
    console.log('[Subtask Recording] Checking conditions:', {
      hasAssessmentId: !!currentAssessment.value?.id,
      assessmentId: currentAssessment.value?.id,
      hasRecordFunction: typeof recordSubtaskScore === 'function',
      taskId: props.task.id,
      questionId: currentQuestion.value.id,
      currentAssessmentFullObject: currentAssessment.value,
    })

    if (currentAssessment.value?.id && recordSubtaskScore) {
      const numQuestions = props.task.questions.length || 1
      // Use fractional per-subtask points so totals can be fractional and sum to task.points
      const perSubtaskPoints = Number(props.task.points) / Number(numQuestions)

      let subtaskScore = 0
      if (currentTaskKScore.value && currentTaskKScore.value.total) {
        const ratio = Math.min(1, currentTaskKScore.value.correct / currentTaskKScore.value.total)
        subtaskScore = ratio * perSubtaskPoints
      } else {
        subtaskScore = isCorrect ? perSubtaskPoints : 0
      }

      // Minimal progress metadata for subtask
      const subtaskProgress = { answer, updated_at: new Date().toISOString() }
      // Use the actual question ID (e.g., "I1", "I2", "I3a") as the subtask identifier
      const subtaskId = currentQuestion.value.id

      console.log('[Subtask Recording] Recording subtask:', {
        assessmentId: currentAssessment.value.id,
        taskId: props.task.id,
        subtaskId,
        score: subtaskScore,
        isCorrect,
        perSubtaskPoints,
      })

      recordSubtaskScore(
        currentAssessment.value.id,
        props.task.id,
        subtaskId,
        subtaskScore,
        subtaskProgress,
      )
        .then(() => {
          console.log('[Subtask Recording] Successfully recorded subtask:', subtaskId)
        })
        .catch((err) => {
          console.error('[Subtask Recording] Error recording subtask:', err)
        })
    } else {
      console.warn(
        '[Subtask Recording] Skipped - missing assessment ID or recordSubtaskScore function',
      )
    }
  } catch (err) {
    console.error('Failed to record subtask score:', err)
  }
}

// Task K validation strategies
const taskKStrategies = {
  K1: {
    allowedShapes: [
      'circle',
      'half-circle',
      'half circle',
      'semi-circle',
      'semi circle',
      'semicircle',
      'halfcircle',
      'square',
    ],
    expectedShapes: ['circle', 'half-circle', 'square'],
    validateAnswer: (userAnswer: string) => {
      const normalizeShape = (shape: string) => {
        if (
          shape === 'semi-circle' ||
          shape === 'half circle' ||
          shape === 'semi circle' ||
          shape === 'semicircle' ||
          shape === 'halfcircle'
        )
          return 'half-circle'
        return shape
      }

      const userShapes = userAnswer
        .toLowerCase()
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== '')

      // Remove duplicates and filter valid shapes, then normalize
      const uniqueUserShapes = [...new Set(userShapes)]
        .filter((shape) => taskKStrategies.K1.allowedShapes.includes(shape))
        .map(normalizeShape)

      // Remove duplicates again after normalization
      const normalizedUniqueShapes = [...new Set(uniqueUserShapes)]

      // Calculate score based on normalized shapes
      const correctShapes = normalizedUniqueShapes.filter((shape) =>
        taskKStrategies.K1.expectedShapes.includes(shape),
      )

      return {
        isCorrect:
          normalizedUniqueShapes.length > 0 &&
          normalizedUniqueShapes.every((shape) =>
            taskKStrategies.K1.expectedShapes.includes(shape),
          ) &&
          correctShapes.length > 0,
        scoring: {
          correct: correctShapes.length,
          total: taskKStrategies.K1.expectedShapes.length,
          userShapes: normalizedUniqueShapes,
          expectedShapes: taskKStrategies.K1.expectedShapes,
        },
      }
    },
  },
  K2: {
    allowedShapes: [
      'circle',
      'half-circle',
      'half circle',
      'semi-circle',
      'semi circle',
      'semicircle',
      'halfcircle',
      'square',
    ],
    expectedPattern: ['circle', 'half-circle', 'square', 'circle'],
    validateAnswer: (userAnswer: string) => {
      const normalizeShape = (shape: string) => {
        if (
          shape === 'semi-circle' ||
          shape === 'half circle' ||
          shape === 'semi circle' ||
          shape === 'semicircle' ||
          shape === 'halfcircle'
        )
          return 'half-circle'
        return shape
      }

      const userPattern = userAnswer
        .toLowerCase()
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== '')
        .map(normalizeShape)

      // Check each position in the pattern
      const correctPositions = userPattern.filter(
        (shape, index) =>
          index < taskKStrategies.K2.expectedPattern.length &&
          shape === taskKStrategies.K2.expectedPattern[index],
      )

      return {
        isCorrect:
          userPattern.length === taskKStrategies.K2.expectedPattern.length &&
          correctPositions.length === taskKStrategies.K2.expectedPattern.length,
        scoring: {
          correct: correctPositions.length,
          total: taskKStrategies.K2.expectedPattern.length,
          userShapes: userPattern,
          expectedShapes: taskKStrategies.K2.expectedPattern,
        },
      }
    },
  },
  K3: {
    expected3DShapes: ['pyramid', 'rectangle'],
    validateAnswer: (userAnswer: string) => {
      const userShapes = userAnswer
        .toLowerCase()
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== '')

      // Remove duplicates
      const uniqueUserShapes = [...new Set(userShapes)]

      // Calculate score based on correct selections
      const correctShapes = uniqueUserShapes.filter((shape) =>
        taskKStrategies.K3.expected3DShapes.includes(shape),
      )

      return {
        isCorrect:
          uniqueUserShapes.length === taskKStrategies.K3.expected3DShapes.length &&
          correctShapes.length === taskKStrategies.K3.expected3DShapes.length,
        scoring: {
          correct: correctShapes.length,
          total: taskKStrategies.K3.expected3DShapes.length,
          userShapes: correctShapes, // Only show correct selections
          expectedShapes: taskKStrategies.K3.expected3DShapes,
        },
      }
    },
  },
  K4: {
    expected3DShapes: ['cone', 'sphere'],
    validateAnswer: (userAnswer: string) => {
      const userShapes = userAnswer
        .toLowerCase()
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== '')

      // Remove duplicates
      const uniqueUserShapes = [...new Set(userShapes)]

      // Calculate score based on correct selections
      const correctShapes = uniqueUserShapes.filter((shape) =>
        taskKStrategies.K4.expected3DShapes.includes(shape),
      )

      return {
        isCorrect:
          uniqueUserShapes.length === taskKStrategies.K4.expected3DShapes.length &&
          correctShapes.length === taskKStrategies.K4.expected3DShapes.length,
        scoring: {
          correct: correctShapes.length,
          total: taskKStrategies.K4.expected3DShapes.length,
          userShapes: correctShapes, // Only show correct selections
          expectedShapes: taskKStrategies.K4.expected3DShapes,
        },
      }
    },
  },
}

const checkAnswer = (userAnswer: string, question: Question): boolean => {
  // Use strategy pattern for Task K subtasks
  if (
    question.id === 'K1' ||
    question.id === 'K2' ||
    question.id === 'K3' ||
    question.id === 'K4'
  ) {
    const strategy = taskKStrategies[question.id as keyof typeof taskKStrategies]
    if (strategy) {
      const result = strategy.validateAnswer(userAnswer)

      // Store partial score for feedback
      currentTaskKScore.value = result.scoring

      return result.isCorrect
    }
  }

  // Standard answer checking for other questions
  const correctAnswer = question.answer?.toString().toLowerCase().trim()
  const userAnswerNormalized = userAnswer.toString().toLowerCase().trim()
  return correctAnswer === userAnswerNormalized
}

const provideFeedback = (isCorrect: boolean, questionId: string) => {
  // Set feedback state for visual feedback and disable interactions
  let partialScore = undefined

  // Add partial scoring for Task K subtasks
  if (
    (questionId === 'K1' || questionId === 'K2' || questionId === 'K3' || questionId === 'K4') &&
    currentTaskKScore.value
  ) {
    if (questionId === 'K1') {
      partialScore = {
        correct: currentTaskKScore.value.correct,
        total: currentTaskKScore.value.total,
        details: currentTaskKScore.value.userShapes.filter((shape: string) =>
          currentTaskKScore.value!.expectedShapes.includes(shape.toLowerCase()),
        ),
        taskType: 'shapes' as const,
      }
    } else if (questionId === 'K2') {
      partialScore = {
        correct: currentTaskKScore.value.correct,
        total: currentTaskKScore.value.total,
        details: currentTaskKScore.value.userShapes.slice(0, currentTaskKScore.value.correct),
        taskType: 'order' as const,
      }
    } else if (questionId === 'K3') {
      partialScore = {
        correct: currentTaskKScore.value.correct,
        total: currentTaskKScore.value.total,
        details: currentTaskKScore.value.userShapes, // userShapes already contains only correct selections
        taskType: 'selection' as const,
      }
    } else if (questionId === 'K4') {
      partialScore = {
        correct: currentTaskKScore.value.correct,
        total: currentTaskKScore.value.total,
        details: currentTaskKScore.value.userShapes, // userShapes already contains only correct selections
        taskType: 'selection' as const,
      }
    }
  }

  feedbackState.value = { questionId, isCorrect, partialScore }
  isShowingFeedback.value = true

  // Play audio feedback
  if (isCorrect && correctAudio.value) {
    correctAudio.value.currentTime = 0
    correctAudio.value.play().catch(console.error)
  } else if (!isCorrect && wrongAudio.value) {
    wrongAudio.value.currentTime = 0
    wrongAudio.value.play().catch(console.error)
  }

  // Start countdown dialog
  startCountdown()
}

const startCountdown = () => {
  countdownSeconds.value = 3
  showCountdownDialog.value = true

  countdownInterval = setInterval(() => {
    countdownSeconds.value--

    if (countdownSeconds.value <= 0) {
      // Clear countdown and proceed
      clearInterval(countdownInterval!)
      countdownInterval = null
      showCountdownDialog.value = false
      feedbackState.value = null
      isShowingFeedback.value = false

      // Automatically proceed to next question or complete task
      if (currentQuestionIndex.value === props.task.questions.length - 1) {
        completeTask()
      } else {
        nextQuestion()
      }
    }
  }, 1000)
}

const completeTask = () => {
  // Clear saved progress when task is completed
  clearProgress()
  emit('taskComplete', answers.value)
}

const nextQuestion = () => {
  if (currentQuestionIndex.value < props.task.questions.length - 1) {
    currentQuestionIndex.value++
    // Reset answer state for new question
    hasAnsweredCurrentQuestion.value = false
    isShowingFeedback.value = false
    feedbackState.value = null
    // Save progress when moving to next question
    saveProgress()
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

// Local storage key for timer state
const getLocalStorageKey = () => {
  return `task_${props.task.id}_timer_${currentAssessment.value?.id || 'unknown'}`
}

// Local storage for timer backup
const saveTimerToLocalStorage = () => {
  try {
    const key = getLocalStorageKey()
    const timerData = {
      timeLeft: timeLeft.value,
      currentQuestionIndex: currentQuestionIndex.value,
      answers: answers.value,
      timestamp: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(timerData))
  } catch (error) {
    console.warn('Failed to save timer to localStorage:', error)
  }
}

const loadTimerFromLocalStorage = () => {
  try {
    const key = getLocalStorageKey()
    const data = localStorage.getItem(key)
    if (data) {
      const timerData = JSON.parse(data)
      // Only restore if data is less than 1 hour old
      const ageMs = Date.now() - timerData.timestamp
      if (ageMs < 3600000) {
        return timerData
      }
    }
  } catch (error) {
    console.warn('Failed to load timer from localStorage:', error)
  }
  return null
}

const clearTimerFromLocalStorage = () => {
  try {
    const key = getLocalStorageKey()
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('Failed to clear timer from localStorage:', error)
  }
}

// Progress persistence functions
const saveProgress = async () => {
  if (!currentAssessment.value?.id) {
    return
  }

  // Always save timer to localStorage as fast backup
  saveTimerToLocalStorage()

  try {
    const progress = {
      current_question_index: currentQuestionIndex.value,
      time_left: timeLeft.value,
      answers: answers.value,
      updated_at: new Date().toISOString(),
    }
    await saveTaskProgress(currentAssessment.value.id, props.task.id, progress)
  } catch (error) {
    console.error('Failed to save task progress to database:', error)
  }
}

// Allow child views to clear the parent's recorded answer for the current question
const clearChildAnswer = async () => {
  try {
    answers.value[currentQuestion.value.id] = ''
    hasAnsweredCurrentQuestion.value = false
    // Persist the cleared state
    await saveProgress()
  } catch (error) {
    console.error('Failed to clear child answer:', error)
  }
}

const loadProgress = async () => {
  if (!currentAssessment.value?.id) {
    return false
  }

  // Try database first
  try {
    const progress = await loadTaskProgress(currentAssessment.value.id, props.task.id)

    if (progress) {
      currentQuestionIndex.value = progress.current_question_index
      timeLeft.value = progress.time_left
      answers.value = progress.answers
      progressRestored.value = true
      clearTimerFromLocalStorage() // Clear local storage on successful DB load

      // Update hasAnsweredCurrentQuestion if current question was already answered
      if (answers.value[currentQuestion.value.id]) {
        hasAnsweredCurrentQuestion.value = true
      }

      console.log(
        `Restored progress for Task ${props.task.id}: Question ${currentQuestionIndex.value + 1}/${props.task.questions.length}, Time: ${formatTime(timeLeft.value)} (from database)`,
      )
      return true
    }
  } catch (error) {
    console.error('Failed to load task progress from database:', error)
  }

  // Fallback to localStorage if database fails
  const localData = loadTimerFromLocalStorage()
  if (localData) {
    currentQuestionIndex.value = localData.currentQuestionIndex
    timeLeft.value = localData.timeLeft
    answers.value = localData.answers
    progressRestored.value = true

    if (answers.value[currentQuestion.value.id]) {
      hasAnsweredCurrentQuestion.value = true
    }

    console.log(
      `Restored progress for Task ${props.task.id}: Question ${currentQuestionIndex.value + 1}/${props.task.questions.length}, Time: ${formatTime(timeLeft.value)} (from localStorage)`,
    )
    return true
  }

  return false
}

const clearProgress = async () => {
  if (!currentAssessment.value?.id) {
    return
  }

  // Clear both database and localStorage
  clearTimerFromLocalStorage()

  try {
    await clearTaskProgress(currentAssessment.value.id, props.task.id)
  } catch (error) {
    console.error('Failed to clear task progress from database:', error)
  }
}

const restartTask = async () => {
  // Clear all progress and reset to initial state
  await clearProgress()
  currentQuestionIndex.value = 0
  timeLeft.value = props.task.time_limit_seconds
  answers.value = {}
  hasAnsweredCurrentQuestion.value = false
  isShowingFeedback.value = false
  feedbackState.value = null
  progressRestored.value = false

  // Stop and restart the timer
  stopTimer()
  startTimer()

  console.log(`Task ${props.task.id} restarted`)
}

// Lifecycle
onMounted(async () => {
  // Attempt to load saved progress once an assessment ID is available.
  if (currentAssessment.value?.id) {
    const progressLoaded = await loadProgress()
    if (progressLoaded) {
      console.log(`Resuming Task ${props.task.id} from saved progress`)
    }
  } else {
    // Wait for the assessment to be set by parent/views, then load progress once.
    const stopWatching = watch(
      () => currentAssessment.value,
      async (val) => {
        if (val?.id) {
          const progressLoaded = await loadProgress()
          if (progressLoaded) {
            console.log(`Resuming Task ${props.task.id} from saved progress`)
          }
          stopWatching()
        }
      },
    )
  }

  startTimer()
  initializeAudio()
})

onUnmounted(() => {
  stopTimer()
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
})
</script>
