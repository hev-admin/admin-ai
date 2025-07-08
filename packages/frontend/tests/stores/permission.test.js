import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { menuApi } from '../../src/api/menu.js'

import { usePermissionStore } from '../../src/stores/permission.js'

// Mock the menu API
vi.mock('../../src/api/menu.js', () => ({
  menuApi: {
    getUserMenus: vi.fn(),
    getUserPermissions: vi.fn(),
  },
}))

describe('permission store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have empty menus by default', () => {
      const store = usePermissionStore()
      expect(store.menus).toEqual([])
    })

    it('should have empty permissions by default', () => {
      const store = usePermissionStore()
      expect(store.permissions).toEqual([])
    })

    it('should not be loaded by default', () => {
      const store = usePermissionStore()
      expect(store.loaded).toBe(false)
    })
  })

  describe('loadUserMenus', () => {
    it('should fetch and set user menus', async () => {
      const mockMenus = [
        { id: '1', name: 'Dashboard', path: '/dashboard' },
        { id: '2', name: 'Users', path: '/users' },
      ]
      menuApi.getUserMenus.mockResolvedValue({ data: mockMenus })

      const store = usePermissionStore()
      await store.loadUserMenus()

      expect(store.menus).toEqual(mockMenus)
      expect(store.loaded).toBe(true)
    })
  })

  describe('loadUserPermissions', () => {
    it('should fetch and set user permissions', async () => {
      const mockPermissions = ['user:read', 'user:create', 'user:update']
      menuApi.getUserPermissions.mockResolvedValue({ data: mockPermissions })

      const store = usePermissionStore()
      await store.loadUserPermissions()

      expect(store.permissions).toEqual(mockPermissions)
    })
  })

  describe('init', () => {
    it('should load both menus and permissions', async () => {
      menuApi.getUserMenus.mockResolvedValue({
        data: [{ id: '1', name: 'Dashboard' }],
      })
      menuApi.getUserPermissions.mockResolvedValue({
        data: ['user:read'],
      })

      const store = usePermissionStore()
      await store.init()

      expect(store.menus).toHaveLength(1)
      expect(store.permissions).toHaveLength(1)
      expect(store.loaded).toBe(true)
    })

    it('should call both API methods in parallel', async () => {
      menuApi.getUserMenus.mockResolvedValue({ data: [] })
      menuApi.getUserPermissions.mockResolvedValue({ data: [] })

      const store = usePermissionStore()
      await store.init()

      expect(menuApi.getUserMenus).toHaveBeenCalledTimes(1)
      expect(menuApi.getUserPermissions).toHaveBeenCalledTimes(1)
    })
  })

  describe('hasPermission', () => {
    it('should return true when user has permission', async () => {
      menuApi.getUserPermissions.mockResolvedValue({
        data: ['user:read', 'user:create'],
      })

      const store = usePermissionStore()
      await store.loadUserPermissions()

      expect(store.hasPermission('user:read')).toBe(true)
      expect(store.hasPermission('user:create')).toBe(true)
    })

    it('should return false when user lacks permission', async () => {
      menuApi.getUserPermissions.mockResolvedValue({
        data: ['user:read'],
      })

      const store = usePermissionStore()
      await store.loadUserPermissions()

      expect(store.hasPermission('user:delete')).toBe(false)
    })

    it('should return false when no permissions loaded', () => {
      const store = usePermissionStore()
      expect(store.hasPermission('user:read')).toBe(false)
    })
  })

  describe('reset', () => {
    it('should clear all state', async () => {
      menuApi.getUserMenus.mockResolvedValue({
        data: [{ id: '1', name: 'Menu' }],
      })
      menuApi.getUserPermissions.mockResolvedValue({
        data: ['perm:one'],
      })

      const store = usePermissionStore()
      await store.init()

      expect(store.menus).toHaveLength(1)
      expect(store.permissions).toHaveLength(1)
      expect(store.loaded).toBe(true)

      store.reset()

      expect(store.menus).toEqual([])
      expect(store.permissions).toEqual([])
      expect(store.loaded).toBe(false)
    })
  })
})
