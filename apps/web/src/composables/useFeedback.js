import { createDiscreteApi } from 'naive-ui'
import { computed } from 'vue'
import { useTheme } from '@/theme'

let api = null

/**
 * 统一反馈门面（REQUIREMENTS §9.1）：message / notification / dialog / loadingBar
 * 一律经本函数调用，全项目禁止直接使用 Naive UI 的 discrete API——
 * 本文件是唯一实现方，切换 UI 库时仅重写此处。
 */
export function useFeedback() {
  if (!api) {
    const { naiveTheme, naiveThemeOverrides } = useTheme()
    const configProviderProps = computed(() => ({
      theme: naiveTheme.value,
      themeOverrides: naiveThemeOverrides.value,
    }))
    api = createDiscreteApi(['message', 'notification', 'dialog', 'loadingBar'], { configProviderProps })
  }
  const { message, notification, dialog, loadingBar } = api
  return { message, notification, dialog, loadingBar }
}
