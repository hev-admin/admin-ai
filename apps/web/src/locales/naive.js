import { dateEnUS, dateZhCN, enUS, zhCN } from 'naive-ui'

// 组件库 locale 映射（REQUIREMENTS §10）：随语言联动的 UI 库配置收敛在本文件，
// 切换 UI 库时仅重写此处（对齐 theme/naive.js 的先例），App.vue 的 NConfigProvider 消费。
const NAIVE_LOCALES = {
  'zh-CN': { locale: zhCN, dateLocale: dateZhCN },
  'en-US': { locale: enUS, dateLocale: dateEnUS },
}

export function toNaiveLocale(locale) {
  return NAIVE_LOCALES[locale] ?? NAIVE_LOCALES['zh-CN']
}
