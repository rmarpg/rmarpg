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
        <!-- Featured image displayed for all subtasks -->
        <div class="mb-6 flex justify-center">
          <img src="/task-k.png" alt="Task K Featured Image" class="max-w-lg rounded-lg" />
        </div>

        <!-- K1 - Name shapes in the pattern (any combination allowed) -->
        <div v-if="question.id === 'K1'" class="space-y-6">
          <div class="text-center text-lg font-medium text-gray-700">
            {{ question.prompt }}
          </div>
          <div class="text-center text-sm text-gray-500">Enter any shapes you see.</div>

          <div class="space-y-4">
            <div class="flex flex-col items-center space-y-3">
              <!-- Fixed 4 input fields for shape names -->
              <div
                v-for="(input, index) in k1Inputs"
                :key="index"
                class="flex items-center space-x-2"
              >
                <label class="w-16 text-sm font-medium text-gray-600">Shape {{ index + 1 }}:</label>
                <input
                  v-model="input.value"
                  @input="updateK1Answer"
                  type="text"
                  :disabled="hasAnsweredCurrentQuestion"
                  :placeholder="`Enter shape name`"
                  :class="[
                    'h-10 w-48 rounded border-2 border-gray-300 px-3 text-center focus:border-blue-500 focus:outline-none',
                    hasAnsweredCurrentQuestion ? 'cursor-not-allowed opacity-75' : '',
                  ]"
                />
              </div>
            </div>

            <div class="flex justify-center">
              <Button
                @click="!hasAnsweredCurrentQuestion && submitK1Answer(onAnswer)"
                :disabled="!hasValidK1Answer || hasAnsweredCurrentQuestion"
                :class="[
                  'px-8 py-3 text-lg',
                  !hasValidK1Answer ? 'cursor-not-allowed opacity-50' : '',
                  hasAnsweredCurrentQuestion ? 'cursor-not-allowed' : '',
                ]"
              >
                Submit Answer
              </Button>
            </div>
          </div>
        </div>

        <!-- K2 - Drag and Drop System -->
        <div v-else-if="question.id === 'K2'" class="space-y-6">
          <div class="text-center text-lg font-medium text-gray-700">
            {{ question.prompt }}
          </div>

          <!-- Shape Selection Area -->
          <div class="flex justify-center">
            <div class="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
              <p class="mb-3 text-center text-sm font-medium text-gray-600">
                {{
                  isMobile
                    ? 'Available Shapes (Tap to Select)'
                    : 'Available Shapes (Drag to Pattern)'
                }}
              </p>
              <div class="flex justify-center space-x-4">
                <div
                  v-for="shape in availableShapes"
                  :key="shape.name"
                  :draggable="!isMobile && !hasAnsweredCurrentQuestion"
                  @dragstart="!hasAnsweredCurrentQuestion && onDragStart($event, shape)"
                  @click="!hasAnsweredCurrentQuestion && onShapeClick(shape)"
                  :class="[
                    hasAnsweredCurrentQuestion
                      ? 'cursor-not-allowed opacity-75'
                      : 'cursor-pointer hover:scale-105',
                    'rounded-lg border-2 bg-white p-2 shadow-sm transition-all select-none',
                    selectedShape?.name === shape.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400',
                  ]"
                >
                  <img
                    :src="shape.image"
                    :alt="shape.name"
                    class="pointer-events-none h-12 w-12 object-contain"
                  />
                  <p class="mt-1 text-center text-xs text-gray-600">{{ shape.name }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Pattern Area with Drop Zones -->
          <div class="flex justify-center">
            <div class="rounded-lg border-2 border-gray-300 bg-white p-6 shadow-sm">
              <p class="mb-4 text-center text-sm font-medium text-gray-600">
                {{
                  isMobile
                    ? 'Complete the Pattern (Tap slots after selecting shape)'
                    : 'Complete the Pattern'
                }}
              </p>
              <div class="flex items-center justify-center space-x-2 md:space-x-3">
                <!-- Pattern slots -->
                <div
                  v-for="(slot, index) in patternSlots"
                  :key="index"
                  :class="[
                    'pattern-slot flex h-16 w-16 items-center justify-center rounded-lg border-2 transition-all md:h-20 md:w-20',
                    hasAnsweredCurrentQuestion ? 'cursor-not-allowed opacity-75' : 'cursor-pointer',
                    slot.filled
                      ? 'border-green-400 bg-green-50'
                      : selectedShape && !isMobile && !hasAnsweredCurrentQuestion
                        ? 'border-dashed border-blue-400 bg-blue-50'
                        : 'border-dashed border-gray-400 bg-gray-50',
                  ]"
                  @dragover.prevent
                  @drop="!hasAnsweredCurrentQuestion && onDrop($event, index)"
                  @dragenter.prevent="!hasAnsweredCurrentQuestion && onDragEnter($event, index)"
                  @dragleave="!hasAnsweredCurrentQuestion && onDragLeave($event, index)"
                  @click="!hasAnsweredCurrentQuestion && onSlotClick(index)"
                >
                  <img
                    v-if="slot.shape"
                    :src="slot.shape.image"
                    :alt="slot.shape.name"
                    class="h-10 w-10 object-contain"
                  />
                  <span v-else class="text-2xl text-gray-400">?</span>
                </div>
              </div>
              <div class="mt-2 flex justify-center space-x-1 text-xs text-gray-500">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
              </div>
            </div>
          </div>

          <!-- Reset and Submit buttons -->
          <div class="flex justify-center space-x-4">
            <Button
              @click="!hasAnsweredCurrentQuestion && resetPattern"
              :disabled="hasAnsweredCurrentQuestion"
              variant="outline"
              class="px-6 py-2"
            >
              Reset Pattern
            </Button>
            <Button
              @click="!hasAnsweredCurrentQuestion && submitK2Answer(onAnswer)"
              :disabled="!isPatternComplete || hasAnsweredCurrentQuestion"
              :class="['px-8 py-3 text-lg', hasAnsweredCurrentQuestion ? 'cursor-not-allowed' : '']"
            >
              Complete Pattern
            </Button>
          </div>
        </div>

        <!-- K3 - Click and Select 3D Shapes with Flat Surfaces -->
        <div v-else-if="question.id === 'K3'" class="space-y-6">
          <div class="text-center text-lg font-medium text-gray-700">
            {{ question.prompt }}
          </div>

          <!-- 3D Shapes Selection Area -->
          <div class="flex justify-center">
            <div class="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
              <p class="mb-4 text-center text-sm font-medium text-gray-600">
                Click on the shapes that have flat surfaces
              </p>
              <div class="grid grid-cols-2 gap-6 md:grid-cols-4">
                <div
                  v-for="shape in k3Shapes"
                  :key="shape.name"
                  @click="!hasAnsweredCurrentQuestion && toggleK3Shape(shape, onAnswer)"
                  :class="[
                    hasAnsweredCurrentQuestion
                      ? 'cursor-not-allowed opacity-75'
                      : 'cursor-pointer hover:scale-105',
                    'rounded-lg border-4 bg-white p-4 shadow-sm transition-all',
                    selectedK3Shapes.includes(shape.name)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-blue-400',
                  ]"
                >
                  <div class="flex flex-col items-center space-y-2">
                    <img :src="shape.image" :alt="shape.name" class="h-20 w-20 object-contain" />
                    <p class="text-center text-sm font-medium text-gray-700 capitalize">
                      {{ shape.name }}
                    </p>
                    <!-- Selection indicator -->
                    <div
                      v-if="selectedK3Shapes.includes(shape.name)"
                      class="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white"
                    >
                      ✓
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Submit button -->
          <div class="flex justify-center space-x-4">
            <Button
              @click="!hasAnsweredCurrentQuestion && clearK3Selection"
              :disabled="hasAnsweredCurrentQuestion"
              variant="outline"
              class="px-6 py-2"
            >
              Clear Selection
            </Button>
            <Button
              @click="!hasAnsweredCurrentQuestion && submitK3Answer(onAnswer)"
              :disabled="selectedK3Shapes.length === 0 || hasAnsweredCurrentQuestion"
              :class="['px-8 py-3 text-lg', hasAnsweredCurrentQuestion ? 'cursor-not-allowed' : '']"
            >
              Submit Selection
            </Button>
          </div>
        </div>
        <!-- K4 - Click and Select 3D Shapes with Curved Surfaces -->
        <div v-else-if="question.id === 'K4'" class="space-y-6">
          <div class="text-center text-lg font-medium text-gray-700">
            {{ question.prompt }}
          </div>

          <!-- 3D Shapes Selection Area -->
          <div class="flex justify-center">
            <div class="rounded-lg border-2 border-purple-200 bg-purple-50 p-6">
              <p class="mb-4 text-center text-sm font-medium text-gray-600">
                Click on the shapes that have curved surfaces
              </p>
              <div class="grid grid-cols-2 gap-6 md:grid-cols-4">
                <div
                  v-for="shape in k4Shapes"
                  :key="shape.name"
                  @click="!hasAnsweredCurrentQuestion && toggleK4Shape(shape, onAnswer)"
                  :class="[
                    hasAnsweredCurrentQuestion
                      ? 'cursor-not-allowed opacity-75'
                      : 'cursor-pointer hover:scale-105',
                    'rounded-lg border-4 bg-white p-4 shadow-sm transition-all',
                    selectedK4Shapes.includes(shape.name)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-400',
                  ]"
                >
                  <div class="flex flex-col items-center space-y-2">
                    <img :src="shape.image" :alt="shape.name" class="h-20 w-20 object-contain" />
                    <p class="text-center text-sm font-medium text-gray-700 capitalize">
                      {{ shape.name }}
                    </p>
                    <!-- Selection indicator -->
                    <div
                      v-if="selectedK4Shapes.includes(shape.name)"
                      class="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-white"
                    >
                      ✓
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Submit button -->
          <div class="flex justify-center space-x-4">
            <Button
              @click="!hasAnsweredCurrentQuestion && clearK4Selection"
              :disabled="hasAnsweredCurrentQuestion"
              variant="outline"
              class="px-6 py-2"
            >
              Clear Selection
            </Button>
            <Button
              @click="!hasAnsweredCurrentQuestion && submitK4Answer(onAnswer)"
              :disabled="selectedK4Shapes.length === 0 || hasAnsweredCurrentQuestion"
              :class="['px-8 py-3 text-lg', hasAnsweredCurrentQuestion ? 'cursor-not-allowed' : '']"
            >
              Submit Selection
            </Button>
          </div>
        </div>

        <!-- Standard handling for any other questions -->
        <div v-else class="space-y-6">
          <div class="text-center text-lg font-medium text-gray-700">
            {{ question.prompt }}
          </div>

          <div v-if="question.type === 'multiple_choice'" class="grid gap-3">
            <Button
              v-for="(option, index) in question.options"
              :key="index"
              @click="!hasAnsweredCurrentQuestion && selectAnswer(option, onAnswer, question.id)"
              :variant="answers[question.id] === option ? 'default' : 'outline'"
              :disabled="hasAnsweredCurrentQuestion"
              :class="[
                'h-auto justify-start p-4 text-left',
                hasAnsweredCurrentQuestion ? 'cursor-not-allowed' : 'cursor-pointer',
              ]"
            >
              {{ option }}
            </Button>
          </div>

          <div v-else class="flex items-center justify-center space-x-4">
            <input
              v-model="answers[question.id]"
              type="text"
              :disabled="hasAnsweredCurrentQuestion"
              :class="[
                'h-12 w-64 rounded border-2 border-gray-300 px-4 text-center text-lg focus:border-blue-500 focus:outline-none',
                hasAnsweredCurrentQuestion ? 'cursor-not-allowed opacity-75' : '',
              ]"
              placeholder="Enter your answer"
            />
            <Button
              @click="!hasAnsweredCurrentQuestion && onAnswer(answers[question.id])"
              :disabled="!answers[question.id] || hasAnsweredCurrentQuestion"
              :class="['px-6 py-3 text-lg', hasAnsweredCurrentQuestion ? 'cursor-not-allowed' : '']"
            >
              Submit
            </Button>
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
  K1: '',
  K2: '',
  K3: '',
  K4: '',
})

