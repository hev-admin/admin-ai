import { createI18n } from 'vue-i18n'
import enUS from './en-US/index.js'
import zhCN from './zh-CN/index.js'

/**
 * i18n 实例（REQUIREMENTS §10）：默认中文，支持中 / 英切换。
 * 语言持久化在 app store（locale 字段），App.vue 挂载时经 applyLocale 接线；
 * 组件库 locale 映射见同目录 naive.js。
 *
 * 语言包为「平铺 key」形态：'menu.system'（目录标题）与 'menu.system.users'（子菜单标题）
 * 需共存，嵌套对象无法同时表达，故自定义 messageResolver 按整串 key 查找。
 * 新增语言包必须保持平铺，不要写嵌套对象。
 */

export const DEFAULT_LOCALE = 'zh-CN'

/** 支持的语言清单（语言切换器数据源；label 用各自语言显示，不进语言包） */
export const SUPPORTED_LOCALES = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
]

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: { 'zh-CN': zhCN, 'en-US': enUS },
  messageResolver: (messages, key) => messages[key] ?? null,
  missingWarn: false,
  fallbackWarn: false,
})

/** 组件外使用（路由守卫、工具函数）：等价组件内 useI18n().t */
export function translate(key, ...args) {
  return i18n.global.t(key, ...args)
}

/** 应用语言到 i18n 实例（app store 的 locale 为持久化的单一来源，App.vue 中 watch 接线） */
export function applyLocale(locale) {
  const supported = SUPPORTED_LOCALES.some(item => item.value === locale)
  i18n.global.locale.value = supported ? locale : DEFAULT_LOCALE
  document.documentElement.setAttribute('lang', i18n.global.locale.value)
}
