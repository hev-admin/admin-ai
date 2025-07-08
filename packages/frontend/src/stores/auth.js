import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api/auth.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')
  const user = ref(null)

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
    const res = await authApi.login(credentials)
    setToken(res.data.token)
    if (res.data.refreshToken) {
      setRefreshToken(res.data.refreshToken)
    }
    user.value = res.data.user
    return res
  }

  async function logout() {
    clearToken()
    user.value = null
  }

  async function getProfile() {
    const res = await authApi.getProfile()
    user.value = res.data
    return res
  }

  return {
    token,
    refreshToken,
    user,
    isAuthenticated,
    login,
    logout,
    getProfile,
    setToken,
    setRefreshToken,
    clearToken,
  }
})
