<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase-client'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const loading = ref(false)
const errors = ref<string | null>(null)

const login = async (e: Event) => {
  const form = e.target as HTMLFormElement
  const formData = new FormData(form)
  errors.value = null

  const payload = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  loading.value = true

  try {
    const { data, error } = await supabase.auth.signInWithPassword(payload)
    if (error != null) {
      errors.value = 'The provided credentials do not match our records'
      return
    }

    // Check if user is an administrator by looking at their profile
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', data.user.id)
        .single()

      if (!profileError && profile?.first_name === 'Administrator') {
        router.push('/scoresheet')
      } else {
        router.push('/welcome')
      }
    } else {
      router.push('/welcome')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center bg-blue-800 sm:justify-center">
    <div class="mx-auto mt-6 w-full max-w-lg sm:mt-0">
      <div class="flex justify-center">
        <img src="/logo.png" alt="Logo" class="h-20 w-auto sm:h-24" />
      </div>

      <div class="mt-4 px-4 py-6 sm:mt-8 sm:rounded-lg sm:bg-white sm:shadow-lg">
        <form @submit.prevent="login" method="post">
          <div class="grid gap-2">
            <Label for="email">Email address</Label>
            <Input
              type="email"
              name="email"
              id="email"
              autocomplete="username"
              required
              placeholder="Email address"
            />
          </div>

          <div v-if="errors" class="mt-2 text-sm text-red-600">
            {{ errors }}
          </div>

          <div class="mt-4 grid gap-2">
            <Label for="password">Password</Label>
            <PasswordInput name="password" id="password" placeholder="Password" required />
          </div>

          <Button variant="default" class="mt-4 w-full" :disabled="loading">Login</Button>
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
