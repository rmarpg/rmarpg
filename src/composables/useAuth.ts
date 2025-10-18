import { supabase } from '@/lib/supabase-client'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const router = useRouter()
  const user = ref<User | null>(null)
  const loading = ref(true)

  onMounted(async () => {
    try {
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        const { data: userData } = await supabase.auth.getUser()
        user.value = userData.user
      }

      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state change:', event, session) // Debug logging
        if (event === 'SIGNED_IN' && session) {
          user.value = session.user
        } else if (event === 'SIGNED_OUT') {
          user.value = null
        } else if (event === 'TOKEN_REFRESHED' && session) {
          user.value = session.user
        }
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      loading.value = false
    }
  })

  const logout = async () => {
    try {
      // Clear local user state immediately
      user.value = null

      // Sign out from Supabase
      await supabase.auth.signOut()

      // Redirect to home page
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if signOut fails, clear local state and redirect
      user.value = null
      router.push('/')
    }
  }

  const isAuthenticated = () => {
    return !!user.value
  }

  return {
    user,
    loading,
    logout,
    isAuthenticated,
  }
}
