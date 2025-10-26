<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'
import RMALayout from '@/layouts/RMALayout.vue'
import Leaderboard from '@/components/Leaderboard.vue'
</script>

<template>
  <RMALayout>
    <div class="mt-8 grid gap-8 lg:grid-cols-2">
      <!-- Welcome Section -->
      <section class="flex flex-col items-center justify-center">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-white">Welcome!</h1>
          <p class="mt-4 text-white">Let's start with a warm up!</p>
          <p class="mt-2 text-white/80">You have 20s to finish 2 questions</p>
          <p class="mt-2 text-sm text-white/60">Task 0: Tutorial</p>

          <Button as-child class="mt-8">
            <RouterLink to="/task-a">Let's do this!</RouterLink>
          </Button>
        </div>
      </section>

      <!-- Leaderboard Section -->
      <section class="flex items-center justify-center">
        <div class="w-full max-w-md">
          <Leaderboard />
        </div>
      </section>
    </div>
  </RMALayout>
</template>
