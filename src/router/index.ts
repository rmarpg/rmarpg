import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import Welcome from '@/views/Welcome.vue'
import Scoresheet from '@/views/Scoresheet.vue'
import { guest, adminGuard } from '@/router/middleware'
import { supabase } from '@/lib/supabase-client'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      beforeEnter: guest,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
      beforeEnter: guest,
    },
    {
      path: '/welcome',
      name: 'welcome',
      component: Welcome,
      meta: { requiresAuth: true },
    },
    {
      path: '/scoresheet',
      name: 'scoresheet',
      component: Scoresheet,
      meta: { requiresAuth: true },
    },
    {
      path: '/task-a',
      name: 'task-a',
      component: () => import('@/views/TaskA.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/task-b',
      name: 'task-b',
      component: () => import('@/views/TaskB.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/task-c',
      name: 'task-c',
      component: () => import('@/views/TaskC.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/task-d',
      name: 'task-d',
      component: () => import('@/views/TaskD.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/task-e',
      name: 'task-e',
      component: () => import('@/views/TaskE.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/task-f',
      name: 'task-f',
      component: () => import('@/views/TaskF.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/task-g',
      name: 'task-g',
      component: () => import('@/views/TaskG.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/task-h',
      name: 'task-h',
      component: () => import('@/views/TaskH.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/task-i',
      name: 'TaskI',
      component: () => import('@/views/TaskI.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/task-j',
      name: 'TaskJ',
      component: () => import('@/views/TaskJ.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/task-k',
      name: 'TaskK',
      component: () => import('@/views/TaskK.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/summary',
      name: 'summary',
      component: () => import('@/views/Summary.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/results',
      name: 'results',
      component: () => import('@/views/Results.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/graph',
      name: 'graph',
      component: () => import('@/views/AdminGraphs.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/retry-requests',
      name: 'admin-retry-requests',
      component: () => import('@/views/AdminRetryRequests.vue'),
      meta: { requiresAuth: true },
      beforeEnter: adminGuard,
    },
  ],
})

// Global navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    const { data } = await supabase.auth.getSession()

    if (!data.session) {
      // User is not authenticated, redirect to login
      next('/')
      return
    }
  }

  // Allow navigation
  next()
})

export default router