// Special K1 input management (4 fixed inputs for shape names - any combination allowed)
const k1Inputs = ref([{ value: '' }, { value: '' }, { value: '' }])

const router = useRouter()
const { user, loading: authLoading } = useAuth()
const { getOrCreateAssessment, updateTaskScore, calculateTaskScore, currentAssessment } =
  useAssessment()

// K2 Drag and Drop System
interface Shape {
  name: string
  image: string
}

interface PatternSlot {
  shape: Shape | null
  filled: boolean
}

// Mobile detection and selection
const isMobile = ref(
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768,
)
const selectedShape = ref<Shape | null>(null)

// Available shapes for dragging
const availableShapes = ref<Shape[]>([
  { name: 'circle', image: '/circle.png' },
  { name: 'semi-circle', image: '/semi-circle.png' },
  { name: 'square', image: '/square.png' },
])

// Pattern slots (4 positions)
const patternSlots = ref<PatternSlot[]>([
  { shape: null, filled: false },
  { shape: null, filled: false },
  { shape: null, filled: false },
  { shape: null, filled: false },
])

// Drag and drop functionality
let draggedShape: Shape | null = null

const onDragStart = (event: DragEvent, shape: Shape) => {
  draggedShape = shape
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
  }
}

const onDragEnter = (event: DragEvent, index: number) => {
  event.preventDefault()
  const target = event.currentTarget as HTMLElement
  target.classList.add('border-blue-500', 'bg-blue-100')
}

