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
  ],
})

export default router
