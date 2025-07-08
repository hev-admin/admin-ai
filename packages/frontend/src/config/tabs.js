/**
 * TabsView 配置
 */
export const tabsConfig = {
  // 最大 tab 数量，0 表示不限制
  maxTabs: 0,

  // 固定的 tabs（不可关闭）
  affixTabs: [
    {
      path: '/',
      name: 'Dashboard',
      title: '首页',
      icon: 'i-lucide-home',
    },
  ],

  // 是否持久化到 localStorage
  persistence: true,

  // localStorage 存储的 key
  storageKey: 'admin-tabs-view',
}