const onDragLeave = (event: DragEvent, index: number) => {
  const target = event.currentTarget as HTMLElement
  target.classList.remove('border-blue-500', 'bg-blue-100')
}

const onDrop = (event: DragEvent, index: number) => {
  event.preventDefault()
  const target = event.currentTarget as HTMLElement
  target.classList.remove('border-blue-500', 'bg-blue-100')

  if (draggedShape) {
    patternSlots.value[index] = {
      shape: draggedShape,
      filled: true,
    }
    updateK2Answer()
  }
}

// Simple click handlers for mobile
const onShapeClick = (shape: Shape) => {
  selectedShape.value = shape
}

const onSlotClick = (index: number) => {
  if (selectedShape.value) {
    patternSlots.value[index] = {
      shape: selectedShape.value,
      filled: true,
    }
    updateK2Answer()
    selectedShape.value = null // Clear selection after placing
  }
}

const resetPattern = () => {
  patternSlots.value = [
    { shape: null, filled: false },
    { shape: null, filled: false },
    { shape: null, filled: false },
    { shape: null, filled: false },
  ]
  answers.value['K2'] = ''
}

const updateK2Answer = () => {
  const pattern = patternSlots.value.map((slot) => slot.shape?.name || '').join(', ')
  answers.value['K2'] = pattern
}

