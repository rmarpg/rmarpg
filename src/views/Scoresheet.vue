<script setup lang="ts">
import Select from '@/components/ui/select/Select.vue'
import SelectContent from '@/components/ui/select/SelectContent.vue'
import SelectItem from '@/components/ui/select/SelectItem.vue'
import SelectTrigger from '@/components/ui/select/SelectTrigger.vue'
import SelectValue from '@/components/ui/select/SelectValue.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { useAssessment, type Assessment } from '@/composables/useAssessment'
import { useAuth } from '@/composables/useAuth'
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase-client'

const selectedGrade = ref('grade_2')
const { user, loading: authLoading } = useAuth()
const { loading: assessmentLoading } = useAssessment()
const assessments = ref<Assessment[]>([])

// Computed property to get the selected grade number
const selectedGradeNumber = computed(() => {
  return parseInt(selectedGrade.value.replace('grade_', ''))
})

// Fetch all assessments for the selected grade
const fetchAssessments = async () => {
  if (assessmentLoading.value) return

  try {
    // Try to join with profiles table through the shared auth.users.id reference
    const { data, error } = await supabase
      .from('assessments')
      .select(
        `
        *,
        profiles!learner_id (
          first_name,
          last_name
        )
      `,
      )
      .eq('grade_level', selectedGradeNumber.value)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assessments:', error)
      return
    }

    assessments.value = data || []
    console.log('Fetched assessments:', assessments.value)
  } catch (error) {
    console.error('Error fetching assessments:', error)
  }
}

// Format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Get learner name from metadata or email
const getLearnerName = (assessment: Assessment) => {
  const profile = (assessment as any).profiles
  if (!profile) {
    return `User ${assessment.learner_id.slice(0, 8)}...` // Fallback to UUID if no profile
  }

  if (profile.first_name && profile.last_name) {
    return `${profile.first_name} ${profile.last_name}`
  }
  if (profile.first_name) {
    return profile.first_name
  }
  return `User ${assessment.learner_id.slice(0, 8)}...`
}

onMounted(async () => {
  // Always fetch assessments on mount, regardless of auth state
  // The query doesn't require authentication to read assessments
  await fetchAssessments()
})

// Watch for auth loading to complete and refetch if needed
watch(authLoading, async (isLoading) => {
  if (!isLoading) {
    await fetchAssessments()
  }
})

// Watch for grade changes
import { watch } from 'vue'
watch(selectedGrade, async () => {
  await fetchAssessments()
})
</script>

