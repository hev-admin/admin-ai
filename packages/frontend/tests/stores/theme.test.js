import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useThemeStore } from '../../src/stores/theme.js'

describe('theme store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should default to light theme', () => {
      const store = useThemeStore()
      expect(store.theme).toBe('light')
    })

    it('should load theme from localStorage', () => {
      localStorage.setItem('theme', 'dark')
      setActivePinia(createPinia())
      const store = useThemeStore()
      expect(store.theme).toBe('dark')
    })

    it('should apply dark class on init when saved theme is dark', () => {
      localStorage.setItem('theme', 'dark')
      setActivePinia(createPinia())
      useThemeStore()
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should not have dark class on init when saved theme is light', () => {
      localStorage.setItem('theme', 'light')
      setActivePinia(createPinia())
      useThemeStore()
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('setTheme', () => {
    it('should set theme to dark and update classList', () => {
      const store = useThemeStore()
      store.setTheme('dark')
      expect(store.theme).toBe('dark')
      expect(localStorage.getItem('theme')).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should set theme to light and remove dark class', () => {
      const store = useThemeStore()
      store.setTheme('dark')
      store.setTheme('light')
      expect(store.theme).toBe('light')
      expect(localStorage.getItem('theme')).toBe('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('toggleTheme', () => {
    it('should toggle from light to dark', () => {
      const store = useThemeStore()
      store.toggleTheme()
      expect(store.theme).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should toggle from dark to light', () => {
      const store = useThemeStore()
      store.setTheme('dark')
      store.toggleTheme()
      expect(store.theme).toBe('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })
})
