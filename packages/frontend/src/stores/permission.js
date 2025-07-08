import { defineStore } from 'pinia'
import { ref } from 'vue'
import { menuApi } from '@/api/menu.js'

export const usePermissionStore = defineStore('permission', () => {
  const menus = ref([])
  const permissions = ref([])
  const loaded = ref(false)

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
    await Promise.all([loadUserMenus(), loadUserPermissions()])
  }

  function hasPermission(permission) {
    return permissions.value.includes(permission)
  }

  function reset() {
    menus.value = []
    permissions.value = []
    loaded.value = false
  }

  return {
    menus,
    permissions,
    loaded,
    loadUserMenus,
    loadUserPermissions,
    init,
    hasPermission,
    reset,
  }
})