const isPatternComplete = computed(() => {
  return patternSlots.value.every((slot) => slot.filled)
})

const submitK2Answer = (onAnswer: (answer: string) => void) => {
  updateK2Answer()
  if (isPatternComplete.value) {
    onAnswer(answers.value['K2'])
  }
}

// K3 Click and Select System for 3D Shapes
interface K3Shape {
  name: string
  image: string
}

const k3Shapes = ref<K3Shape[]>([
  { name: 'pyramid', image: '/pyramid.png' },
  { name: 'cone', image: '/cone.png' },
  { name: 'rectangle', image: '/rectangle.png' },
  { name: 'sphere', image: '/sphere.png' },
])

const selectedK3Shapes = ref<string[]>([])

const toggleK3Shape = (shape: K3Shape, onAnswer: (answer: string) => void) => {
  const index = selectedK3Shapes.value.indexOf(shape.name)
  if (index > -1) {
    // Remove if already selected
    selectedK3Shapes.value.splice(index, 1)
  } else {
    // Add if not selected
    selectedK3Shapes.value.push(shape.name)
  }
  updateK3Answer()
}

const clearK3Selection = () => {
  selectedK3Shapes.value = []
  answers.value['K3'] = ''
}

const updateK3Answer = () => {
  answers.value['K3'] = selectedK3Shapes.value.sort().join(',')
}

const submitK3Answer = (onAnswer: (answer: string) => void) => {
  updateK3Answer()
  if (selectedK3Shapes.value.length > 0) {
    onAnswer(answers.value['K3'])
  }
}

// K4 Click and Select System for 3D Shapes with Curved Surfaces
const k4Shapes = ref<K3Shape[]>([
  { name: 'pyramid', image: '/pyramid.png' },
  { name: 'cone', image: '/cone.png' },
  { name: 'rectangle', image: '/rectangle.png' },
  { name: 'sphere', image: '/sphere.png' },
])

const selectedK4Shapes = ref<string[]>([])

const toggleK4Shape = (shape: K3Shape, onAnswer: (answer: string) => void) => {
  const index = selectedK4Shapes.value.indexOf(shape.name)
  if (index > -1) {
    // Remove if already selected
    selectedK4Shapes.value.splice(index, 1)
  } else {
    // Add if not selected
    selectedK4Shapes.value.push(shape.name)
  }
  updateK4Answer()
}

const clearK4Selection = () => {
  selectedK4Shapes.value = []
  answers.value['K4'] = ''
}

