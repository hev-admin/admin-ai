import i18n from '@/i18n/index.js'

export const useLocaleStore = defineStore('locale', () => {
  const locale = ref(localStorage.getItem('locale') || 'zh-CN')

  const availableLocales = [
    { label: '简体中文', value: 'zh-CN' },
    { label: 'English', value: 'en' },
  ]

  function setLocale(newLocale) {
    locale.value = newLocale
    localStorage.setItem('locale', newLocale)
    i18n.global.locale.value = newLocale
    document.documentElement.lang = newLocale === 'zh-CN' ? 'zh-CN' : 'en'
  }

  function toggleLocale() {
    const newLocale = locale.value === 'zh-CN' ? 'en' : 'zh-CN'
    setLocale(newLocale)
  }

  return {
    locale,
    availableLocales,
    setLocale,
    toggleLocale,
  }
})
