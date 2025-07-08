import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTabs } from '../../src/composables/useTabs.js'

// Mock vue-router
const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockCurrentRoute = { value: { path: '/', fullPath: '/' } }

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    currentRoute: mockCurrentRoute,
  }),
}))

// Mock tabs store
const mockTabsStore = {
  tabs: [],
  activeTab: '/',
  cachedViews: [],
  closeTab: vi.fn(),
  closeLeftTabs: vi.fn(),
  closeRightTabs: vi.fn(),
  closeOtherTabs: vi.fn(),
  closeAllTabs: vi.fn(),
  setActiveTab: vi.fn(),
  canCloseLeft: vi.fn(),
  canCloseRight: vi.fn(),
  canCloseOthers: vi.fn(),
  canCloseAll: vi.fn(),
}

vi.mock('../../src/stores/tabs.js', () => ({
  useTabsStore: () => mockTabsStore,
}))

// Mock pinia
vi.mock('pinia', () => ({
  defineStore: vi.fn(),
  createPinia: vi.fn(),
  setActivePinia: vi.fn(),
}))

describe('useTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTabsStore.activeTab = '/'
    mockCurrentRoute.value = { path: '/', fullPath: '/' }
  })

  describe('closeCurrent', () => {
    it('should call closeTab with activeTab and push if redirect returned', () => {
      mockTabsStore.activeTab = '/users'
      mockTabsStore.closeTab.mockReturnValue('/dashboard')
      const { closeCurrent } = useTabs()
      closeCurrent()
      expect(mockTabsStore.closeTab).toHaveBeenCalledWith('/users')
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('should not push when closeTab returns null', () => {
      mockTabsStore.closeTab.mockReturnValue(null)
      const { closeCurrent } = useTabs()
      closeCurrent()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('closeTab', () => {
    it('should call store closeTab and push redirect', () => {
      mockTabsStore.closeTab.mockReturnValue('/')
      const { closeTab } = useTabs()
      closeTab('/users')
      expect(mockTabsStore.closeTab).toHaveBeenCalledWith('/users')
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  describe('closeLeft', () => {
    it('should call closeLeftTabs with given path', () => {
      mockTabsStore.activeTab = '/a'
      mockCurrentRoute.value = { path: '/a', fullPath: '/a' }
      const { closeLeft } = useTabs()
      closeLeft('/b')
      expect(mockTabsStore.closeLeftTabs).toHaveBeenCalledWith('/b')
    })

    it('should use activeTab as default', () => {
      mockTabsStore.activeTab = '/current'
      mockCurrentRoute.value = { path: '/current', fullPath: '/current' }
      const { closeLeft } = useTabs()
      closeLeft()
      expect(mockTabsStore.closeLeftTabs).toHaveBeenCalledWith('/current')
    })
  })

  describe('closeRight', () => {
    it('should call closeRightTabs', () => {
      mockTabsStore.activeTab = '/a'
      mockCurrentRoute.value = { path: '/a', fullPath: '/a' }
      const { closeRight } = useTabs()
      closeRight('/a')
      expect(mockTabsStore.closeRightTabs).toHaveBeenCalledWith('/a')
    })
  })

  describe('closeOthers', () => {
    it('should call closeOtherTabs', () => {
      mockTabsStore.activeTab = '/a'
      mockCurrentRoute.value = { path: '/a', fullPath: '/a' }
      const { closeOthers } = useTabs()
      closeOthers('/a')
      expect(mockTabsStore.closeOtherTabs).toHaveBeenCalledWith('/a')
    })

    it('should push if current route differs from target', () => {
      mockCurrentRoute.value = { path: '/other', fullPath: '/other' }
      const { closeOthers } = useTabs()
      closeOthers('/a')
      expect(mockPush).toHaveBeenCalledWith('/a')
    })
  })

  describe('closeAll', () => {
    it('should call closeAllTabs and push redirect', () => {
      mockTabsStore.closeAllTabs.mockReturnValue('/')
      const { closeAll } = useTabs()
      closeAll()
      expect(mockTabsStore.closeAllTabs).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  describe('goToTab', () => {
    it('should set active tab and push to path', () => {
      const { goToTab } = useTabs()
      goToTab('/users')
      expect(mockTabsStore.setActiveTab).toHaveBeenCalledWith('/users')
      expect(mockPush).toHaveBeenCalledWith('/users')
    })
  })

  describe('refreshCurrent', () => {
    it('should replace with redirect path', () => {
      mockCurrentRoute.value = { path: '/users', fullPath: '/users' }
      const { refreshCurrent } = useTabs()
      refreshCurrent()
      expect(mockReplace).toHaveBeenCalledWith({ path: '/redirect/users' })
    })
  })
})
