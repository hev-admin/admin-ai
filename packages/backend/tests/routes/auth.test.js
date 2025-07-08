import { beforeEach, describe, expect, it, vi } from 'vitest'
import app from '../../src/app.js'

import { authService } from '../../src/services/auth.js'

// Mock the auth service
vi.mock('../../src/services/auth.js', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}))

// Mock the auth middleware
vi.mock('../../src/middleware/auth.js', () => ({
  authMiddleware: () => async (c, next) => {
    c.set('user', { userId: 'test-user-id', username: 'testuser' })
    await next()
  },
}))

// Mock rate limiter to bypass in tests
vi.mock('../../src/middleware/rateLimit.js', () => ({
  authRateLimiter: () => async (c, next) => await next(),
  globalRateLimiter: () => async (c, next) => await next(),
}))

describe('auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('pOST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      authService.login.mockResolvedValue({
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        user: { id: '1', username: 'test' },
      })

      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', password: 'Password123' }),
      })

      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.code).toBe(200)
      expect(body.data.token).toBe('mock-token')
    })

    it('should return 400 with invalid credentials', async () => {
      authService.login.mockRejectedValue(new Error('密码错误'))

      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', password: 'WrongPass1' }),
      })

      const body = await res.json()
      expect(res.status).toBe(400)
      expect(body.message).toBe('密码错误')
    })

    it('should validate username is required', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '', password: 'Password123' }),
      })

      expect(res.status).toBe(400)
    })

    it('should validate password minimum length', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', password: '123' }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('pOST /api/auth/register', () => {
    it('should register successfully', async () => {
      authService.register.mockResolvedValue({
        id: '1',
        username: 'newuser',
        email: 'new@example.com',
      })

      const res = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'newuser',
          email: 'new@example.com',
          password: 'Password123',
        }),
      })

      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.message).toBe('注册成功')
    })

    it('should validate email format', async () => {
      const res = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'newuser',
          email: 'invalid-email',
          password: 'Password123',
        }),
      })

      expect(res.status).toBe(400)
    })

    it('should validate username minimum length', async () => {
      const res = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'ab',
          email: 'test@example.com',
          password: 'Password123',
        }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('gET /api/auth/profile', () => {
    it('should return user profile', async () => {
      authService.getProfile.mockResolvedValue({
        id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com',
      })

      const res = await app.request('/api/auth/profile', {
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' },
      })

      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.data.username).toBe('testuser')
    })
  })

  describe('pOST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const res = await app.request('/api/auth/logout', {
        method: 'POST',
      })

      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.message).toBe('登出成功')
    })
  })

  describe('pUT /api/auth/password', () => {
    it('should change password successfully', async () => {
      authService.changePassword.mockResolvedValue(undefined)

      const res = await app.request('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({
          oldPassword: 'OldPass123',
          newPassword: 'NewPass456',
        }),
      })

      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.message).toBe('密码修改成功')
    })
  })
})
