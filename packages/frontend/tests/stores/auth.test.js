import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '../../src/api/auth.js'

import { useAuthStore } from '../../src/stores/auth.js'

// Mock the auth API
vi.mock('../../src/api/auth.js', () => ({
  authApi: {
    login: vi.fn(),
    getProfile: vi.fn(),
  },
}))

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem(key) {
    return this.store[key] || null
  },
  setItem(key, value) {
    this.store[key] = value
  },
  removeItem(key) {
    delete this.store[key]
  },
  clear() {
    this.store = {}
  },
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have empty token by default', () => {
      const store = useAuthStore()
      expect(store.token).toBe('')
    })

    it('should have null user by default', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
    })

    it('should not be authenticated by default', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })

    it('should load token from localStorage', () => {
      localStorageMock.setItem('token', 'saved-token')
      setActivePinia(createPinia())
      const store = useAuthStore()
      expect(store.token).toBe('saved-token')
    })
  })

  describe('setToken', () => {
    it('should update token and save to localStorage', () => {
      const store = useAuthStore()
      store.setToken('new-token')

      expect(store.token).toBe('new-token')
      expect(localStorageMock.getItem('token')).toBe('new-token')
    })
  })

  describe('clearToken', () => {
    it('should clear token and remove from localStorage', () => {
      const store = useAuthStore()
      store.setToken('token-to-clear')
      store.clearToken()

      expect(store.token).toBe('')
      expect(localStorageMock.getItem('token')).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      const store = useAuthStore()
      store.setToken('valid-token')

      expect(store.isAuthenticated).toBe(true)
    })

    it('should return false when token is empty', () => {
      const store = useAuthStore()
      store.clearToken()

      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('login', () => {
    it('should set token and user on successful login', async () => {
      const mockResponse = {
        data: {
          token: 'login-token',
          user: { id: '1', username: 'testuser' },
        },
      }
      authApi.login.mockResolvedValue(mockResponse)

      const store = useAuthStore()
      const result = await store.login({ username: 'test', password: 'pass' })

      expect(store.token).toBe('login-token')
      expect(store.user).toEqual({ id: '1', username: 'testuser' })
      expect(result).toEqual(mockResponse)
    })

    it('should call login API with credentials', async () => {
      authApi.login.mockResolvedValue({ data: { token: 't', user: {} } })

      const store = useAuthStore()
      await store.login({ username: 'myuser', password: 'mypass' })

      expect(authApi.login).toHaveBeenCalledWith({
        username: 'myuser',
        password: 'mypass',
      })
    })
  })

  describe('logout', () => {
    it('should clear token and user', async () => {
      const store = useAuthStore()
      store.setToken('token')
      store.user = { id: '1' }

      await store.logout()

      expect(store.token).toBe('')
      expect(store.user).toBeNull()
    })
  })

  describe('getProfile', () => {
    it('should fetch and set user profile', async () => {
      const mockProfile = {
        data: { id: '1', username: 'testuser', email: 'test@example.com' },
      }
      authApi.getProfile.mockResolvedValue(mockProfile)

      const store = useAuthStore()
      const result = await store.getProfile()

      expect(store.user).toEqual(mockProfile.data)
      expect(result).toEqual(mockProfile)
    })
  })
})
