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

/**
 * Authentication middleware that ensures user is logged in
 */
export const auth = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const { data } = await supabase.auth.getSession()

  if (!data.session) {
    // User is not authenticated, redirect to login
    next('/')
  } else {
    // User is authenticated, allow access
    next()
  }
}

/**
 * Task middleware that ensures user has an active assessment before accessing tasks
 */
export const taskGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const { data: sessionData } = await supabase.auth.getSession()

  if (!sessionData.session) {
    // User is not authenticated
    next('/')
    return
  }

  // Check if user has an active assessment
  const { data: assessment, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('user_id', sessionData.session.user.id)
    .eq('grade_level', 2)
    .single()

  if (error && error.code !== 'PGRST116') {
    // Database error (not "no rows" error)
    console.error('Error checking assessment:', error)
    next('/welcome')
    return
  }

  if (!assessment) {
    // No assessment found, redirect to welcome to create one
    next('/welcome')
    return
  }

  // User has an assessment, allow access to task
  next()
}

/**
 * Admin middleware: restrict routes to users with profiles.is_admin = true
 */
export const adminGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    next('/')
    return
  }

  const uid = sessionData.session.user.id
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', uid)
      .single()
    if (error) {
      console.warn('Admin check failed:', error)
      next('/welcome')
      return
    }
    if (data?.first_name !== 'Administrator') {
      next('/welcome')
      return
    }
    next()
  } catch (err) {
    console.error('Unexpected admin check error:', err)
    next('/welcome')
  }
}
