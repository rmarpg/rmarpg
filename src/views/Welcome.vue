<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'
import RMALayout from '@/layouts/RMALayout.vue'
import Leaderboard from '@/components/Leaderboard.vue'
</script>

<template>
  <RMALayout>
    <div class="mt-4 grid gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-2">
      <!-- Welcome Section -->
      <section class="order-2 flex flex-col items-center justify-center lg:order-1">
        <div class="px-4 text-center">
          <h1 class="text-2xl font-bold text-white sm:text-3xl">Welcome!</h1>
          <p class="mt-2 text-sm text-white/80 sm:text-base">You have 20s to finish 2 questions</p>
          <p class="mt-2 text-sm text-white/60">
            Grade 2 RMA. This quiz consist of 11 Tasks with 1-4 questions each
          </p>

          <Button as-child class="mt-6 w-full px-6 py-3 text-base sm:mt-8 sm:w-auto">
            <RouterLink to="/task-a">Let's do this!</RouterLink>
          </Button>
        </div>
      </section>

      <!-- Leaderboard Section -->
      <section class="order-1 flex items-center justify-center lg:order-2">
        <div class="w-full max-w-sm sm:max-w-md">
          <Leaderboard />
        </div>
      </section>
    </div>
  </RMALayout>
</template>
