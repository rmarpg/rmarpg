<template>
  <div class="flex min-h-screen flex-col items-center bg-blue-800 sm:justify-center">
    <div class="mx-auto mt-6 w-full max-w-lg sm:mt-0">
      <div class="flex justify-center">
        <img src="/logo.png" alt="Logo" class="h-20 w-auto sm:h-24" />
      </div>

      <div class="mt-4 px-4 py-6 sm:mt-8 sm:rounded-lg sm:bg-white sm:shadow-lg">
        <form @submit.prevent="login" method="post">
          <div>
            <label for="email" class="sr-only">Emaiil address</label>
            <Input
              type="email"
              name="email"
              id="email"
              placeholder="Email address"
              autocomplete="username"
              required
            />
          </div>

          <div class="mt-4">
            <label for="password" class="sr-only">Password</label>
            <Input
              type="password"
              name="password"
              id="password"
              placeholder="Password"
              autocomplete="current-password"
              required
            />
          </div>

          <Button variant="default" class="mt-4 w-full">Login</Button>
        </form>
      </div>

      <div class="mx-4 border-t border-gray-300"></div>
      <div class="mx-auto mt-2 text-center sm:mt-4">
        <RouterLink to="/register" class="text-center font-medium text-neutral-100">
          Create an account
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'vue-router'

const router = useRouter()

const login = () => {
  router.push('/welcome')
}
</script>
