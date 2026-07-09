import { defineConfig } from 'vitepress'

// VitePress 站点配置（REQUIREMENTS §2.4 / §12，M5 #28）：默认主题、中文为主、
// 内建本地搜索（minisearch，零额外依赖）。物理文件名用英文 slug（URL 友好、避免
// 中文路径百分号编码），标题与导航用中文——M5 决策点 1 / 3。

export default defineConfig({
  lang: 'zh-CN',
  title: 'admin-ai',
  description: '基于 pnpm monorepo 的通用后台管理模板：Vue 3 + Hono + Prisma / MongoDB',
  lastUpdated: true,

  // 本地开发地址（localhost:5173/3000/5174）是文档的有意引用，不参与死链检查；
  // 其余站内链接仍在 build 时校验
  ignoreDeadLinks: [/^https?:\/\/localhost/],

  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'API 参考', link: '/api/', activeMatch: '/api/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '架构说明', link: '/guide/architecture' },
            { text: '前端指南', link: '/guide/frontend' },
            { text: '后端指南', link: '/guide/backend' },
            { text: '部署指南', link: '/guide/deployment' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '接口约定与全量参考', link: '/api/' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/hev-admin/admin-ai' },
    ],

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '未找到相关结果',
            resetButtonTitle: '清除查询条件',
            displayDetails: '显示详细列表',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },

    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新' },
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到亮色模式',
    darkModeSwitchTitle: '切换到暗色模式',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
  },
})
