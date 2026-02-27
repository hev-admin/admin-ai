import { beforeEach, describe, expect, it, vi } from 'vitest'
import prisma from '../../src/config/database.js'
import { permissionMiddleware } from '../../src/middleware/permission.js'

// Mock dependencies
vi.mock('../../src/config/database.js', () => ({
  default: {
    userRole: {
      findMany: vi.fn(),
    },
  },
}))

function createMockContext(user = null) {
  const store = new Map()
  if (user) {
    store.set('user', user)
  }
  return {
    get: key => store.get(key),
    set: (key, value) => store.set(key, value),
    json: vi.fn((body, status) => ({ body, status })),
  }
}

describe('permissionMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('authentication check', () => {
    it('should return 401 when user is not set in context', async () => {
      const middleware = permissionMiddleware('system:user:list')
      const c = createMockContext(null)
      const next = vi.fn()

      await middleware(c, next)

      expect(c.json).toHaveBeenCalledWith(
        { code: 401, message: '未登录', data: null },
        401,
      )
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 401 when user has no userId', async () => {
      const middleware = permissionMiddleware('system:user:list')
      const c = createMockContext({})
      const next = vi.fn()

      await middleware(c, next)

      expect(c.json).toHaveBeenCalledWith(
        { code: 401, message: '未登录', data: null },
        401,
      )
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('authorization check with string permission', () => {
    it('should return 403 when user lacks required permission', async () => {
      const middleware = permissionMiddleware('system:user:delete')
      const c = createMockContext({ userId: 'user1' })
      const next = vi.fn()

      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            permissions: [
              { menu: { permission: 'system:user:list' } },
              { menu: { permission: 'system:user:create' } },
            ],
          },
        },
      ])

      await middleware(c, next)

      expect(c.json).toHaveBeenCalledWith(
        { code: 403, message: '没有操作权限', data: null },
        403,
      )
      expect(next).not.toHaveBeenCalled()
    })

    it('should call next when user has the required permission', async () => {
      const middleware = permissionMiddleware('system:user:list')
      const c = createMockContext({ userId: 'user1' })
      const next = vi.fn()

      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            permissions: [
              { menu: { permission: 'system:user:list' } },
              { menu: { permission: 'system:user:create' } },
            ],
          },
        },
      ])

      await middleware(c, next)

      expect(next).toHaveBeenCalled()
      expect(c.json).not.toHaveBeenCalled()
    })

    it('should handle user with no roles', async () => {
      const middleware = permissionMiddleware('system:user:list')
      const c = createMockContext({ userId: 'user1' })
      const next = vi.fn()

      prisma.userRole.findMany.mockResolvedValue([])

      await middleware(c, next)

      expect(c.json).toHaveBeenCalledWith(
        { code: 403, message: '没有操作权限', data: null },
        403,
      )
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('authorization check with array permissions', () => {
    it('should allow if user has any of the required permissions', async () => {
      const middleware = permissionMiddleware(['system:user:update', 'system:user:delete'])
      const c = createMockContext({ userId: 'user1' })
      const next = vi.fn()

      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            permissions: [
              { menu: { permission: 'system:user:delete' } },
            ],
          },
        },
      ])

      await middleware(c, next)

      expect(next).toHaveBeenCalled()
      expect(c.json).not.toHaveBeenCalled()
    })

    it('should block if user has none of the required permissions', async () => {
      const middleware = permissionMiddleware(['system:user:update', 'system:user:delete'])
      const c = createMockContext({ userId: 'user1' })
      const next = vi.fn()

      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            permissions: [
              { menu: { permission: 'system:user:list' } },
            ],
          },
        },
      ])

      await middleware(c, next)

      expect(c.json).toHaveBeenCalledWith(
        { code: 403, message: '没有操作权限', data: null },
        403,
      )
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('permissions from multiple roles', () => {
    it('should aggregate permissions across all user roles', async () => {
      const middleware = permissionMiddleware('system:role:delete')
      const c = createMockContext({ userId: 'user1' })
      const next = vi.fn()

      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            permissions: [
              { menu: { permission: 'system:user:list' } },
            ],
          },
        },
        {
          role: {
            permissions: [
              { menu: { permission: 'system:role:delete' } },
            ],
          },
        },
      ])

      await middleware(c, next)

      expect(next).toHaveBeenCalled()
    })

    it('should skip menus with null permission', async () => {
      const middleware = permissionMiddleware('system:user:list')
      const c = createMockContext({ userId: 'user1' })
      const next = vi.fn()

      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            permissions: [
              { menu: { permission: null } },
              { menu: { permission: 'system:user:list' } },
            ],
          },
        },
      ])

      await middleware(c, next)

      expect(next).toHaveBeenCalled()
    })
  })
})
