import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/pages/auth/RegisterPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/pages/dashboard/IndexPage.vue'),
      },
      {
        path: 'system/user',
        name: 'UserManagement',
        component: () => import('@/pages/system/user/IndexPage.vue'),
      },
      {
        path: 'system/role',
        name: 'RoleManagement',
        component: () => import('@/pages/system/role/IndexPage.vue'),
      },
      {
        path: 'system/menu',
        name: 'MenuManagement',
        component: () => import('@/pages/system/menu/IndexPage.vue'),
      },
      {
        path: 'system/log',
        name: 'LogManagement',
        component: () => import('@/pages/system/log/IndexPage.vue'),
      },
      {
        path: 'system/setting',
        name: 'SystemSetting',
        component: () => import('@/pages/system/setting/IndexPage.vue'),
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/pages/profile/IndexPage.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/error/404.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  }
  else if (!to.meta.requiresAuth && authStore.isAuthenticated && (to.name === 'Login' || to.name === 'Register')) {
    next({ name: 'Dashboard' })
  }
  else {
    next()
  }
})

export default router