const updateK4Answer = () => {
  answers.value['K4'] = selectedK4Shapes.value.sort().join(',')
}

const submitK4Answer = (onAnswer: (answer: string) => void) => {
  updateK4Answer()
  if (selectedK4Shapes.value.length > 0) {
    onAnswer(answers.value['K4'])
  }
}

const updateK1Answer = () => {
  const values = k1Inputs.value.map((input) => input.value.trim()).filter((v) => v !== '')
  answers.value['K1'] = values.join(', ')
}

const hasValidK1Answer = computed(() => {
  return k1Inputs.value.some((input) => input.value.trim() !== '')
})

const submitK1Answer = (onAnswer: (answer: string) => void) => {
  updateK1Answer()
  if (hasValidK1Answer.value) {
    onAnswer(answers.value['K1'])
  }
}

// Standard answer selection
const selectAnswer = (option: string, onAnswer: (answer: string) => void, questionId?: string) => {
  if (questionId) {
    answers.value[questionId] = option
  }
  onAnswer(option)
}

// Visual feedback for TaskK (simplified for complex interactions)
const getFeedbackClass = (questionId: string, feedbackState: any) => {
  if (!feedbackState || feedbackState.questionId !== questionId) {
    return ''
  }

  return feedbackState.isCorrect
    ? 'ring-4 ring-green-300 ring-opacity-50'
    : 'ring-4 ring-red-300 ring-opacity-50'
}

// Get Task K data with proper TypeScript types
const taskData = computed(() => {
  return {
    id: 'K',
    name: 'Geometric Pattern',
    points: 8,
    time_limit_seconds: 90,
    questions: [
      {
        id: 'K1',
        prompt: 'Name the shapes in the pattern.',
        type: 'short_answer',
        answer: 'circle, half-circle, square', // Normalized answer (half-circle and semi-circle treated as same)
      },
      {
        id: 'K2',
        prompt: 'Draw the missing shapes in the pattern (circle, half-circle, square, circle).',
        type: 'drawing',
        answer: 'circle, half-circle, square, circle',
      },
      {
        id: 'K3',
        prompt: 'Encircle the figure that have a flat surface.',
        type: 'click_select',
        answer: 'pyramid,rectangle',
      },
      {
        id: 'K4',
        prompt: 'Encircle the figures that have a curved surface.',
        type: 'click_select',
        answer: 'cone,sphere',
      },
    ],
  }
})

