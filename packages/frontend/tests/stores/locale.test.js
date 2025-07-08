import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useLocaleStore } from '../../src/stores/locale.js'

// Mock i18n module
vi.mock('../../src/i18n/index.js', () => ({
  default: {
    global: {
      locale: { value: 'zh-CN' },
    },
  },
}))

describe('locale store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should default to zh-CN locale', () => {
      const store = useLocaleStore()
      expect(store.locale).toBe('zh-CN')
    })

    it('should load locale from localStorage', () => {
      localStorage.setItem('locale', 'en')
      setActivePinia(createPinia())
      const store = useLocaleStore()
      expect(store.locale).toBe('en')
    })

    it('should expose available locales', () => {
      const store = useLocaleStore()
      expect(store.availableLocales).toEqual([
        { label: '简体中文', value: 'zh-CN' },
        { label: 'English', value: 'en' },
      ])
    })
  })

  describe('setLocale', () => {
    it('should update locale value', () => {
      const store = useLocaleStore()
      store.setLocale('en')
      expect(store.locale).toBe('en')
    })

    it('should save locale to localStorage', () => {
      const store = useLocaleStore()
      store.setLocale('en')
      expect(localStorage.getItem('locale')).toBe('en')
    })

    it('should set document lang to en', () => {
      const store = useLocaleStore()
      store.setLocale('en')
      expect(document.documentElement.lang).toBe('en')
    })

    it('should set document lang to zh-CN', () => {
      const store = useLocaleStore()
      store.setLocale('zh-CN')
      expect(document.documentElement.lang).toBe('zh-CN')
    })
  })

  describe('toggleLocale', () => {
    it('should toggle from zh-CN to en', () => {
      const store = useLocaleStore()
      store.toggleLocale()
      expect(store.locale).toBe('en')
    })

    it('should toggle from en to zh-CN', () => {
      const store = useLocaleStore()
      store.setLocale('en')
      store.toggleLocale()
      expect(store.locale).toBe('zh-CN')
    })
  })
})
