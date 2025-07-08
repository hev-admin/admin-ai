import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTabsStore } from '../../src/stores/tabs.js'

// Mock tabsConfig
vi.mock('../../src/config/tabs.js', () => ({
  tabsConfig: {
    maxTabs: 0,
    affixTabs: [
      { path: '/', name: 'Dashboard', title: '首页', icon: 'i-lucide-home' },
    ],
    persistence: false,
    storageKey: 'admin-tabs-view',
  },
}))

function createRoute(path, name, meta = {}) {
  return { path, name: name || '', meta }
}

describe('tabs store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have the affix tab by default', () => {
      const store = useTabsStore()
      expect(store.tabs).toHaveLength(1)
      expect(store.tabs[0].path).toBe('/')
      expect(store.tabs[0].affix).toBe(true)
    })

    it('should have activeTab set to affix tab path', () => {
      const store = useTabsStore()
      expect(store.activeTab).toBe('/')
    })
  })

  describe('addTab', () => {
    it('should add a new tab', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/users', 'Users', { title: '用户管理' }))
      expect(store.tabs).toHaveLength(2)
      expect(store.tabs[1].path).toBe('/users')
    })

    it('should set activeTab to the new tab path', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/users', 'Users'))
      expect(store.activeTab).toBe('/users')
    })

    it('should not duplicate an existing tab', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/users', 'Users'))
      store.addTab(createRoute('/users', 'Users'))
      expect(store.tabs).toHaveLength(2)
    })

    it('should switch to existing tab without adding', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/users', 'Users'))
      store.addTab(createRoute('/roles', 'Roles'))
      store.addTab(createRoute('/users', 'Users'))
      expect(store.activeTab).toBe('/users')
      expect(store.tabs).toHaveLength(3)
    })

    it('should use route meta title', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/users', 'Users', { title: '用户管理', icon: 'i-lucide-users' }))
      expect(store.tabs[1].title).toBe('用户管理')
      expect(store.tabs[1].icon).toBe('i-lucide-users')
    })
  })

  describe('closeTab', () => {
    it('should close a non-affix tab', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/users', 'Users'))
      store.closeTab('/users')
      expect(store.tabs).toHaveLength(1)
    })

    it('should not close an affix tab', () => {
      const store = useTabsStore()
      const result = store.closeTab('/')
      expect(result).toBeNull()
      expect(store.tabs).toHaveLength(1)
    })

    it('should return null when closing a non-active tab', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/users', 'Users'))
      store.addTab(createRoute('/roles', 'Roles'))
      const result = store.closeTab('/users')
      expect(result).toBeNull()
    })

    it('should return redirect path when closing active tab', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/users', 'Users'))
      const result = store.closeTab('/users')
      expect(result).toBe('/')
    })

    it('should return null for non-existent tab', () => {
      const store = useTabsStore()
      const result = store.closeTab('/nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('closeLeftTabs', () => {
    it('should close non-affix tabs to the left', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/a', 'A'))
      store.addTab(createRoute('/b', 'B'))
      store.addTab(createRoute('/c', 'C'))
      store.closeLeftTabs('/c')
      // affix tab + /c remain, /a and /b closed
      expect(store.tabs.map(t => t.path)).toEqual(['/', '/c'])
    })

    it('should keep affix tabs on the left', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/a', 'A'))
      store.closeLeftTabs('/a')
      expect(store.tabs.map(t => t.path)).toEqual(['/', '/a'])
    })

    it('should update activeTab if it was closed', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/a', 'A'))
      store.addTab(createRoute('/b', 'B'))
      store.setActiveTab('/a')
      store.closeLeftTabs('/b')
      expect(store.activeTab).toBe('/b')
    })
  })

  describe('closeRightTabs', () => {
    it('should close non-affix tabs to the right', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/a', 'A'))
      store.addTab(createRoute('/b', 'B'))
      store.addTab(createRoute('/c', 'C'))
      store.closeRightTabs('/a')
      expect(store.tabs.map(t => t.path)).toEqual(['/', '/a'])
    })

    it('should update activeTab if it was closed', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/a', 'A'))
      store.addTab(createRoute('/b', 'B'))
      store.setActiveTab('/b')
      store.closeRightTabs('/a')
      expect(store.activeTab).toBe('/a')
    })
  })

  describe('closeOtherTabs', () => {
    it('should keep only target and affix tabs', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/a', 'A'))
      store.addTab(createRoute('/b', 'B'))
      store.addTab(createRoute('/c', 'C'))
      store.closeOtherTabs('/b')
      expect(store.tabs.map(t => t.path)).toEqual(['/', '/b'])
    })

    it('should set activeTab to target', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/a', 'A'))
      store.addTab(createRoute('/b', 'B'))
      store.closeOtherTabs('/a')
      expect(store.activeTab).toBe('/a')
    })
  })

  describe('closeAllTabs', () => {
    it('should keep only affix tabs', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/a', 'A'))
      store.addTab(createRoute('/b', 'B'))
      store.closeAllTabs()
      expect(store.tabs).toHaveLength(1)
      expect(store.tabs[0].path).toBe('/')
    })

    it('should return affix tab path', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/a', 'A'))
      const result = store.closeAllTabs()
      expect(result).toBe('/')
    })
  })

  describe('setActiveTab', () => {
    it('should set activeTab when tab exists', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/a', 'A'))
      store.setActiveTab('/')
      expect(store.activeTab).toBe('/')
    })

    it('should not change activeTab when tab does not exist', () => {
      const store = useTabsStore()
      store.setActiveTab('/nonexistent')
      expect(store.activeTab).toBe('/')
    })
  })

  describe('cachedViews', () => {
    it('should return names of tabs with keepAlive', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/a', 'A', { keepAlive: true }))
      store.addTab(createRoute('/b', 'B', { keepAlive: false }))
      expect(store.cachedViews).toContain('Dashboard')
      expect(store.cachedViews).toContain('A')
      expect(store.cachedViews).not.toContain('B')
    })
  })

  describe('canClose helpers', () => {
    it('canCloseLeft returns false when no non-affix tabs on left', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/a', 'A'))
      expect(store.canCloseLeft('/a')).toBe(false)
    })

    it('canCloseLeft returns true when non-affix tabs exist on left', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/a', 'A'))
      store.addTab(createRoute('/b', 'B'))
      expect(store.canCloseLeft('/b')).toBe(true)
    })

    it('canCloseRight returns false when no tabs on right', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/a', 'A'))
      expect(store.canCloseRight('/a')).toBe(false)
    })

    it('canCloseRight returns true when non-affix tabs exist on right', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/a', 'A'))
      store.addTab(createRoute('/b', 'B'))
      expect(store.canCloseRight('/a')).toBe(true)
    })

    it('canCloseOthers returns false when only affix and self', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/a', 'A'))
      store.closeOtherTabs('/a')
      expect(store.canCloseOthers('/a')).toBe(false)
    })

    it('canCloseOthers returns true when other non-affix tabs exist', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/a', 'A'))
      store.addTab(createRoute('/b', 'B'))
      expect(store.canCloseOthers('/a')).toBe(true)
    })

    it('canCloseAll returns false when only affix tabs remain', () => {
      const store = useTabsStore()
      expect(store.canCloseAll()).toBe(false)
    })

    it('canCloseAll returns true when non-affix tabs exist', () => {
      const store = useTabsStore()
      store.addTab(createRoute('/a', 'A'))
      expect(store.canCloseAll()).toBe(true)
    })
  })
})
