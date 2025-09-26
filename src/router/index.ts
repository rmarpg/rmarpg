import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import Welcome from '@/views/Welcome.vue'
import Q1 from '@/views/items/Q1.vue'
import Q2 from '@/views/items/Q2.vue'
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
      path: '/q1',
      name: 'q1',
      component: Q1,
    },
    {
      path: '/q2',
      name: 'q2',
      component: Q2,
    },
    {
      path: '/scoresheet',
      name: 'scoresheet',
      component: Scoresheet,
    },
  ],
})

export default router
