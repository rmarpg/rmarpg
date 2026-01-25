<script setup lang="ts">
import Select from '@/components/ui/select/Select.vue'
import SelectContent from '@/components/ui/select/SelectContent.vue'
import SelectItem from '@/components/ui/select/SelectItem.vue'
import SelectTrigger from '@/components/ui/select/SelectTrigger.vue'
import SelectValue from '@/components/ui/select/SelectValue.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { useAssessment, type Assessment } from '@/composables/useAssessment'
import { useAuth } from '@/composables/useAuth'
import { ref, onMounted, watch } from 'vue'
import { supabase } from '@/lib/supabase-client'

const selectedSection = ref('Rose')
const GRADE_LEVEL = 2
const { user, loading: authLoading } = useAuth()
const { loading: assessmentLoading } = useAssessment()
const assessments = ref<Assessment[]>([])

// Fetch all assessments for grade level 2
const fetchAssessments = async () => {
  if (assessmentLoading.value) return

  try {
    const { data, error } = await supabase
      .from('assessments')
      .select(
        `
        *,
        profiles!learner_id (
          first_name,
          last_name,
          section
        )
      `,
      )
      .eq('grade_level', GRADE_LEVEL)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assessments:', error)
      return
    }

    // Group by learner_id and keep the highest total_score per user,
    // then apply section filter.
    const byUser: Record<string, any> = {}
    for (const a of (data || [])) {
      const key = a.learner_id
      if (!key) continue
      const existing = byUser[key]
      if (!existing || (a.total_score ?? 0) > (existing.total_score ?? 0)) {
        byUser[key] = a
      }
    }

    const grouped = Object.values(byUser).sort((a: any, b: any) => (b.total_score ?? 0) - (a.total_score ?? 0))

    // If a section is selected, filter using the joined profile.section
    const items = grouped.filter((a: any) => {
      if (!selectedSection.value) return true
      const profileSection = (a as any)?.profiles?.section
      if (!profileSection) return false
      return profileSection.toString().toLowerCase() === selectedSection.value.toLowerCase()
    })

    assessments.value = items
    console.log('Fetched assessments (grouped by learner, filtered):', assessments.value)
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

// Get section from joined profile or fallback
const getSection = (assessment: Assessment) => {
  const profile = (assessment as any).profiles
  if (!profile) return '—'
  return profile.section || '—'
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

// Watch for section changes (no grade change; still fetch same grade)
watch(selectedSection, async () => {
  await fetchAssessments()
})
</script>

<template>
  <DashboardLayout>
    <div class="space-y-4 sm:space-y-6">
      <!-- Header Section -->
      <header class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
        <h2 class="text-xl font-semibold text-neutral-800 sm:text-2xl">
          Grade 2
        </h2>
        <Select v-model="selectedSection" class="w-full sm:w-auto">
          <SelectTrigger class="min-w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Rose">Rose</SelectItem>
            <SelectItem value="Sampaguita">Sampaguita</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <!-- Table Section -->
      <div class="rounded-lg border bg-white shadow-sm">
        <div v-if="assessmentLoading" class="py-12 text-center">
          <p class="text-gray-600">Loading assessments...</p>
        </div>

        <div v-else-if="assessments.length === 0" class="py-12 text-center">
          <p class="text-gray-600">No assessments found for Grade 2</p>
        </div>

        <div v-else class="overflow-x-auto">
          <!-- Mobile Card View (hidden on md and up) -->
          <div class="block space-y-4 p-4 md:hidden">
            <div
              v-for="(assessment, index) in assessments"
              :key="assessment.id"
              class="space-y-3 rounded-lg bg-gray-50 p-4"
            >
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-semibold text-gray-900">{{ getLearnerName(assessment) }}</h3>
                  <p class="text-sm text-gray-600">S/N: {{ index + 1 }}</p>
                  <p class="text-sm text-gray-600">Grade {{ assessment.grade_level }}</p>
                  <p class="text-sm text-gray-600">Section: {{ getSection(assessment) }}</p>
                  <p class="text-sm text-gray-600">{{ formatDate(assessment.assessment_date) }}</p>
                </div>
                <div class="text-right">
                  <div
                    class="text-lg font-bold"
                    :class="{
                      'text-blue-600': assessment.overall_score >= 75,
                      'text-orange-600':
                        assessment.overall_score >= 50 && assessment.overall_score < 75,
                      'text-red-600': assessment.overall_score < 50,
                    }"
                  >
                    {{ assessment.overall_score }}%
                  </div>
                  <div class="text-sm text-gray-600">Total: {{ assessment.total_score }}</div>
                </div>
              </div>

              <!-- Task Scores Grid -->
              <div class="grid grid-cols-3 gap-2 border-t pt-2 sm:grid-cols-4">
                <div class="text-center">
                  <div class="mb-1 text-xs text-gray-500">A</div>
                  <div
                    class="text-sm font-medium"
                    :class="{
                      'text-green-600': assessment.task_a_score > 0,
                      'text-gray-400': assessment.task_a_score === 0,
                    }"
                  >
                    {{ assessment.task_a_score }}
                  </div>
                </div>
                <div class="text-center">
                  <div class="mb-1 text-xs text-gray-500">B</div>
                  <div
                    class="text-sm font-medium"
                    :class="{
                      'text-green-600': assessment.task_b_score > 0,
                      'text-gray-400': assessment.task_b_score === 0,
                    }"
                  >
                    {{ assessment.task_b_score }}
                  </div>
                </div>
                <div class="text-center">
                  <div class="mb-1 text-xs text-gray-500">C</div>
                  <div
                    class="text-sm font-medium"
                    :class="{
                      'text-green-600': assessment.task_c_score > 0,
                      'text-gray-400': assessment.task_c_score === 0,
                    }"
                  >
                    {{ assessment.task_c_score }}
                  </div>
                </div>
                <div class="text-center">
                  <div class="mb-1 text-xs text-gray-500">D</div>
                  <div
                    class="text-sm font-medium"
                    :class="{
                      'text-green-600': assessment.task_d_score > 0,
                      'text-gray-400': assessment.task_d_score === 0,
                    }"
                  >
                    {{ assessment.task_d_score }}
                  </div>
                </div>
                <div class="text-center">
                  <div class="mb-1 text-xs text-gray-500">E</div>
                  <div
                    class="text-sm font-medium"
                    :class="{
                      'text-green-600': assessment.task_e_score > 0,
                      'text-gray-400': assessment.task_e_score === 0,
                    }"
                  >
                    {{ assessment.task_e_score }}
                  </div>
                </div>
                <div class="text-center">
                  <div class="mb-1 text-xs text-gray-500">F</div>
                  <div
                    class="text-sm font-medium"
                    :class="{
                      'text-green-600': assessment.task_f_score > 0,
                      'text-gray-400': assessment.task_f_score === 0,
                    }"
                  >
                    {{ assessment.task_f_score }}
                  </div>
                </div>
                <div class="text-center">
                  <div class="mb-1 text-xs text-gray-500">G</div>
                  <div
                    class="text-sm font-medium"
                    :class="{
                      'text-green-600': assessment.task_g_score > 0,
                      'text-gray-400': assessment.task_g_score === 0,
                    }"
                  >
                    {{ assessment.task_g_score }}
                  </div>
                </div>
                <div class="text-center">
                  <div class="mb-1 text-xs text-gray-500">H</div>
                  <div
                    class="text-sm font-medium"
                    :class="{
                      'text-green-600': assessment.task_h_score > 0,
                      'text-gray-400': assessment.task_h_score === 0,
                    }"
                  >
                    {{ assessment.task_h_score }}
                  </div>
                </div>
                <div class="text-center">
                  <div class="mb-1 text-xs text-gray-500">I</div>
                  <div
                    class="text-sm font-medium"
                    :class="{
                      'text-green-600': assessment.task_i_score > 0,
                      'text-gray-400': assessment.task_i_score === 0,
                    }"
                  >
                    {{ assessment.task_i_score }}
                  </div>
                </div>
                <div class="text-center">
                  <div class="mb-1 text-xs text-gray-500">J</div>
                  <div
                    class="text-sm font-medium"
                    :class="{
                      'text-green-600': assessment.task_j_score > 0,
                      'text-gray-400': assessment.task_j_score === 0,
                    }"
                  >
                    {{ assessment.task_j_score }}
                  </div>
                </div>
                <div class="text-center">
                  <div class="mb-1 text-xs text-gray-500">K</div>
                  <div
                    class="text-sm font-medium"
                    :class="{
                      'text-green-600': assessment.task_k_score > 0,
                      'text-gray-400': assessment.task_k_score === 0,
                    }"
                  >
                    {{ assessment.task_k_score }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Desktop Table View (hidden below md) -->
          <table class="hidden w-full min-w-full border-collapse md:table">
            <thead class="bg-blue-600">
              <tr>
                <th
                  class="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-white lg:px-3 lg:text-sm"
                >
                  S/N
                </th>
                <th
                  class="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-white lg:px-3 lg:text-sm"
                >
                  Learner ID
                </th>
                <th
                  class="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-white lg:px-3 lg:text-sm"
                >
                  Name of Learner
                </th>
                <th
                  class="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-white lg:px-3 lg:text-sm"
                >
                  Grade Level
                </th>
                <th
                  class="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-white lg:px-3 lg:text-sm"
                >
                  Section
                </th>
                <th
                  class="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-white lg:px-3 lg:text-sm"
                >
                  Date of Assessment
                </th>
                <th
                  class="border border-gray-300 px-1 py-2 text-center text-xs font-semibold text-white lg:px-2 lg:text-sm"
                >
                  Task A
                </th>
                <th
                  class="border border-gray-300 px-1 py-2 text-center text-xs font-semibold text-white lg:px-2 lg:text-sm"
                >
                  Task B
                </th>
                <th
                  class="border border-gray-300 px-1 py-2 text-center text-xs font-semibold text-white lg:px-2 lg:text-sm"
                >
                  Task C
                </th>
                <th
                  class="border border-gray-300 px-1 py-2 text-center text-xs font-semibold text-white lg:px-2 lg:text-sm"
                >
                  Task D
                </th>
                <th
                  class="border border-gray-300 px-1 py-2 text-center text-xs font-semibold text-white lg:px-2 lg:text-sm"
                >
                  Task E
                </th>
                <th
                  class="border border-gray-300 px-1 py-2 text-center text-xs font-semibold text-white lg:px-2 lg:text-sm"
                >
                  Task F
                </th>
                <th
                  class="border border-gray-300 px-1 py-2 text-center text-xs font-semibold text-white lg:px-2 lg:text-sm"
                >
                  Task G
                </th>
                <th
                  class="border border-gray-300 px-1 py-2 text-center text-xs font-semibold text-white lg:px-2 lg:text-sm"
                >
                  Task H
                </th>
                <th
                  class="border border-gray-300 px-1 py-2 text-center text-xs font-semibold text-white lg:px-2 lg:text-sm"
                >
                  Task I
                </th>
                <th
                  class="border border-gray-300 px-1 py-2 text-center text-xs font-semibold text-white lg:px-2 lg:text-sm"
                >
                  Task J
                </th>
                <th
                  class="border border-gray-300 px-1 py-2 text-center text-xs font-semibold text-white lg:px-2 lg:text-sm"
                >
                  Task K
                </th>
                <th
                  class="border border-gray-300 px-2 py-2 text-center text-xs font-semibold text-white lg:px-3 lg:text-sm"
                >
                  Overall Score
                </th>
                <th
                  class="border border-gray-300 px-2 py-2 text-center text-xs font-semibold text-white lg:px-3 lg:text-sm"
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
                <td class="border border-gray-300 px-2 py-3 text-xs lg:px-3 lg:text-sm">
                  {{ index + 1 }}
                </td>
                <td class="border border-gray-300 px-2 py-3 font-mono text-xs lg:px-3">
                  {{ assessment.learner_id ? assessment.learner_id.slice(0, 8) : '' }}
                </td>
                <td class="border border-gray-300 px-2 py-3 text-xs lg:px-3 lg:text-sm">
                  {{ getLearnerName(assessment) }}
                </td>
                <td class="border border-gray-300 px-2 py-3 text-center text-xs lg:px-3 lg:text-sm">
                  {{ assessment.grade_level }}
                </td>
                <td class="border border-gray-300 px-2 py-3 text-center text-xs lg:px-3 lg:text-sm">
                  {{ getSection(assessment) }}
                </td>
                <td class="border border-gray-300 px-2 py-3 text-xs lg:px-3 lg:text-sm">
                  {{ formatDate(assessment.assessment_date) }}
                </td>
                <td
                  class="border border-gray-300 px-1 py-3 text-center text-xs font-medium lg:px-2 lg:text-sm"
                  :class="{
                    'text-green-600': assessment.task_a_score > 0,
                    'text-gray-400': assessment.task_a_score === 0,
                  }"
                >
                  {{ assessment.task_a_score }}
                </td>
                <td
                  class="border border-gray-300 px-1 py-3 text-center text-xs font-medium lg:px-2 lg:text-sm"
                  :class="{
                    'text-green-600': assessment.task_b_score > 0,
                    'text-gray-400': assessment.task_b_score === 0,
                  }"
                >
                  {{ assessment.task_b_score }}
                </td>
                <td
                  class="border border-gray-300 px-1 py-3 text-center text-xs font-medium lg:px-2 lg:text-sm"
                  :class="{
                    'text-green-600': assessment.task_c_score > 0,
                    'text-gray-400': assessment.task_c_score === 0,
                  }"
                >
                  {{ assessment.task_c_score }}
                </td>
                <td
                  class="border border-gray-300 px-1 py-3 text-center text-xs font-medium lg:px-2 lg:text-sm"
                  :class="{
                    'text-green-600': assessment.task_d_score > 0,
                    'text-gray-400': assessment.task_d_score === 0,
                  }"
                >
                  {{ assessment.task_d_score }}
                </td>
                <td
                  class="border border-gray-300 px-1 py-3 text-center text-xs font-medium lg:px-2 lg:text-sm"
                  :class="{
                    'text-green-600': assessment.task_e_score > 0,
                    'text-gray-400': assessment.task_e_score === 0,
                  }"
                >
                  {{ assessment.task_e_score }}
                </td>
                <td
                  class="border border-gray-300 px-1 py-3 text-center text-xs font-medium lg:px-2 lg:text-sm"
                  :class="{
                    'text-green-600': assessment.task_f_score > 0,
                    'text-gray-400': assessment.task_f_score === 0,
                  }"
                >
                  {{ assessment.task_f_score }}
                </td>
                <td
                  class="border border-gray-300 px-1 py-3 text-center text-xs font-medium lg:px-2 lg:text-sm"
                  :class="{
                    'text-green-600': assessment.task_g_score > 0,
                    'text-gray-400': assessment.task_g_score === 0,
                  }"
                >
                  {{ assessment.task_g_score }}
                </td>
                <td
                  class="border border-gray-300 px-1 py-3 text-center text-xs font-medium lg:px-2 lg:text-sm"
                  :class="{
                    'text-green-600': assessment.task_h_score > 0,
                    'text-gray-400': assessment.task_h_score === 0,
                  }"
                >
                  {{ assessment.task_h_score }}
                </td>
                <td
                  class="border border-gray-300 px-1 py-3 text-center text-xs font-medium lg:px-2 lg:text-sm"
                  :class="{
                    'text-green-600': assessment.task_i_score > 0,
                    'text-gray-400': assessment.task_i_score === 0,
                  }"
                >
                  {{ assessment.task_i_score }}
                </td>
                <td
                  class="border border-gray-300 px-1 py-3 text-center text-xs font-medium lg:px-2 lg:text-sm"
                  :class="{
                    'text-green-600': assessment.task_j_score > 0,
                    'text-gray-400': assessment.task_j_score === 0,
                  }"
                >
                  {{ assessment.task_j_score }}
                </td>
                <td
                  class="border border-gray-300 px-1 py-3 text-center text-xs font-medium lg:px-2 lg:text-sm"
                  :class="{
                    'text-green-600': assessment.task_k_score > 0,
                    'text-gray-400': assessment.task_k_score === 0,
                  }"
                >
                  {{ assessment.task_k_score }}
                </td>
                <td
                  class="border border-gray-300 px-2 py-3 text-center text-xs font-bold lg:px-3 lg:text-sm"
                  :class="{
                    'text-blue-600': assessment.overall_score >= 75,
                    'text-orange-600':
                      assessment.overall_score >= 50 && assessment.overall_score < 75,
                    'text-red-600': assessment.overall_score < 50,
                  }"
                >
                  {{ assessment.overall_score }}%
                </td>
                <td
                  class="border border-gray-300 px-2 py-3 text-center text-xs font-bold text-gray-700 lg:px-3 lg:text-sm"
                >
                  {{ assessment.total_score }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
