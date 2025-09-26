import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { supabase } from '@/lib/supabase-client'

/**
 * Guest middleware that redirects authenticated users away from guest-only routes
 */
export const guest = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const { data } = await supabase.auth.getSession()

  if (data.session) {
    // User is authenticated, redirect to welcome page
    next('/welcome')
  } else {
    // User is not authenticated, allow access to guest routes
    next()
  }
}
