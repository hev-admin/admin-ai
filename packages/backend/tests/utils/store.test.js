import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryStoreAdapter } from '../../src/utils/store.js'

describe('memoryStoreAdapter', () => {
  let store

  beforeEach(() => {
    vi.useFakeTimers()
    store = new MemoryStoreAdapter()
  })

  afterEach(() => {
    store.destroy()
    vi.useRealTimers()
  })

  describe('get', () => {
    it('should return null for non-existent key', async () => {
      const result = await store.get('nonexistent')
      expect(result).toBeNull()
    })

    it('should return stored value', async () => {
      await store.set('key', 'value')
      const result = await store.get('key')
      expect(result).toBe('value')
    })

    it('should return null for expired key', async () => {
      await store.set('key', 'value', 1000)
      vi.advanceTimersByTime(1500)

      const result = await store.get('key')
      expect(result).toBeNull()
    })

    it('should return value before TTL expires', async () => {
      await store.set('key', 'value', 5000)
      vi.advanceTimersByTime(3000)

      const result = await store.get('key')
      expect(result).toBe('value')
    })

    it('should return value when no TTL is set', async () => {
      await store.set('key', 'value')
      vi.advanceTimersByTime(999999)

      const result = await store.get('key')
      expect(result).toBe('value')
    })

    it('should handle various value types', async () => {
      await store.set('string', 'hello')
      await store.set('number', 42)
      await store.set('object', { a: 1 })
      await store.set('array', [1, 2, 3])

      expect(await store.get('string')).toBe('hello')
      expect(await store.get('number')).toBe(42)
      expect(await store.get('object')).toEqual({ a: 1 })
      expect(await store.get('array')).toEqual([1, 2, 3])
    })
  })

  describe('set', () => {
    it('should store a value without TTL', async () => {
      await store.set('key', 'value')
      expect(await store.get('key')).toBe('value')
    })

    it('should store a value with TTL', async () => {
      await store.set('key', 'value', 3000)

      vi.advanceTimersByTime(2000)
      expect(await store.get('key')).toBe('value')

      vi.advanceTimersByTime(2000)
      expect(await store.get('key')).toBeNull()
    })

    it('should overwrite existing value', async () => {
      await store.set('key', 'value1')
      await store.set('key', 'value2')
      expect(await store.get('key')).toBe('value2')
    })
  })

  describe('delete', () => {
    it('should delete an existing key', async () => {
      await store.set('key', 'value')
      await store.delete('key')
      expect(await store.get('key')).toBeNull()
    })

    it('should not throw when deleting non-existent key', async () => {
      await expect(store.delete('nonexistent')).resolves.not.toThrow()
    })
  })

  describe('deleteByPrefix', () => {
    it('should delete all keys with matching prefix', async () => {
      await store.set('ratelimit:127.0.0.1', 'data1')
      await store.set('ratelimit:192.168.1.1', 'data2')
      await store.set('token:abc', 'token1')

      await store.deleteByPrefix('ratelimit:')

      expect(await store.get('ratelimit:127.0.0.1')).toBeNull()
      expect(await store.get('ratelimit:192.168.1.1')).toBeNull()
      expect(await store.get('token:abc')).toBe('token1')
    })

    it('should not delete keys without matching prefix', async () => {
      await store.set('key1', 'value1')
      await store.set('key2', 'value2')

      await store.deleteByPrefix('other:')

      expect(await store.get('key1')).toBe('value1')
      expect(await store.get('key2')).toBe('value2')
    })
  })

  describe('has', () => {
    it('should return true for existing key', async () => {
      await store.set('key', 'value')
      expect(await store.has('key')).toBe(true)
    })

    it('should return false for non-existent key', async () => {
      expect(await store.has('nonexistent')).toBe(false)
    })

    it('should return false for expired key', async () => {
      await store.set('key', 'value', 1000)
      vi.advanceTimersByTime(1500)

      expect(await store.has('key')).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      await store.set('expired1', 'value1', 1000)
      await store.set('expired2', 'value2', 2000)
      await store.set('alive', 'value3', 10000)

      vi.advanceTimersByTime(3000)
      store.cleanup()

      expect(await store.get('expired1')).toBeNull()
      expect(await store.get('expired2')).toBeNull()
      expect(await store.get('alive')).toBe('value3')
    })

    it('should not remove entries without TTL', async () => {
      await store.set('permanent', 'value')

      vi.advanceTimersByTime(999999)
      store.cleanup()

      expect(await store.get('permanent')).toBe('value')
    })

    it('should not remove unexpired entries', async () => {
      await store.set('key1', 'value1', 5000)
      await store.set('key2', 'value2', 10000)

      vi.advanceTimersByTime(1000)
      store.cleanup()

      expect(await store.get('key1')).toBe('value1')
      expect(await store.get('key2')).toBe('value2')
    })
  })

  describe('destroy', () => {
    it('should clear all data', async () => {
      await store.set('key1', 'value1')
      await store.set('key2', 'value2')

      store.destroy()

      expect(await store.get('key1')).toBeNull()
      expect(await store.get('key2')).toBeNull()
    })
  })
})
