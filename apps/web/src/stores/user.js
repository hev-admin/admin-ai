import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getUserInfoApi, loginApi, logoutApi } from '@/api/auth'
import { clearToken, getToken, setToken } from '@/utils/auth'
import { usePermissionStore } from './permission'
import { useTabsStore } from './tabs'

/**
 * 登录态与用户身份（REQUIREMENTS §11）：token 持久化由 utils/auth 按「记住我」
 * 策略管理（localStorage / sessionStorage 二选一），用户信息刷新后重新拉取。
 */
export const useUserStore = defineStore('user', () => {
  const token = ref(getToken())
  const userInfo = ref(null)
  const roles = ref([])
  const permissions = ref([])

  const isLoggedIn = computed(() => Boolean(token.value))

  async function login({ username, password, remember = false }) {
    const data = await loginApi({ username, password })
    setToken(data.token, remember)
    token.value = data.token
  }

  /** 拉取用户资料 + 角色 + 菜单树 + 权限码（§4.5 聚合结构），菜单树交由 permission store 消费 */
  async function fetchUserInfo() {
    const data = await getUserInfoApi()
    userInfo.value = data.user
    roles.value = data.roles
    permissions.value = data.permissions
    return data
  }

  /** 仅清空本地登录态（不发请求、不跳转），供 401 处理与登出复用 */
  function reset() {
    token.value = ''
    userInfo.value = null
    roles.value = []
    permissions.value = []
    clearToken()
    usePermissionStore().reset()
    // 标签页随登录态清空（M3 决策点 4）：避免换账号后还原到无权限页面
    useTabsStore().reset()
  }

  async function logout() {
    try {
      await logoutApi()
    }
    catch {
      // 服务端登出为无状态占位（§4.1），失败不阻断本地登出
    }
    reset()
  }

  return { token, userInfo, roles, permissions, isLoggedIn, login, logout, fetchUserInfo, reset }
})
