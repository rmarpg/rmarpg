<template>
  <DashboardLayout>
    <header class="mb-6">
      <h2 class="text-2xl font-semibold text-neutral-800">Summary</h2>
      <p class="mt-1 text-neutral-600">Assessment summary and overview</p>
    </header>

    <div class="rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-200">
      <div class="text-center">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            ></path>
          </svg>
        </div>
        <h3 class="mt-4 text-lg font-medium text-gray-900">Summary Dashboard</h3>
        <p class="mt-2 text-sm text-gray-500">
          This page will contain assessment summaries and overview statistics.
        </p>
        <div class="mt-6">
          <p class="text-sm text-gray-400">Coming soon...</p>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import DashboardLayout from '@/layouts/DashboardLayout.vue'
</script>
