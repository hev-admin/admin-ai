import { defineStore } from 'pinia'
import { ref } from 'vue'
import { menuApi } from '@/api/menu.js'

export const usePermissionStore = defineStore('permission', () => {
  const menus = ref([])
  const permissions = ref([])
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref(null)

  async function loadUserMenus() {
    const res = await menuApi.getUserMenus()
    menus.value = res.data
    loaded.value = true
  }

  async function loadUserPermissions() {
    const res = await menuApi.getUserPermissions()
    permissions.value = res.data
  }

  async function init() {
    loading.value = true
    error.value = null
    try {
      await Promise.all([loadUserMenus(), loadUserPermissions()])
    }
    catch (e) {
      error.value = e.message || '加载权限失败'
      throw e
    }
    finally {
      loading.value = false
    }
  }

  function hasPermission(permission) {
    return permissions.value.includes(permission)
  }

  function reset() {
    menus.value = []
    permissions.value = []
    loaded.value = false
    loading.value = false
    error.value = null
  }

  return {
    menus,
    permissions,
    loaded,
    loading,
    error,
    loadUserMenus,
    loadUserPermissions,
    init,
    hasPermission,
    reset,
  }
})
