import { beforeEach, describe, expect, it, vi } from 'vitest'
import { rateLimiter } from '../../src/middleware/rateLimit.js'

// Mock the store module
vi.mock('../../src/utils/store.js', () => {
  const mockStore = {
    get: vi.fn(),
    set: vi.fn(),
  }
  return {
    getStore: () => mockStore,
    _mockStore: mockStore,
  }
})

// Import the mock store after mocking
const { _mockStore: mockStore } = await import('../../src/utils/store.js')

function createMockContext(ip = '127.0.0.1') {
  const headers = {}
  return {
    req: {
      header: vi.fn(name => (name === 'x-forwarded-for' ? ip : undefined)),
    },
    header: vi.fn((name, value) => {
      headers[name] = value
    }),
    json: vi.fn((body, status) => ({ body, status })),
    _headers: headers,
  }
}

describe('rateLimiter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic functionality', () => {
    it('should allow requests under the limit', async () => {
      const middleware = rateLimiter({ limit: 10, windowMs: 60000 })
      const c = createMockContext()
      const next = vi.fn()

      // First request - no existing data
      mockStore.get.mockResolvedValue(null)

      await middleware(c, next)

      expect(next).toHaveBeenCalled()
      expect(c.json).not.toHaveBeenCalled()
      expect(mockStore.set).toHaveBeenCalledWith(
        'ratelimit:127.0.0.1',
        expect.objectContaining({ count: 1 }),
        60000,
      )
    })

    it('should increment count for subsequent requests', async () => {
      const middleware = rateLimiter({ limit: 10, windowMs: 60000 })
      const c = createMockContext()
      const next = vi.fn()
      const now = Date.now()

      mockStore.get.mockResolvedValue({ count: 5, startTime: now })

      await middleware(c, next)

      expect(next).toHaveBeenCalled()
      expect(mockStore.set).toHaveBeenCalledWith(
        'ratelimit:127.0.0.1',
        expect.objectContaining({ count: 6 }),
        expect.any(Number),
      )
    })

    it('should block requests over the limit', async () => {
      const middleware = rateLimiter({ limit: 5, windowMs: 60000 })
      const c = createMockContext()
      const next = vi.fn()
      const now = Date.now()

      mockStore.get.mockResolvedValue({ count: 5, startTime: now })

      await middleware(c, next)

      expect(next).not.toHaveBeenCalled()
      expect(c.json).toHaveBeenCalledWith(
        { code: 429, message: '请求过于频繁，请稍后再试', data: null },
        429,
      )
    })

    it('should reset counter when window expires', async () => {
      const middleware = rateLimiter({ limit: 5, windowMs: 60000 })
      const c = createMockContext()
      const next = vi.fn()

      // Expired window (startTime was more than 60s ago)
      mockStore.get.mockResolvedValue({
        count: 100,
        startTime: Date.now() - 70000,
      })

      await middleware(c, next)

      expect(next).toHaveBeenCalled()
      expect(mockStore.set).toHaveBeenCalledWith(
        'ratelimit:127.0.0.1',
        expect.objectContaining({ count: 1 }),
        60000,
      )
    })
  })

  describe('headers', () => {
    it('should set rate limit headers', async () => {
      const middleware = rateLimiter({ limit: 100, windowMs: 60000 })
      const c = createMockContext()
      const next = vi.fn()

      mockStore.get.mockResolvedValue(null)

      await middleware(c, next)

      expect(c.header).toHaveBeenCalledWith('X-RateLimit-Limit', '100')
      expect(c.header).toHaveBeenCalledWith('X-RateLimit-Remaining', '99')
      expect(c.header).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String))
    })

    it('should show 0 remaining when over limit', async () => {
      const middleware = rateLimiter({ limit: 5, windowMs: 60000 })
      const c = createMockContext()
      const next = vi.fn()

      mockStore.get.mockResolvedValue({ count: 10, startTime: Date.now() })

      await middleware(c, next)

      expect(c.header).toHaveBeenCalledWith('X-RateLimit-Remaining', '0')
    })
  })

  describe('options', () => {
    it('should use custom message', async () => {
      const middleware = rateLimiter({
        limit: 1,
        windowMs: 60000,
        message: 'Custom rate limit message',
      })
      const c = createMockContext()
      const next = vi.fn()

      mockStore.get.mockResolvedValue({ count: 1, startTime: Date.now() })

      await middleware(c, next)

      expect(c.json).toHaveBeenCalledWith(
        { code: 429, message: 'Custom rate limit message', data: null },
        429,
      )
    })

    it('should use custom keyGenerator', async () => {
      const middleware = rateLimiter({
        limit: 100,
        windowMs: 60000,
        keyGenerator: c => `user:${c.req.header('x-user-id')}`,
      })
      const c = createMockContext()
      c.req.header = vi.fn((name) => {
        if (name === 'x-user-id')
          return 'user123'
        return undefined
      })
      const next = vi.fn()

      mockStore.get.mockResolvedValue(null)

      await middleware(c, next)

      expect(mockStore.get).toHaveBeenCalledWith('ratelimit:user:user123')
    })

    it('should use default key when x-forwarded-for not present', async () => {
      const middleware = rateLimiter({ limit: 100, windowMs: 60000 })
      const c = createMockContext(undefined)
      const next = vi.fn()

      mockStore.get.mockResolvedValue(null)

      await middleware(c, next)

      expect(mockStore.get).toHaveBeenCalledWith('ratelimit:unknown')
    })
  })
})
