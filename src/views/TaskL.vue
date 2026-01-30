<template>
  <RMALayout>
    <Task :task="taskData" @taskComplete="onTaskComplete" @timeUp="onTimeUp">
      <template
        #default="{
          question,
          onAnswer,
          hasAnsweredCurrentQuestion,
          clearAnswer,
        }"
      >
        <div class="mb-6 flex justify-center">
          <img src="/task-k.png" alt="Task L Featured Image" class="max-w-lg rounded-lg" />
        </div>

        <!-- L1 - Click and Select 3D Shapes with Flat Surfaces -->
        <div v-if="question.id === 'L1'" class="space-y-6">
          <div class="text-center text-lg font-medium text-gray-700">{{ question.prompt }}</div>

          <div class="flex justify-center">
            <div class="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
              <p class="mb-4 text-center text-sm font-medium text-gray-600">
                Click on the shapes that have flat surfaces
              </p>
              <div class="grid grid-cols-2 gap-6 md:grid-cols-4">
                <div
                  v-for="shape in l1Shapes"
                  :key="shape.name"
                  @click="!hasAnsweredCurrentQuestion && toggleL1Shape(shape, onAnswer)"
                  :class="[
                    hasAnsweredCurrentQuestion
                      ? 'cursor-not-allowed opacity-75'
                      : 'cursor-pointer hover:scale-105',
                    'rounded-lg border-4 bg-white p-4 shadow-sm transition-all',
                    selectedL1Shapes.includes(shape.name)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-blue-400',
                  ]"
                >
                  <div class="flex flex-col items-center space-y-2">
                    <img :src="shape.image" :alt="shape.name" class="h-20 w-20 object-contain" />
                    <p class="text-center text-sm font-medium text-gray-700 capitalize">
                      {{ shape.name }}
                    </p>
                    <div
                      v-if="selectedL1Shapes.includes(shape.name)"
                      class="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white"
                    >
                      ✓
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-center space-x-4">
            <Button
              @click="!hasAnsweredCurrentQuestion && clearL1Selection(clearAnswer)"
              :disabled="hasAnsweredCurrentQuestion"
              variant="outline"
              class="px-6 py-2"
              >Clear Selection</Button
            >
            <Button
              @click="!hasAnsweredCurrentQuestion && submitL1Answer(onAnswer)"
              :disabled="selectedL1Shapes.length === 0 || hasAnsweredCurrentQuestion"
              :class="['px-8 py-3 text-lg', hasAnsweredCurrentQuestion ? 'cursor-not-allowed' : '']"
              >Submit Selection</Button
            >
          </div>
        </div>

        <!-- L2 - Click and Select 3D Shapes with Curved Surfaces -->
        <div v-else-if="question.id === 'L2'" class="space-y-6">
          <div class="text-center text-lg font-medium text-gray-700">{{ question.prompt }}</div>

          <div class="flex justify-center">
            <div class="rounded-lg border-2 border-purple-200 bg-purple-50 p-6">
              <p class="mb-4 text-center text-sm font-medium text-gray-600">
                Click on the shapes that have curved surfaces
              </p>
              <div class="grid grid-cols-2 gap-6 md:grid-cols-4">
                <div
                  v-for="shape in l2Shapes"
                  :key="shape.name"
                  @click="!hasAnsweredCurrentQuestion && toggleL2Shape(shape, onAnswer)"
                  :class="[
                    hasAnsweredCurrentQuestion
                      ? 'cursor-not-allowed opacity-75'
                      : 'cursor-pointer hover:scale-105',
                    'rounded-lg border-4 bg-white p-4 shadow-sm transition-all',
                    selectedL2Shapes.includes(shape.name)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-400',
                  ]"
                >
                  <div class="flex flex-col items-center space-y-2">
                    <img :src="shape.image" :alt="shape.name" class="h-20 w-20 object-contain" />
                    <p class="text-center text-sm font-medium text-gray-700 capitalize">
                      {{ shape.name }}
                    </p>
                    <div
                      v-if="selectedL2Shapes.includes(shape.name)"
                      class="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-white"
                    >
                      ✓
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-center space-x-4">
            <Button
              @click="!hasAnsweredCurrentQuestion && clearL2Selection(clearAnswer)"
              :disabled="hasAnsweredCurrentQuestion"
              variant="outline"
              class="px-6 py-2"
              >Clear Selection</Button
            >
            <Button
              @click="!hasAnsweredCurrentQuestion && submitL2Answer(onAnswer)"
              :disabled="selectedL2Shapes.length === 0 || hasAnsweredCurrentQuestion"
              :class="['px-8 py-3 text-lg', hasAnsweredCurrentQuestion ? 'cursor-not-allowed' : '']"
              >Submit Selection</Button
            >
          </div>
        </div>

        <!-- Fallback UI for other question types (rare for L) -->
        <div v-else class="space-y-6">
          <div class="text-center text-lg font-medium text-gray-700">{{ question.prompt }}</div>
          <div class="flex items-center justify-center space-x-4">
            <input
              v-model="answers[question.id]"
              type="text"
              :class="[
                'h-12 w-64 rounded border-2 border-gray-300 px-4 text-center text-lg focus:border-blue-500 focus:outline-none',
              ]"
              placeholder="Enter your answer"
            />
            <Button @click="onAnswer(answers[question.id])" class="px-6 py-3">Submit</Button>
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
import { supabase } from '@/lib/supabase-client'

