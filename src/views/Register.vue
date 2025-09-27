<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase-client'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const loading = ref(false)

const register = async (e: Event) => {
  const form = e.target as HTMLFormElement
  const formData = new FormData(form)

  const payload = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        gender: formData.get('gender') as string,
      },
    },
  }

  loading.value = true

  try {
    const { error } = await supabase.auth.signUp(payload)
    if (error != null) {
      console.error(error)
    }
    router.push('/welcome')
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
        <form @submit.prevent="register" method="post">
          <div class="grid gap-2">
            <Label for="first_name">First name</Label>
            <Input type="text" name="first_name" id="first_name" required />
          </div>

          <div class="mt-4 grid gap-2">
            <Label for="last_name">Last name</Label>
            <Input type="text" name="last_name" id="last_name" required />
          </div>

          <div class="mt-4 grid gap-2">
            <Label for="gender">Gender</Label>
            <Select default-value="male">
              <SelectTrigger name="gender" id="gender" class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="mt-4 grid gap-2">
            <Label for="email">Email address</Label>
            <Input type="email" name="email" id="email" autocomplete="username" required />
          </div>

          <div class="mt-4 grid gap-2">
            <Label for="password">Password</Label>
            <Input
              type="password"
              name="password"
              id="password"
              autocomplete="current-password"
              required
            />
          </div>

          <Button variant="default" class="mt-4 w-full" :disabled="loading">Register</Button>
        </form>
      </div>

      <div class="mx-4 border-t border-gray-300"></div>
      <div class="mx-auto mt-2 text-center sm:mt-4">
        <span class="text-neutral-100">Already have an account?</span>
        <RouterLink to="/" class="text-center font-medium text-neutral-100"> Login </RouterLink>
      </div>
    </div>
  </div>
</template>
