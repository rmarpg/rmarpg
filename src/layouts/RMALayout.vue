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
  <div class="min-h-screen bg-blue-800 p-4 sm:p-8">
    <div>
      <header class="flex items-end justify-between">
        <img src="/logo.png" class="h-20 w-auto" />

        <div v-if="user">
          <DropdownMenu>
            <DropdownMenuTrigger
              :class="'flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-white transition-colors duration-200 hover:bg-white/10'"
            >
              {{ user.email }}
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
                class="size-4"
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
