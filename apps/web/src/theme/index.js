import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { toNaiveTheme, toNaiveThemeOverrides } from './naive.js'

export * from './tokens.js'

/** 从 app store 读取主题状态并映射为当前 UI 库（Naive UI）的主题配置 */
export function useTheme() {
  const appStore = useAppStore()
  const isDark = computed(() => appStore.isDark)
  const naiveTheme = computed(() => toNaiveTheme({ isDark: appStore.isDark }))
  const naiveThemeOverrides = computed(() => toNaiveThemeOverrides({ primaryColor: appStore.primaryColor }))
  return { isDark, naiveTheme, naiveThemeOverrides }
}
