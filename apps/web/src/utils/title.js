import { translate } from '@/locales'

/**
 * 文档标题：路由 meta.title 为 i18n key（menu.* / login.title 等），未登记的字面值原样显示。
 * 守卫 afterEach 与语言切换时（App.vue watch locale）各调用一次。
 */
export function updateDocumentTitle(routeMeta) {
  const key = routeMeta?.title
  document.title = key ? `${translate(key)} - admin-ai` : 'admin-ai'
}
