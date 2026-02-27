import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let cache

describe('memoryCache', () => {
  beforeEach(async () => {
    vi.useFakeTimers()

    // Dynamically import to get a fresh module with the MemoryCache class
    // We'll work with the exported singleton since the class is not exported directly
    vi.resetModules()
    const mod = await import('../../src/utils/cache.js')
    cache = mod.cache
    // Clear any existing entries
    cache.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('get', () => {
    it('should return undefined for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeUndefined()
    })

    it('should return stored value', () => {
      cache.set('key', 'value')
      expect(cache.get('key')).toBe('value')
    })

    it('should return undefined for expired key', () => {
      cache.set('key', 'value', 1000) // 1 second TTL
      vi.advanceTimersByTime(1500) // Advance past TTL

      expect(cache.get('key')).toBeUndefined()
    })

    it('should return value before TTL expires', () => {
      cache.set('key', 'value', 5000)
      vi.advanceTimersByTime(3000) // Before TTL

      expect(cache.get('key')).toBe('value')
    })

    it('should handle various value types', () => {
      cache.set('string', 'hello')
      cache.set('number', 42)
      cache.set('object', { a: 1 })
      cache.set('array', [1, 2, 3])
      cache.set('boolean', true)

      expect(cache.get('string')).toBe('hello')
      expect(cache.get('number')).toBe(42)
      expect(cache.get('object')).toEqual({ a: 1 })
      expect(cache.get('array')).toEqual([1, 2, 3])
      expect(cache.get('boolean')).toBe(true)
    })
  })

  describe('set', () => {
    it('should store a value with default TTL', () => {
      cache.set('key', 'value')
      expect(cache.get('key')).toBe('value')
    })

    it('should overwrite existing value', () => {
      cache.set('key', 'value1')
      cache.set('key', 'value2')
      expect(cache.get('key')).toBe('value2')
    })

    it('should store value with custom TTL', () => {
      cache.set('key', 'value', 2000)

      vi.advanceTimersByTime(1500)
      expect(cache.get('key')).toBe('value')

      vi.advanceTimersByTime(1000)
      expect(cache.get('key')).toBeUndefined()
    })
  })

  describe('delete', () => {
    it('should delete a stored key', () => {
      cache.set('key', 'value')
      cache.delete('key')
      expect(cache.get('key')).toBeUndefined()
    })

    it('should not throw when deleting non-existent key', () => {
      expect(() => cache.delete('nonexistent')).not.toThrow()
    })
  })

  describe('deletePattern', () => {
    it('should delete keys matching a wildcard pattern', () => {
      cache.set('user:1:menus', 'menus1')
      cache.set('user:2:menus', 'menus2')
      cache.set('user:1:permissions', 'perms1')
      cache.set('role:1', 'role')

      cache.deletePattern('user:*:menus')

      expect(cache.get('user:1:menus')).toBeUndefined()
      expect(cache.get('user:2:menus')).toBeUndefined()
      expect(cache.get('user:1:permissions')).toBe('perms1')
      expect(cache.get('role:1')).toBe('role')
    })

    it('should delete all keys matching broad pattern', () => {
      cache.set('menu:tree', 'tree')
      cache.set('menu:list', 'list')
      cache.set('user:1', 'user')

      cache.deletePattern('menu:*')

      expect(cache.get('menu:tree')).toBeUndefined()
      expect(cache.get('menu:list')).toBeUndefined()
      expect(cache.get('user:1')).toBe('user')
    })

    it('should handle pattern with no matches', () => {
      cache.set('key', 'value')
      expect(() => cache.deletePattern('nomatch:*')).not.toThrow()
      expect(cache.get('key')).toBe('value')
    })
  })

  describe('getOrSet', () => {
    it('should return cached value when available', async () => {
      cache.set('key', 'cached')
      const factory = vi.fn().mockResolvedValue('fresh')

      const result = await cache.getOrSet('key', factory)

      expect(result).toBe('cached')
      expect(factory).not.toHaveBeenCalled()
    })

    it('should call factory and cache result when not cached', async () => {
      const factory = vi.fn().mockResolvedValue('fresh')

      const result = await cache.getOrSet('key', factory, 5000)

      expect(result).toBe('fresh')
      expect(factory).toHaveBeenCalled()
      expect(cache.get('key')).toBe('fresh')
    })

    it('should call factory when cached value has expired', async () => {
      cache.set('key', 'old', 1000)
      vi.advanceTimersByTime(1500)

      const factory = vi.fn().mockResolvedValue('new')
      const result = await cache.getOrSet('key', factory, 5000)

      expect(result).toBe('new')
      expect(factory).toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      cache.set('expired1', 'value1', 1000)
      cache.set('expired2', 'value2', 2000)
      cache.set('alive', 'value3', 10000)

      vi.advanceTimersByTime(3000)
      cache.cleanup()

      expect(cache.get('expired1')).toBeUndefined()
      expect(cache.get('expired2')).toBeUndefined()
      expect(cache.get('alive')).toBe('value3')
    })

    it('should not remove unexpired entries', () => {
      cache.set('key1', 'value1', 5000)
      cache.set('key2', 'value2', 10000)

      vi.advanceTimersByTime(1000)
      cache.cleanup()

      expect(cache.get('key1')).toBe('value1')
      expect(cache.get('key2')).toBe('value2')
    })
  })

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')

      cache.clear()

      expect(cache.get('key1')).toBeUndefined()
      expect(cache.get('key2')).toBeUndefined()
      expect(cache.get('key3')).toBeUndefined()
    })
  })

  describe('stats', () => {
    it('should return cache size and keys', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      const stats = cache.stats()

      expect(stats.size).toBe(2)
      expect(stats.keys).toContain('key1')
      expect(stats.keys).toContain('key2')
    })

    it('should return empty stats when cache is empty', () => {
      const stats = cache.stats()

      expect(stats.size).toBe(0)
      expect(stats.keys).toEqual([])
    })
  })
})
