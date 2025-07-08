import jwt from 'jsonwebtoken'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authMiddleware } from '../../src/middleware/auth.js'

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}))

describe('authMiddleware', () => {
  let mockContext
  let mockNext

  beforeEach(() => {
    vi.clearAllMocks()
    mockNext = vi.fn()
    mockContext = {
      req: {
        header: vi.fn(),
      },
      json: vi.fn().mockReturnThis(),
      set: vi.fn(),
    }
  })

  it('should return 401 when no Authorization header', async () => {
    mockContext.req.header.mockReturnValue(null)

    const middleware = authMiddleware()
    await middleware(mockContext, mockNext)

    expect(mockContext.json).toHaveBeenCalledWith(
      { code: 401, message: '未授权访问', data: null },
      401,
    )
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('should return 401 when Authorization header does not start with Bearer', async () => {
    mockContext.req.header.mockReturnValue('Basic token123')

    const middleware = authMiddleware()
    await middleware(mockContext, mockNext)

    expect(mockContext.json).toHaveBeenCalledWith(
      { code: 401, message: '未授权访问', data: null },
      401,
    )
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('should return 401 when token is invalid', async () => {
    mockContext.req.header.mockReturnValue('Bearer invalid-token')
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token')
    })

    const middleware = authMiddleware()
    await middleware(mockContext, mockNext)

    expect(mockContext.json).toHaveBeenCalledWith(
      { code: 401, message: 'Token 无效或已过期', data: null },
      401,
    )
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('should set user and call next when token is valid', async () => {
    const decodedToken = { userId: '123', username: 'testuser' }
    mockContext.req.header.mockReturnValue('Bearer valid-token')
    jwt.verify.mockReturnValue(decodedToken)

    const middleware = authMiddleware()
    await middleware(mockContext, mockNext)

    expect(mockContext.set).toHaveBeenCalledWith('user', decodedToken)
    expect(mockNext).toHaveBeenCalled()
  })

  it('should extract token correctly from Bearer header', async () => {
    const token = 'my-jwt-token-123'
    mockContext.req.header.mockReturnValue(`Bearer ${token}`)
    jwt.verify.mockReturnValue({ userId: '1' })

    const middleware = authMiddleware()
    await middleware(mockContext, mockNext)

    expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String))
  })
})
