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

    <table class="mt-6 w-full border-collapse">
      <thead class="bg-blue-600">
        <tr>
          <th class="border border-gray-300 px-4 py-2 text-left font-semibold text-white">S/N</th>
          <th class="border border-gray-300 px-4 py-2 text-left font-semibold text-white">LRN</th>
          <th class="border border-gray-300 px-4 py-2 text-left font-semibold text-white">
            Name of Learner
          </th>
          <th class="border border-gray-300 px-4 py-2 text-left font-semibold text-white">Sex</th>
          <th class="border border-gray-300 px-4 py-2 text-left font-semibold text-white">
            Birthday
          </th>
          <th class="border border-gray-300 px-4 py-2 text-left font-semibold text-white">
            Date of Assessment
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
        </tr>
        <tr>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
        </tr>
        <tr>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
        </tr>
        <tr>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
          <td class="border border-gray-300 px-4 py-4"></td>
        </tr>
      </tbody>
    </table>
  </DashboardLayout>
</template>
