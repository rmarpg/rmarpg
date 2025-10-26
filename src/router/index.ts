import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import Welcome from '@/views/Welcome.vue'
import Scoresheet from '@/views/Scoresheet.vue'
import { guest } from '@/router/middleware'

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
    },
    {
      path: '/scoresheet',
      name: 'scoresheet',
      component: Scoresheet,
    },
    {
      path: '/task-a',
      name: 'task-a',
      component: () => import('@/views/TaskA.vue'),
    },
    {
      path: '/task-b',
      name: 'task-b',
      component: () => import('@/views/TaskB.vue'),
    },
    {
      path: '/task-c',
      name: 'task-c',
      component: () => import('@/views/TaskC.vue'),
    },
    {
      path: '/task-d',
      name: 'task-d',
      component: () => import('@/views/TaskD.vue'),
    },
    {
      path: '/task-e',
      name: 'task-e',
      component: () => import('@/views/TaskE.vue'),
    },
    {
      path: '/task-f',
      name: 'task-f',
      component: () => import('@/views/TaskF.vue'),
    },
    {
      path: '/task-g',
      name: 'task-g',
      component: () => import('@/views/TaskG.vue'),
    },
    {
      path: '/task-h',
      name: 'task-h',
      component: () => import('@/views/TaskH.vue'),
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
  ],
})

export default router
