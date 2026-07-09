import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { defaultPrimaryColor } from '@/theme/tokens'

/**
 * 应用级 UI 状态（REQUIREMENTS §11）：侧边栏、主题模式、主题色、语言。
 * 主题模式三态（M3 #21）：light | dark | auto（auto 经 matchMedia 跟随系统），
 * isDark 为派生值，消费点（App.vue / 图表）无需感知模式语义。
 */
export const useAppStore = defineStore('app', () => {
  const collapsed = ref(false)
  const themeMode = ref('light')
  const primaryColor = ref(defaultPrimaryColor)
  const locale = ref('zh-CN')

  // 跟随系统配色：SPA 单例 store，监听器随页面生命周期存续，无需卸载
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const systemDark = ref(media.matches)
  media.addEventListener('change', (event) => {
    systemDark.value = event.matches
  })

  const isDark = computed(() => (themeMode.value === 'auto' ? systemDark.value : themeMode.value === 'dark'))

  function toggleCollapsed() {
    collapsed.value = !collapsed.value
  }

  function setThemeMode(mode) {
    themeMode.value = mode
  }

  function setPrimaryColor(color) {
    primaryColor.value = color
  }

  function setLocale(value) {
    locale.value = value
  }

  return { collapsed, themeMode, systemDark, primaryColor, locale, isDark, toggleCollapsed, setThemeMode, setPrimaryColor, setLocale }
}, {
  // systemDark 为环境态不持久化（M3 决策点 6）
  persist: { pick: ['collapsed', 'themeMode', 'primaryColor', 'locale'] },
})
