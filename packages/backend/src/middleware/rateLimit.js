// In-memory rate limiter for API endpoints
const requestCounts = new Map()

// Clean up old entries every minute
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.startTime > 60000) {
      requestCounts.delete(key)
    }
  }
}, 60000)

/**
 * Create a rate limiting middleware
 * @param {object} options
 * @param {number} options.limit - Maximum number of requests
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {string} options.keyGenerator - Function to generate unique key
 */
export function rateLimiter(options = {}) {
  const {
    limit = 100,
    windowMs = 60000, // 1 minute
    message = '请求过于频繁，请稍后再试',
    keyGenerator = c => c.req.header('x-forwarded-for') || 'unknown',
  } = options

  return async (c, next) => {
    const key = typeof keyGenerator === 'function' ? keyGenerator(c) : keyGenerator
    const now = Date.now()

    let data = requestCounts.get(key)

    if (!data || now - data.startTime > windowMs) {
      data = { count: 1, startTime: now }
      requestCounts.set(key, data)
    }
    else {
      data.count++
    }

    // Set rate limit headers
    c.header('X-RateLimit-Limit', String(limit))
    c.header('X-RateLimit-Remaining', String(Math.max(0, limit - data.count)))
    c.header('X-RateLimit-Reset', String(Math.ceil((data.startTime + windowMs) / 1000)))

    if (data.count > limit) {
      return c.json(
        { code: 429, message, data: null },
        429,
      )
    }

    await next()
  }
}

/**
 * Strict rate limiter for sensitive endpoints (login, register)
 * 5 requests per minute per IP
 */
export function authRateLimiter() {
  return rateLimiter({
    limit: 5,
    windowMs: 60000,
    message: '登录尝试过于频繁，请1分钟后再试',
  })
}

/**
 * Global API rate limiter
 * 100 requests per minute per IP
 */
export function globalRateLimiter() {
  return rateLimiter({
    limit: 100,
    windowMs: 60000,
  })
}
