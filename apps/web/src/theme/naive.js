import { darkTheme } from 'naive-ui'
import { darken, lighten } from './color.js'
import { themeTokens } from './tokens.js'

// Naive UI 主题映射函数（REQUIREMENTS §8 / §9）：
// 切换 UI 库时仅重写本文件（antdv：ConfigProvider theme token；element-plus：CSS 变量覆盖）。

export function toNaiveTheme({ isDark }) {
  return isDark ? darkTheme : null
}

export function toNaiveThemeOverrides({ primaryColor }) {
  return {
    common: {
      primaryColor,
      primaryColorHover: lighten(primaryColor, 0.12),
      primaryColorPressed: darken(primaryColor, 0.12),
      primaryColorSuppl: lighten(primaryColor, 0.12),
      borderRadius: themeTokens.borderRadius,
    },
  }
}
