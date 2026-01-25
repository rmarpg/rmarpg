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

const section = ref('Rose')
const gender = ref('male')

const selectGender = (selectedGender: string) => {
  gender.value = selectedGender
}

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
        learner_id: formData.get('learner_id') as string,
        section: section.value,
        gender: gender.value,
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
            <Label for="learner_id">Learner ID</Label>
            <Input type="text" name="learner_id" id="learner_id" placeholder="e.g. LRN-12345678" required />
          </div>

          <div class="mt-4 grid gap-2">
            <Label for="section">Section</Label>
            <Select v-model="section">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Rose">Rose</SelectItem>
                <SelectItem value="Sampaguita">Sampaguita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="mt-4 grid gap-2">
            <Label for="gender">Gender</Label>
            <div class="flex gap-2">
              <Button
                type="button"
                @click="selectGender('male')"
                :class="[
                  'flex-1 bg-blue-500 text-white hover:bg-blue-600',
                  gender === 'male' ? 'ring-2 ring-blue-700 ring-offset-2' : '',
                ]"
              >
                Male
              </Button>
              <Button
                type="button"
                @click="selectGender('female')"
                :class="[
                  'flex-1 bg-pink-500 text-white hover:bg-pink-600',
                  gender === 'female' ? 'ring-2 ring-pink-700 ring-offset-2' : '',
                ]"
              >
                Female
              </Button>
            </div>
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
