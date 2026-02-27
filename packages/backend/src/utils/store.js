/**
 * Storage adapter interface for rate limiting, token blacklist, and login attempts.
 * Default: in-memory Map-based storage.
 * For production, swap with a Redis-based adapter.
 */

class MemoryStoreAdapter {
  constructor() {
    this.store = new Map()
    this._cleanupInterval = setInterval(() => this.cleanup(), 60000)
  }

  async get(key) {
    const item = this.store.get(key)
    if (!item)
      return null
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key)
      return null
    }
    return item.value
  }

  async set(key, value, ttlMs) {
    this.store.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    })
  }

  async delete(key) {
    this.store.delete(key)
  }

  async deleteByPrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
      }
    }
  }

  async has(key) {
    const item = await this.get(key)
    return item !== null
  }

  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.store.delete(key)
      }
    }
  }

  destroy() {
    clearInterval(this._cleanupInterval)
    this.store.clear()
  }
}

// Singleton instance — replace with RedisStoreAdapter for production
let storeInstance = null

export function getStore() {
  if (!storeInstance) {
    storeInstance = new MemoryStoreAdapter()
  }
  return storeInstance
}

export function setStore(adapter) {
  if (storeInstance) {
    storeInstance.destroy()
  }
  storeInstance = adapter
}

export { MemoryStoreAdapter }
