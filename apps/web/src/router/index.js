import { createRouter, createWebHistory } from 'vue-router'

/** 静态路由：登录页、主布局（动态路由挂其子级）、404 兜底 */
export const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: 'login.title' },
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        // 已登录访问未授权/未知地址由守卫重定向至此（M2 决策点 2）
        path: '/403',
        name: 'Forbidden',
        component: () => import('@/views/exception/403.vue'),
        meta: { title: '403', hideTab: true },
      },
    ],
  },
  {
    path: '/500',
    name: 'ServerError',
    component: () => import('@/views/exception/500.vue'),
    meta: { title: '500', hideTab: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/exception/404.vue'),
    meta: { title: '404', hideTab: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
})

export default router
