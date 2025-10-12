<script setup lang="ts">
import Select from '@/components/ui/select/Select.vue'
import SelectContent from '@/components/ui/select/SelectContent.vue'
import SelectItem from '@/components/ui/select/SelectItem.vue'
import SelectTrigger from '@/components/ui/select/SelectTrigger.vue'
import SelectValue from '@/components/ui/select/SelectValue.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ref } from 'vue'

const selectedGrade = ref('grade_1')
</script>

<template>
  <DashboardLayout>
    <header class="flex items-end gap-3">
      <h2 class="text-2xl font-semibold text-neutral-800">Grade 1</h2>
      <Select v-model="selectedGrade">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="grade_1">Grade 1</SelectItem>
        </SelectContent>
      </Select>
    </header>

    <div class="mt-6 overflow-x-auto">
      <table class="w-full min-w-max border-collapse">
        <thead class="bg-blue-600">
          <tr>
            <th class="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-white">
              S/N
            </th>
            <th class="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-white">
              LRN
            </th>
            <th class="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-white">
              Name of Learner
            </th>
            <th class="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-white">
              Section
            </th>
            <th class="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-white">
              Sex
            </th>
            <th class="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-white">
              Birthday
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
          <tr v-for="n in 10" :key="n" class="hover:bg-gray-50">
            <td class="border border-gray-300 px-3 py-3 text-sm">{{ n }}</td>
            <td class="border border-gray-300 px-3 py-3 text-sm"></td>
            <td class="border border-gray-300 px-3 py-3 text-sm"></td>
            <td class="border border-gray-300 px-3 py-3 text-sm"></td>
            <td class="border border-gray-300 px-3 py-3 text-sm"></td>
            <td class="border border-gray-300 px-3 py-3 text-sm"></td>
            <td class="border border-gray-300 px-3 py-3 text-sm"></td>
            <td class="border border-gray-300 px-2 py-3 text-center text-sm"></td>
            <td class="border border-gray-300 px-2 py-3 text-center text-sm"></td>
            <td class="border border-gray-300 px-2 py-3 text-center text-sm"></td>
            <td class="border border-gray-300 px-2 py-3 text-center text-sm"></td>
            <td class="border border-gray-300 px-2 py-3 text-center text-sm"></td>
            <td class="border border-gray-300 px-2 py-3 text-center text-sm"></td>
            <td class="border border-gray-300 px-2 py-3 text-center text-sm"></td>
            <td class="border border-gray-300 px-2 py-3 text-center text-sm"></td>
            <td class="border border-gray-300 px-2 py-3 text-center text-sm"></td>
            <td class="border border-gray-300 px-2 py-3 text-center text-sm"></td>
            <td class="border border-gray-300 px-2 py-3 text-center text-sm"></td>
            <td class="border border-gray-300 px-3 py-3 text-center text-sm font-medium"></td>
            <td class="border border-gray-300 px-3 py-3 text-center text-sm font-medium"></td>
          </tr>
        </tbody>
      </table>
    </div>
  </DashboardLayout>
</template>
