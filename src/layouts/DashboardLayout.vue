<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { supabase } from '@/lib/supabase-client'
import { useRoute } from 'vue-router'

const sidebarOpen = ref(false) // Default to closed on mobile
const isMobile = ref(false)
const { logout, user } = useAuth()
const route = useRoute()

// Computed properties for active states
const isScoresheet = computed(() => route.path === '/scoresheet')
const isSummary = computed(() => route.path === '/summary')
const isGraph = computed(() => route.path === '/graph')
const isAdminRetry = computed(() => route.path === '/admin/retry-requests')

const isAdmin = ref(false)
const loadAdminFlag = async () => {
  try {
    if (!user.value) {
      isAdmin.value = false
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', user.value.id)
      .single()
    isAdmin.value = data?.first_name === 'Administrator'
  } catch {
    isAdmin.value = false
  }
}

const checkIsMobile = () => {
  isMobile.value = window.innerWidth < 1024 // lg breakpoint
  if (!isMobile.value) {
    sidebarOpen.value = true // Default open on desktop
  }
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const handleLogout = async () => {
  await logout()
}

const closeSidebarOnMobile = () => {
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

onMounted(() => {
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)
  loadAdminFlag()
})

watch(user, () => {
  loadAdminFlag()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile)
})
</script>

<template>
  <div class="flex min-h-screen bg-gray-50">
    <!-- Mobile overlay -->
    <div
      v-if="isMobile && sidebarOpen"
      @click="closeSidebarOnMobile"
      class="bg-opacity-50 fixed inset-0 z-40 bg-black lg:hidden"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 flex-col bg-blue-800 py-4 transition-transform duration-300 ease-in-out lg:relative lg:z-auto lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        isMobile ? 'w-64' : sidebarOpen ? 'w-64' : 'w-16',
      ]"
    >
      <!-- Close button for mobile -->
      <button
        v-if="isMobile"
        @click="closeSidebarOnMobile"
        class="absolute top-4 right-4 rounded-lg p-2 text-white hover:bg-blue-700 lg:hidden"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div class="flex justify-center px-4">
        <img
          src="/logo.png"
          alt="Logo"
          :class="[
            'w-auto transition-all duration-300',
            sidebarOpen || isMobile ? 'h-12 sm:h-16' : 'h-8',
          ]"
        />
      </div>

      <nav class="mt-6 flex-1 space-y-1 px-2">
        <RouterLink
          to="/scoresheet"
          @click="closeSidebarOnMobile"
          :class="[
            'group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700',
            isScoresheet ? 'bg-blue-700 text-white' : 'text-blue-200 hover:text-white',
          ]"
        >
          <svg
            class="mr-3 h-5 w-5 flex-shrink-0"
            :class="[isScoresheet ? 'text-white' : 'text-blue-300']"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span v-if="sidebarOpen || isMobile" class="truncate">Scoresheet</span>
        </RouterLink>

        <RouterLink
          to="/summary"
          @click="closeSidebarOnMobile"
          :class="[
            'group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700',
            isSummary ? 'bg-blue-700 text-white' : 'text-blue-200 hover:text-white',
          ]"
        >
          <svg
            class="mr-3 h-5 w-5 flex-shrink-0"
            :class="[isSummary ? 'text-white' : 'text-blue-300']"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span v-if="sidebarOpen || isMobile" class="truncate">Summary</span>
        </RouterLink>

        <RouterLink
          to="/graph"
          @click="closeSidebarOnMobile"
          :class="[
            'group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700',
            isGraph ? 'bg-blue-700 text-white' : 'text-blue-200 hover:text-white',
          ]"
        >
          <svg
            class="mr-3 h-5 w-5 flex-shrink-0"
            :class="[isGraph ? 'text-white' : 'text-blue-300']"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span v-if="sidebarOpen || isMobile" class="truncate">Graph</span>
        </RouterLink>

        <RouterLink
          v-if="isAdmin"
          to="/admin/retry-requests"
          @click="closeSidebarOnMobile"
          :class="[
            'group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700',
            isAdminRetry ? 'bg-blue-700 text-white' : 'text-blue-200 hover:text-white',
          ]"
        >
          <svg
            class="mr-3 h-5 w-5 flex-shrink-0"
            :class="[isAdminRetry ? 'text-white' : 'text-blue-300']"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2v-4H3v4a2 2 0 002 2z" />
          </svg>
          <span v-if="sidebarOpen || isMobile" class="truncate">Retry Requests</span>
        </RouterLink>

        <!-- Logout Button -->
        <button
          @click="handleLogout"
          :class="[
            'group mt-4 flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-blue-200 transition-all duration-200 hover:bg-red-600 hover:text-white',
          ]"
        >
          <svg
            class="mr-3 h-5 w-5 flex-shrink-0 text-blue-300 group-hover:text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span v-if="sidebarOpen || isMobile" class="truncate">Logout</span>
        </button>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="min-w-0 flex-1 lg:ml-0">
      <!-- Header with toggle button -->
      <div class="sticky top-0 z-30 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <button
            @click="toggleSidebar"
            class="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            aria-label="Toggle sidebar"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Page content -->
      <div class="p-4 sm:p-6 lg:p-8">
        <slot />
      </div>
    </main>
  </div>
</template>