const onTaskComplete = async (taskAnswers: Record<string, string>) => {
  console.log('Task K completed with answers:', taskAnswers)
  console.log('currentAssessment.value at completion:', currentAssessment.value)

  // Use custom scoring for Task K since it has special validation logic
  let totalScore = 0
  const questions = taskData.value.questions
  const basePointsPerQuestion = Math.floor(taskData.value.points / questions.length)
  const remainder = taskData.value.points % questions.length

  // Calculate score using the same strategy pattern logic
  questions.forEach((question, questionIndex) => {
    const userAnswer = taskAnswers[question.id] || ''
    // Last question gets the remainder points
    const pointsForThisQuestion = questionIndex === questions.length - 1
      ? basePointsPerQuestion + remainder
      : basePointsPerQuestion

    if (
      question.id === 'K1' ||
      question.id === 'K2' ||
      question.id === 'K3' ||
      question.id === 'K4'
    ) {
      // Use the strategy pattern validation from Task component
      const taskKStrategies = {
        K1: {
          expectedShapes: ['circle', 'half-circle', 'square'],
          validate: (answer: string) => {
            const normalizeShape = (shape: string) =>
              shape === 'semi-circle' ? 'half-circle' : shape
            const userShapes = answer
              .toLowerCase()
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s !== '')
            const uniqueUserShapes = [...new Set(userShapes)].map(normalizeShape)
            const normalizedUniqueShapes = [...new Set(uniqueUserShapes)]
            const correctShapes = normalizedUniqueShapes.filter((shape) =>
              taskKStrategies.K1.expectedShapes.includes(shape),
            )
            return (
              normalizedUniqueShapes.length > 0 &&
              normalizedUniqueShapes.every((shape) =>
                taskKStrategies.K1.expectedShapes.includes(shape),
              ) &&
              correctShapes.length > 0
            )
          },
        },
        K2: {
          expectedPattern: ['circle', 'half-circle', 'square', 'circle'],
          validate: (answer: string) => {
            const normalizeShape = (shape: string) =>
              shape === 'semi-circle' ? 'half-circle' : shape
            const userPattern = answer
              .toLowerCase()
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s !== '')
              .map(normalizeShape)
            const correctPositions = userPattern.filter(
              (shape, index) =>
                index < taskKStrategies.K2.expectedPattern.length &&
                shape === taskKStrategies.K2.expectedPattern[index],
            )
            return (
              userPattern.length === taskKStrategies.K2.expectedPattern.length &&
              correctPositions.length === taskKStrategies.K2.expectedPattern.length
            )
          },
        },
        K3: {
          expectedShapes: ['pyramid', 'rectangle'],
          validate: (answer: string) => {
            const userShapes = answer
              .toLowerCase()
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s !== '')
            const uniqueUserShapes = [...new Set(userShapes)]
            const correctShapes = uniqueUserShapes.filter((shape) =>
              taskKStrategies.K3.expectedShapes.includes(shape),
            )
            return (
              uniqueUserShapes.length === taskKStrategies.K3.expectedShapes.length &&
              correctShapes.length === taskKStrategies.K3.expectedShapes.length
            )
          },
        },
        K4: {
          expectedShapes: ['cone', 'sphere'],
          validate: (answer: string) => {
            const userShapes = answer
              .toLowerCase()
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s !== '')
            const uniqueUserShapes = [...new Set(userShapes)]
            const correctShapes = uniqueUserShapes.filter((shape) =>
              taskKStrategies.K4.expectedShapes.includes(shape),
            )
            return (
              uniqueUserShapes.length === taskKStrategies.K4.expectedShapes.length &&
              correctShapes.length === taskKStrategies.K4.expectedShapes.length
            )
          },
        },
      }

      const strategy = taskKStrategies[question.id as keyof typeof taskKStrategies]
      if (strategy && strategy.validate(userAnswer)) {
        totalScore += pointsForThisQuestion
      }
    } else {
      // Standard validation for other question types
      if (userAnswer === question.answer) {
        totalScore += pointsForThisQuestion
      }
    }
  })

  console.log(`Task K score: ${totalScore}/${taskData.value.points}`)

  try {
    // Ensure we have an assessment
    let assessment = currentAssessment.value
    if (!assessment && user.value) {
      console.log('No current assessment, attempting to create one...')
      assessment = await getOrCreateAssessment(user.value)
    }

    // Update assessment with Task K score
    if (assessment) {
      console.log('Updating score for assessment:', assessment.id)
      const success = await updateTaskScore('K', totalScore)
      if (success) {
        console.log('Task K score saved successfully')
      } else {
        console.error('Failed to save Task K score')
      }
    } else {
      console.error('No current assessment found and unable to create one')
    }

    // Navigate to results page after save attempt
    router.push('/results')
  } catch (e) {
    console.error('Error in task completion:', e)
    // Still navigate even on error
    router.push('/results')
  }
}

const onTimeUp = () => {
  console.log('Time up for Task K')
  router.push('/results')
}

// Initialize assessment when component mounts
const initializeAssessment = async () => {
  if (user.value) {
    console.log('Initializing assessment for user:', user.value.email)
    const assessment = await getOrCreateAssessment(user.value)
    if (assessment) {
      console.log('Assessment initialized, id:', assessment.id)
    } else {
      console.warn('Failed to initialize assessment during mount')
    }
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
/* Additional styling for input management */
.task-k-input {
  transition: all 0.2s ease-in-out;
}

.task-k-input:focus {
  transform: scale(1.02);
}

/* Shape selection styling */
.shape-item {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  transition: all 0.2s ease-in-out;
}

.drop-zone {
  transition: all 0.2s ease-in-out;
}

.drop-zone.drag-over {
  border-color: #3b82f6;
  background-color: #dbeafe;
  transform: scale(1.02);
}

/* Mobile-specific improvements */
@media (max-width: 768px) {
  .available-shapes div {
    padding: 0.75rem;
  }

  .available-shapes img {
    height: 3rem;
    width: 3rem;
  }

  .pattern-slot {
    height: 4rem;
    width: 4rem;
  }

  .pattern-slot img {
    height: 2.5rem;
    width: 2.5rem;
  }
} /* Pattern slot animations */
.pattern-slot {
  transition: all 0.3s ease-in-out;
}

.pattern-slot.filled {
  animation: fillSlot 0.3s ease-out;
}

@keyframes fillSlot {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
