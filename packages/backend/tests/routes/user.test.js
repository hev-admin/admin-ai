import { beforeEach, describe, expect, it, vi } from 'vitest'
import app from '../../src/app.js'

import { userService } from '../../src/services/user.js'

// Mock the user service
vi.mock('../../src/services/user.js', () => ({
  userService: {
    getList: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    batchDelete: vi.fn(),
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

describe('user routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('gET /api/users', () => {
    it('should return paginated user list', async () => {
      userService.getList.mockResolvedValue({
        list: [
          { id: '1', username: 'user1' },
          { id: '2', username: 'user2' },
        ],
        total: 25,
      })

      const res = await app.request('/api/users?page=1&pageSize=10', {
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' },
      })

      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.data.list).toHaveLength(2)
      expect(body.data.pagination.total).toBe(25)
      expect(body.data.pagination.totalPages).toBe(3)
    })

    it('should filter by keyword', async () => {
      userService.getList.mockResolvedValue({ list: [], total: 0 })

      await app.request('/api/users?keyword=john', {
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' },
      })

      expect(userService.getList).toHaveBeenCalledWith(1, 10, 'john')
    })
  })

  describe('gET /api/users/:id', () => {
    it('should return user by id', async () => {
      userService.getById.mockResolvedValue({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
      })

      const res = await app.request('/api/users/1', {
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' },
      })

      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.data.username).toBe('testuser')
    })

    it('should return 404 for non-existent user', async () => {
      userService.getById.mockResolvedValue(null)

      const res = await app.request('/api/users/nonexistent', {
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' },
      })

      const body = await res.json()
      expect(res.status).toBe(404)
      expect(body.message).toBe('用户不存在')
    })
  })

  describe('pOST /api/users', () => {
    it('should create user', async () => {
      userService.create.mockResolvedValue({
        id: '1',
        username: 'newuser',
        email: 'new@example.com',
      })

      const res = await app.request('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({
          username: 'newuser',
          email: 'new@example.com',
          password: 'Password123',
        }),
      })

      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.message).toBe('创建成功')
    })

    it('should return error when creation fails', async () => {
      userService.create.mockRejectedValue(new Error('用户名已存在'))

      const res = await app.request('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({
          username: 'existing',
          email: 'existing@example.com',
          password: 'Password123',
        }),
      })

      const body = await res.json()
      expect(res.status).toBe(400)
      expect(body.message).toBe('用户名已存在')
    })
  })

  describe('pUT /api/users/:id', () => {
    it('should update user', async () => {
      userService.update.mockResolvedValue({
        id: '1',
        nickname: 'Updated Name',
      })

      const res = await app.request('/api/users/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({ nickname: 'Updated Name' }),
      })

      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.message).toBe('更新成功')
    })
  })

  describe('dELETE /api/users/:id', () => {
    it('should delete user', async () => {
      userService.delete.mockResolvedValue({})

      const res = await app.request('/api/users/1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer mock-token' },
      })

      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.message).toBe('删除成功')
    })
  })

  describe('pOST /api/users/batch-delete', () => {
    it('should batch delete users', async () => {
      userService.batchDelete.mockResolvedValue({ count: 3 })

      const res = await app.request('/api/users/batch-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({ ids: ['1', '2', '3'] }),
      })

      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.message).toBe('批量删除成功')
    })

    it('should return error when no ids provided', async () => {
      const res = await app.request('/api/users/batch-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({ ids: [] }),
      })

      const body = await res.json()
      expect(res.status).toBe(400)
      expect(body.message).toBe('请选择要删除的用户')
    })
  })
})
