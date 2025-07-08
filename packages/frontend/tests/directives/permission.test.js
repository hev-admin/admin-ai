import { beforeEach, describe, expect, it, vi } from 'vitest'
import { permission, setupPermissionDirective } from '../../src/directives/permission.js'

// Mock permission store
const mockPermissionStore = {
  hasPermission: vi.fn(),
}

vi.mock('../../src/stores/permission.js', () => ({
  usePermissionStore: () => mockPermissionStore,
}))

// Mock pinia
vi.mock('pinia', () => ({
  defineStore: vi.fn(),
  createPinia: vi.fn(),
  setActivePinia: vi.fn(),
}))

describe('permission directive', () => {
  let parentNode
  let el

  beforeEach(() => {
    vi.clearAllMocks()
    parentNode = document.createElement('div')
    el = document.createElement('button')
    parentNode.appendChild(el)
  })

  it('should keep element when user has single permission', () => {
    mockPermissionStore.hasPermission.mockReturnValue(true)
    permission.mounted(el, { value: 'user:create' })
    expect(parentNode.contains(el)).toBe(true)
  })

  it('should remove element when user lacks single permission', () => {
    mockPermissionStore.hasPermission.mockReturnValue(false)
    permission.mounted(el, { value: 'user:delete' })
    expect(parentNode.contains(el)).toBe(false)
  })

  it('should keep element when user has any permission from array', () => {
    mockPermissionStore.hasPermission.mockImplementation(p => p === 'user:read')
    permission.mounted(el, { value: ['user:read', 'user:write'] })
    expect(parentNode.contains(el)).toBe(true)
  })

  it('should remove element when user has none of array permissions', () => {
    mockPermissionStore.hasPermission.mockReturnValue(false)
    permission.mounted(el, { value: ['user:delete', 'user:admin'] })
    expect(parentNode.contains(el)).toBe(false)
  })

  it('should not remove element when value is falsy', () => {
    permission.mounted(el, { value: null })
    expect(parentNode.contains(el)).toBe(true)
  })

  describe('setupPermissionDirective', () => {
    it('should register directive on app', () => {
      const mockApp = { directive: vi.fn() }
      setupPermissionDirective(mockApp)
      expect(mockApp.directive).toHaveBeenCalledWith('permission', permission)
    })
  })
})
