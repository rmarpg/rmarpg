<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'
import RMALayout from '@/layouts/RMALayout.vue'
</script>

<template>
  <RMALayout>
    <section class="mt-12 flex flex-col items-center sm:justify-center">
      <p class="text-white">Let's start with a warm up!</p>
      <p class="mt-4 text-white">You have 20s to finish 2 questions</p>
      <p class="mt-4 text-white">Task 0: Tutorial</p>

      <Button as-child class="mt-8">
        <RouterLink to="/task-a">Let's do this!</RouterLink>
      </Button>
    </section>
  </RMALayout>
</template>
