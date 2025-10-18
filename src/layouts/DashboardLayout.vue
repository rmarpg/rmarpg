<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

const sidebarOpen = ref(true)
const { logout } = useAuth()

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const handleLogout = async () => {
  await logout()
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside
      :class="[
        'shrink-0 bg-blue-800 py-8 transition-all duration-300 ease-in-out',
        sidebarOpen ? 'w-64' : 'w-16',
      ]"
    >
      <div class="flex justify-center">
        <img
          src="/logo.png"
          alt="Logo"
          :class="['w-auto transition-all duration-300', sidebarOpen ? 'h-16' : 'h-8']"
        />
      </div>

      <nav class="mt-8">
        <RouterLink
          to="/scoresheet"
          :class="[
            'inline-flex w-full font-bold text-white transition-all duration-300',
            sidebarOpen
              ? 'justify-center bg-blue-600 px-4 py-2'
              : 'justify-center bg-blue-600 px-2 py-2',
          ]"
        >
          <span v-if="sidebarOpen">Scoresheet</span>
          <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            ></path>
          </svg>
        </RouterLink>

        <RouterLink
          to="/scoresheet"
          :class="[
            'inline-flex w-full font-bold text-white transition-all duration-300',
            sidebarOpen
              ? 'justify-center bg-transparent px-4 py-2'
              : 'justify-center bg-transparent px-2 py-2',
          ]"
        >
          <span v-if="sidebarOpen">Summary Graph</span>
          <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            ></path>
          </svg>
        </RouterLink>

        <RouterLink
          to="/scoresheet"
          :class="[
            'inline-flex w-full font-bold text-white transition-all duration-300',
            sidebarOpen
              ? 'justify-center bg-transparent px-4 py-2'
              : 'justify-center bg-transparent px-2 py-2',
          ]"
        >
          <span v-if="sidebarOpen">Graph</span>
          <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            ></path>
          </svg>
        </RouterLink>

        <!-- Logout Button -->
        <button
          @click="handleLogout"
          :class="[
            'inline-flex w-full cursor-pointer font-bold text-white transition-all duration-300 hover:bg-red-600',
            sidebarOpen
              ? 'justify-center bg-transparent px-4 py-2'
              : 'justify-center bg-transparent px-2 py-2',
          ]"
        >
          <span v-if="sidebarOpen">Logout</span>
          <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            ></path>
          </svg>
        </button>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 shrink-0 p-8">
      <!-- Toggle Button -->
      <button
        @click="toggleSidebar"
        class="mb-4 rounded-lg bg-blue-600 p-2 text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
        aria-label="Toggle sidebar"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          ></path>
        </svg>
      </button>

      <slot />
    </main>
  </div>
</template>
