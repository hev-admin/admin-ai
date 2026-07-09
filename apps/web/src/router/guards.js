import NProgress from 'nprogress'
import { usePermissionStore } from '@/stores/permission'
import { useUserStore } from '@/stores/user'
import { updateDocumentTitle } from '@/utils/title'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

/** 免登录白名单：登录页与 500 页（无敏感内容）；403/404 需登录态判定进不进（M2 决策点 2 / M3 决策点 10） */
const WHITELIST = ['/login', '/500']

const SUPER_ROLE_CODE = 'super'

/**
 * 路由守卫（REQUIREMENTS §4.2）：白名单放行 → 未登录跳登录（带 redirect）→
 * 已登录首次进入拉取用户信息并注册动态路由 → 重放当前导航 →
 * 命中 catch-all 时按角色区分 403 / 404（M2 规划决策点 2）。
 */
export function setupRouterGuards(router) {
  router.beforeEach(async (to) => {
    NProgress.start()
    const userStore = useUserStore()
    const permissionStore = usePermissionStore()

    if (!userStore.token) {
      if (WHITELIST.includes(to.path))
        return true
      return { path: '/login', query: { redirect: to.fullPath }, replace: true }
    }

    if (to.path === '/login')
      return { path: '/', replace: true }

    if (permissionStore.isLoaded) {
      // super 全量路由已注册，未匹配即真不存在（保持 404）；
      // 其余账号无法区分「无权限」与「不存在」，统一按无权限口径进 403
      if (to.name === 'NotFound' && !userStore.roles.includes(SUPER_ROLE_CODE))
        return { path: '/403', replace: true }
      return true
    }

    try {
      const { menus } = await userStore.fetchUserInfo()
      permissionStore.buildRoutes(menus)
      // 重放当前导航以命中新注册的路由。必须按 path/query/hash 重放，不能展开 to：
      // to 是注册前解析的结果（此刻 name 已是 'NotFound'），而 matcher 对同时含
      // name 与 path 的 location 优先按 name 解析，展开会把导航按名字送回 404
      return { path: to.path, query: to.query, hash: to.hash, replace: true }
    }
    catch {
      // 拉取失败（token 失效等）：401 场景由请求层整页跳转兜底，此处清态回登录页
      userStore.reset()
      return { path: '/login', query: { redirect: to.fullPath }, replace: true }
    }
  })

  router.afterEach((to) => {
    updateDocumentTitle(to.meta)
    NProgress.done()
  })

  router.onError(() => {
    NProgress.done()
  })
}
