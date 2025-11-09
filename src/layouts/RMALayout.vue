<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/composables/useAuth'

const { user, logout } = useAuth()
</script>

<template>
  <div class="min-h-screen bg-blue-800 p-3 sm:p-4 lg:p-8">
    <div>
      <header class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <img src="/logo.png" class="h-16 w-auto sm:h-20" />

        <div v-if="user" class="w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger
              :class="'flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm text-white transition-colors duration-200 hover:bg-white/10 sm:w-auto sm:justify-start sm:text-base'"
            >
              <span class="max-w-[200px] truncate sm:max-w-none">{{ user.email }}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="size-4 flex-shrink-0"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-56">
              <DropdownMenuItem>
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="logout" variant="destructive"> Logout </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <hr class="mt-2 w-full border-t-2 border-black sm:mt-4" />
    </div>
    <slot />
  </div>
</template>
