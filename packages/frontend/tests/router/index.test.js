import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock auth store
const mockAuthStore = {
  isAuthenticated: false,
  token: '',
}

vi.mock('../../src/stores/auth.js', () => ({
  useAuthStore: () => mockAuthStore,
}))

// Mock tabs store
const mockTabsStore = {
  addTab: vi.fn(),
}

vi.mock('../../src/stores/tabs.js', () => ({
  useTabsStore: () => mockTabsStore,
}))

// Mock pinia
vi.mock('pinia', () => ({
  defineStore: vi.fn(),
  createPinia: vi.fn(),
  setActivePinia: vi.fn(),
}))

// Capture guard callbacks
let beforeEachGuard
let afterEachGuard

vi.mock('vue-router', () => ({
  createRouter: () => ({
    beforeEach(fn) { beforeEachGuard = fn },
    afterEach(fn) { afterEachGuard = fn },
  }),
  createWebHistory: () => ({}),
}))

// Import router to trigger guard registration
await import('../../src/router/index.js')

describe('router guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.isAuthenticated = false
  })

  describe('beforeEach - authentication', () => {
    it('should redirect to login when route requires auth and user is not authenticated', () => {
      const next = vi.fn()
      const to = { meta: { requiresAuth: true }, fullPath: '/dashboard', name: 'Dashboard' }
      beforeEachGuard(to, {}, next)
      expect(next).toHaveBeenCalledWith({ name: 'Login', query: { redirect: '/dashboard' } })
    })

    it('should allow access when route requires auth and user is authenticated', () => {
      mockAuthStore.isAuthenticated = true
      const next = vi.fn()
      const to = { meta: { requiresAuth: true }, fullPath: '/dashboard', name: 'Dashboard' }
      beforeEachGuard(to, {}, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('should redirect authenticated user from login to dashboard', () => {
      mockAuthStore.isAuthenticated = true
      const next = vi.fn()
      const to = { meta: { requiresAuth: false }, name: 'Login' }
      beforeEachGuard(to, {}, next)
      expect(next).toHaveBeenCalledWith({ name: 'Dashboard' })
    })

    it('should redirect authenticated user from register to dashboard', () => {
      mockAuthStore.isAuthenticated = true
      const next = vi.fn()
      const to = { meta: { requiresAuth: false }, name: 'Register' }
      beforeEachGuard(to, {}, next)
      expect(next).toHaveBeenCalledWith({ name: 'Dashboard' })
    })

    it('should allow non-auth routes when user is not authenticated', () => {
      const next = vi.fn()
      const to = { meta: { requiresAuth: false }, name: 'Login' }
      beforeEachGuard(to, {}, next)
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('afterEach - tab management', () => {
    it('should add tab for auth-required routes', () => {
      const to = {
        meta: { title: '用户管理' },
        matched: [{ meta: { requiresAuth: true } }],
      }
      afterEachGuard(to)
      expect(mockTabsStore.addTab).toHaveBeenCalledWith(to)
    })

    it('should skip tab for routes with hideInTabs', () => {
      const to = {
        meta: { hideInTabs: true },
        matched: [{ meta: { requiresAuth: true } }],
      }
      afterEachGuard(to)
      expect(mockTabsStore.addTab).not.toHaveBeenCalled()
    })

    it('should skip tab for non-auth routes', () => {
      const to = {
        meta: {},
        matched: [{ meta: { requiresAuth: false } }],
      }
      afterEachGuard(to)
      expect(mockTabsStore.addTab).not.toHaveBeenCalled()
    })
  })
})
