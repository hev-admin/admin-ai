import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api/auth.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value)

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function setRefreshToken(newRefreshToken) {
    refreshToken.value = newRefreshToken
    localStorage.setItem('refreshToken', newRefreshToken)
  }

  function clearToken() {
    token.value = ''
    refreshToken.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }

  async function login(credentials) {
    loading.value = true
    error.value = null
    try {
      const res = await authApi.login(credentials)
      setToken(res.data.token)
      if (res.data.refreshToken) {
        setRefreshToken(res.data.refreshToken)
      }
      user.value = res.data.user
      return res
    }
    catch (e) {
      error.value = e.message || '登录失败'
      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function logout() {
    clearToken()
    user.value = null
    error.value = null
  }

  async function getProfile() {
    loading.value = true
    error.value = null
    try {
      const res = await authApi.getProfile()
      user.value = res.data
      return res
    }
    catch (e) {
      error.value = e.message || '获取用户信息失败'
      throw e
    }
    finally {
      loading.value = false
    }
  }

  async function fetchUser() {
    if (!token.value)
      return null
    if (user.value)
      return user.value
    return getProfile()
  }

  return {
    token,
    refreshToken,
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    getProfile,
    fetchUser,
    setToken,
    setRefreshToken,
    clearToken,
  }
})