<template>
  <DashboardLayout>
    <header class="flex items-end gap-3">
      <h2 class="text-2xl font-semibold text-neutral-800">Grade {{ selectedGradeNumber }}</h2>
      <Select v-model="selectedGrade">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="grade_1">Grade 1</SelectItem>
          <SelectItem value="grade_2">Grade 2</SelectItem>
          <SelectItem value="grade_3">Grade 3</SelectItem>
          <SelectItem value="grade_4">Grade 4</SelectItem>
          <SelectItem value="grade_5">Grade 5</SelectItem>
          <SelectItem value="grade_6">Grade 6</SelectItem>
        </SelectContent>
      </Select>
    </header>

    <div class="mt-6 overflow-x-auto">
      <div v-if="assessmentLoading" class="py-8 text-center">
        <p class="text-gray-600">Loading assessments...</p>
      </div>

      <div v-else-if="assessments.length === 0" class="py-8 text-center">
        <p class="text-gray-600">No assessments found for Grade {{ selectedGradeNumber }}</p>
      </div>

      <table v-else class="w-full min-w-max border-collapse">
        <thead class="bg-blue-600">
          <tr>
            <th class="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-white">
              S/N
            </th>
            <th class="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-white">
              Learner ID
            </th>
            <th class="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-white">
              Name of Learner
            </th>
            <th class="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-white">
              Grade Level
            </th>
            <th class="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-white">
              Date of Assessment
            </th>
            <th
              class="border border-gray-300 px-2 py-2 text-center text-sm font-semibold text-white"
            >
              Task A
            </th>
            <th
              class="border border-gray-300 px-2 py-2 text-center text-sm font-semibold text-white"
            >
              Task B
            </th>
            <th
              class="border border-gray-300 px-2 py-2 text-center text-sm font-semibold text-white"
            >
              Task C
            </th>
            <th
              class="border border-gray-300 px-2 py-2 text-center text-sm font-semibold text-white"
            >
              Task D
            </th>
            <th
              class="border border-gray-300 px-2 py-2 text-center text-sm font-semibold text-white"
            >
              Task E
            </th>
            <th
              class="border border-gray-300 px-2 py-2 text-center text-sm font-semibold text-white"
            >
              Task F
            </th>
            <th
              class="border border-gray-300 px-2 py-2 text-center text-sm font-semibold text-white"
            >
              Task G
            </th>
            <th
              class="border border-gray-300 px-2 py-2 text-center text-sm font-semibold text-white"
            >
              Task H
            </th>
            <th
              class="border border-gray-300 px-2 py-2 text-center text-sm font-semibold text-white"
            >
              Task I
            </th>
            <th
              class="border border-gray-300 px-2 py-2 text-center text-sm font-semibold text-white"
            >
              Task J
            </th>
            <th
              class="border border-gray-300 px-2 py-2 text-center text-sm font-semibold text-white"
            >
              Task K
            </th>
            <th
              class="border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-white"
            >
              Overall Score
            </th>
            <th
              class="border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-white"
            >
              Total Score
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(assessment, index) in assessments"
            :key="assessment.id"
            class="hover:bg-gray-50"
          >
            <td class="border border-gray-300 px-3 py-3 text-sm">{{ index + 1 }}</td>
            <td class="border border-gray-300 px-3 py-3 font-mono text-xs"></td>
            <td class="border border-gray-300 px-3 py-3 text-sm">
              {{ getLearnerName(assessment) }}
            </td>
            <td class="border border-gray-300 px-3 py-3 text-center text-sm">
              {{ assessment.grade_level }}
            </td>
            <td class="border border-gray-300 px-3 py-3 text-sm">
              {{ formatDate(assessment.assessment_date) }}
            </td>
            <td
              class="border border-gray-300 px-2 py-3 text-center text-sm font-medium"
              :class="{
                'text-green-600': assessment.task_a_score > 0,
                'text-gray-400': assessment.task_a_score === 0,
              }"
            >
              {{ assessment.task_a_score }}
            </td>
            <td
              class="border border-gray-300 px-2 py-3 text-center text-sm font-medium"
              :class="{
                'text-green-600': assessment.task_b_score > 0,
                'text-gray-400': assessment.task_b_score === 0,
              }"
            >
              {{ assessment.task_b_score }}
            </td>
            <td
              class="border border-gray-300 px-2 py-3 text-center text-sm font-medium"
              :class="{
                'text-green-600': assessment.task_c_score > 0,
                'text-gray-400': assessment.task_c_score === 0,
              }"
            >
              {{ assessment.task_c_score }}
            </td>
            <td
              class="border border-gray-300 px-2 py-3 text-center text-sm font-medium"
              :class="{
                'text-green-600': assessment.task_d_score > 0,
                'text-gray-400': assessment.task_d_score === 0,
              }"
            >
              {{ assessment.task_d_score }}
            </td>
            <td
              class="border border-gray-300 px-2 py-3 text-center text-sm font-medium"
              :class="{
                'text-green-600': assessment.task_e_score > 0,
                'text-gray-400': assessment.task_e_score === 0,
              }"
            >
              {{ assessment.task_e_score }}
            </td>
            <td
              class="border border-gray-300 px-2 py-3 text-center text-sm font-medium"
              :class="{
                'text-green-600': assessment.task_f_score > 0,
                'text-gray-400': assessment.task_f_score === 0,
              }"
            >
              {{ assessment.task_f_score }}
            </td>
            <td
              class="border border-gray-300 px-2 py-3 text-center text-sm font-medium"
              :class="{
                'text-green-600': assessment.task_g_score > 0,
                'text-gray-400': assessment.task_g_score === 0,
              }"
            >
              {{ assessment.task_g_score }}
            </td>
            <td
              class="border border-gray-300 px-2 py-3 text-center text-sm font-medium"
              :class="{
                'text-green-600': assessment.task_h_score > 0,
                'text-gray-400': assessment.task_h_score === 0,
              }"
            >
              {{ assessment.task_h_score }}
            </td>
            <td
              class="border border-gray-300 px-2 py-3 text-center text-sm font-medium"
              :class="{
                'text-green-600': assessment.task_i_score > 0,
                'text-gray-400': assessment.task_i_score === 0,
              }"
            >
              {{ assessment.task_i_score }}
            </td>
            <td
              class="border border-gray-300 px-2 py-3 text-center text-sm font-medium"
              :class="{
                'text-green-600': assessment.task_j_score > 0,
                'text-gray-400': assessment.task_j_score === 0,
              }"
            >
              {{ assessment.task_j_score }}
            </td>
            <td
              class="border border-gray-300 px-2 py-3 text-center text-sm font-medium"
              :class="{
                'text-green-600': assessment.task_k_score > 0,
                'text-gray-400': assessment.task_k_score === 0,
              }"
            >
              {{ assessment.task_k_score }}
            </td>
            <td
              class="border border-gray-300 px-3 py-3 text-center text-sm font-bold"
              :class="{
                'text-blue-600': assessment.overall_score >= 75,
                'text-orange-600': assessment.overall_score >= 50 && assessment.overall_score < 75,
                'text-red-600': assessment.overall_score < 50,
              }"
            >
              {{ assessment.overall_score }}%
            </td>
            <td
              class="border border-gray-300 px-3 py-3 text-center text-sm font-bold text-gray-700"
            >
              {{ assessment.total_score }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </DashboardLayout>
</template>
