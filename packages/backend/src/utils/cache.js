/**
 * Simple in-memory cache with TTL support
 * In production, consider using Redis for distributed caching
 */
class MemoryCache {
  constructor() {
    this.cache = new Map()
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  /**
   * Get a value from cache
   * @param {string} key
   * @returns {*} cached value or undefined
   */
  get(key) {
    const item = this.cache.get(key)
    if (!item)
      return undefined

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return undefined
    }

    return item.value
  }

  /**
   * Set a value in cache
   * @param {string} key
   * @param {*} value
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, value, ttl = 300000) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    })
  }

  /**
   * Delete a value from cache
   * @param {string} key
   */
  delete(key) {
    this.cache.delete(key)
  }

  /**
   * Delete all keys matching a pattern
   * @param {string} pattern - Pattern to match (supports * as wildcard)
   */
  deletePattern(pattern) {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear()
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get or set a value with a factory function
   * @param {string} key
   * @param {Function} factory - Async function to generate value if not cached
   * @param {number} ttl - Time to live in milliseconds
   * @returns {*} cached or newly generated value
   */
  async getOrSet(key, factory, ttl = 300000) {
    const cached = this.get(key)
    if (cached !== undefined) {
      return cached
    }

    const value = await factory()
    this.set(key, value, ttl)
    return value
  }

  /**
   * Get cache statistics
   */
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Export singleton instance
export const cache = new MemoryCache()

// Cache key generators
export const cacheKeys = {
  userMenus: userId => `user:${userId}:menus`,
  userPermissions: userId => `user:${userId}:permissions`,
  menuTree: () => 'menu:tree',
  roles: () => 'roles:all',
  settings: group => `settings:${group}`,
}

// Cache TTL constants (in milliseconds)
export const cacheTTL = {
  SHORT: 60000, // 1 minute
  MEDIUM: 300000, // 5 minutes
  LONG: 900000, // 15 minutes
  HOUR: 3600000, // 1 hour
}