const answers = ref<Record<string, string>>({ L1: '', L2: '' })

const l1Shapes = ref([
  { name: 'pyramid', image: '/pyramid.png' },
  { name: 'rectangle', image: '/rectangle.png' },
  { name: 'cone', image: '/cone.png' },
  { name: 'sphere', image: '/sphere.png' },
])
const selectedL1Shapes = ref<string[]>([])
const l2Shapes = ref([
  { name: 'cone', image: '/cone.png' },
  { name: 'sphere', image: '/sphere.png' },
  { name: 'pyramid', image: '/pyramid.png' },
  { name: 'rectangle', image: '/rectangle.png' },
])
const selectedL2Shapes = ref<string[]>([])

const router = useRouter()
const { user, loading: authLoading } = useAuth()
const { getOrCreateAssessment, updateTaskScore, currentAssessment } = useAssessment()

const toggleL1Shape = (shape: any, onAnswer: (answer: string) => void) => {
  const i = selectedL1Shapes.value.indexOf(shape.name)
  if (i > -1) selectedL1Shapes.value.splice(i, 1)
  else selectedL1Shapes.value.push(shape.name)
  answers.value['L1'] = selectedL1Shapes.value.sort().join(',')
}

const clearL1Selection = (clearAnswer?: () => void) => {
  selectedL1Shapes.value = []
  answers.value['L1'] = ''
  if (clearAnswer) clearAnswer()
}

const submitL1Answer = (onAnswer: (answer: string) => void) => {
  if (selectedL1Shapes.value.length > 0) onAnswer(answers.value['L1'])
}

const toggleL2Shape = (shape: any, onAnswer: (answer: string) => void) => {
  const i = selectedL2Shapes.value.indexOf(shape.name)
  if (i > -1) selectedL2Shapes.value.splice(i, 1)
  else selectedL2Shapes.value.push(shape.name)
  answers.value['L2'] = selectedL2Shapes.value.sort().join(',')
}

const clearL2Selection = (clearAnswer?: () => void) => {
  selectedL2Shapes.value = []
  answers.value['L2'] = ''
  if (clearAnswer) clearAnswer()
}

const submitL2Answer = (onAnswer: (answer: string) => void) => {
  if (selectedL2Shapes.value.length > 0) onAnswer(answers.value['L2'])
}

const taskData = computed(() => ({
  id: 'L',
  name: '3D Shapes',
  points: 5,
  time_limit_seconds: 90,
  questions: [
    {
      id: 'L1',
      prompt: 'Encircle the figures that have a flat surface.',
      type: 'click_select',
      answer: 'pyramid,rectangle',
    },
    {
      id: 'L2',
      prompt: 'Encircle the figures that have a curved surface.',
      type: 'click_select',
      answer: 'cone,sphere',
    },
  ],
}))

const onTaskComplete = async (taskAnswers: Record<string, string>) => {
  try {
    let assessment = currentAssessment.value
    if (!assessment && user.value) assessment = await getOrCreateAssessment(user.value)

    if (!assessment) {
      console.error('No assessment available')
      router.push('/results')
      return
    }

    // Simple scoring: each question worth half the points
    const questions = taskData.value.questions
    const base = Math.floor(taskData.value.points / questions.length)
    const remainder = taskData.value.points % questions.length
    let totalScore = 0

    questions.forEach((q, idx) => {
      const userAns = (taskAnswers[q.id] || '')
        .toString()
        .toLowerCase()
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const expected = (q.answer || '')
        .toString()
        .toLowerCase()
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const pointsFor = idx === questions.length - 1 ? base + remainder : base
      const uniq = [...new Set(userAns)]
      const correct = uniq.length === expected.length && uniq.every((v) => expected.includes(v))
      if (correct) totalScore += pointsFor
    })

    const success = await updateTaskScore('L', totalScore)
    if (!success) console.error('Failed to save Task L score')

    // Mark assessment completed
    const { error } = await supabase
      .from('assessments')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', assessment.id)
    if (error) console.error('Failed to mark assessment complete:', error)
  } catch (err) {
    console.error('Error completing Task L:', err)
  } finally {
    router.push('/results')
  }
}

const onTimeUp = async () => {
  try {
    let assessment = currentAssessment.value
    if (!assessment && user.value) assessment = await getOrCreateAssessment(user.value)

    if (assessment) {
      const { error } = await supabase
        .from('assessments')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', assessment.id)

      if (error) console.error('Failed to mark assessment complete on time up:', error)
    }
  } catch (err) {
    console.error('Error marking assessment complete on time up:', err)
  } finally {
    router.push('/results')
  }
}

if (!authLoading.value) {
  if (user.value) getOrCreateAssessment(user.value).catch(console.error)
}
</script>

<style scoped>
/* reuse styles from TaskK for selection visuals */
.pattern-slot {
  transition: all 0.3s ease-in-out;
}
</style>
