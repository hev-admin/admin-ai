import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { usePermissionStore } from '@/stores/permission.js'
import { useTabsStore } from '@/stores/tabs.js'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { requiresAuth: false, hideInTabs: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/pages/auth/RegisterPage.vue'),
    meta: { requiresAuth: false, hideInTabs: true },
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
        meta: { title: '首页', icon: 'i-lucide-home', affix: true, keepAlive: true },
      },
      {
        path: 'system/user',
        name: 'UserManagement',
        component: () => import('@/pages/system/user/IndexPage.vue'),
        meta: { title: '用户管理', icon: 'i-lucide-users', keepAlive: true, permission: 'system:user:list' },
      },
      {
        path: 'system/role',
        name: 'RoleManagement',
        component: () => import('@/pages/system/role/IndexPage.vue'),
        meta: { title: '角色管理', icon: 'i-lucide-shield', keepAlive: true, permission: 'system:role:list' },
      },
      {
        path: 'system/menu',
        name: 'MenuManagement',
        component: () => import('@/pages/system/menu/IndexPage.vue'),
        meta: { title: '菜单管理', icon: 'i-lucide-menu', keepAlive: true, permission: 'system:menu:list' },
      },
      {
        path: 'system/log',
        name: 'LogManagement',
        component: () => import('@/pages/system/log/IndexPage.vue'),
        meta: { title: '日志管理', icon: 'i-lucide-file-text', keepAlive: true, permission: 'system:log:view' },
      },
      {
        path: 'system/setting',
        name: 'SystemSetting',
        component: () => import('@/pages/system/setting/IndexPage.vue'),
        meta: { title: '系统设置', icon: 'i-lucide-settings', keepAlive: true, permission: 'system:setting:view' },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/pages/profile/IndexPage.vue'),
        meta: { title: '个人中心', icon: 'i-lucide-user', keepAlive: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/error/404.vue'),
    meta: { hideInTabs: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const permissionStore = usePermissionStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (!to.meta.requiresAuth && authStore.isAuthenticated && (to.name === 'Login' || to.name === 'Register')) {
    next({ name: 'Dashboard' })
    return
  }

  // Load user info and permissions if authenticated but not loaded
  if (authStore.isAuthenticated && !permissionStore.loaded) {
    try {
      await authStore.fetchUser()
      await permissionStore.init()
    }
    catch {
      authStore.logout()
      permissionStore.reset()
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
  }

  // Check route-level permission
  if (to.meta.permission && authStore.isAuthenticated) {
    if (!permissionStore.hasPermission(to.meta.permission)) {
      next({ name: 'NotFound' })
      return
    }
  }

  next()
})

// 路由变化后自动添加 tab
router.afterEach((to) => {
  if (to.meta?.hideInTabs)
    return
  if (!to.matched.some(r => r.meta?.requiresAuth))
    return

  const tabsStore = useTabsStore()
  tabsStore.addTab(to)
})

export default router
