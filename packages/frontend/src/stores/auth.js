import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api/auth.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(null)

  const isAuthenticated = computed(() => !!token.value)

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function clearToken() {
    token.value = ''
    localStorage.removeItem('token')
  }

  async function login(credentials) {
    const res = await authApi.login(credentials)
    setToken(res.data.token)
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
    user,
    isAuthenticated,
    login,
    logout,
    getProfile,
    setToken,
    clearToken,
  }
})
