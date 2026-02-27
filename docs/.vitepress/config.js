import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Admin AI',
  description: '通用中后台开发框架',
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/' },
      { text: 'API', link: '/api/' },
    ],
    sidebar: {
      '/guide/': [
        { text: '介绍', link: '/guide/' },
        { text: '快速开始', link: '/guide/getting-started' },
        { text: '架构设计', link: '/guide/architecture' },
        { text: '安全机制', link: '/guide/security' },
        { text: '部署指南', link: '/guide/deployment' },
        { text: '开发规范', link: '/guide/development' },
        { text: '测试指南', link: '/guide/testing' },
        { text: '更新日志', link: '/guide/changelog' },
      ],
      '/api/': [
        { text: 'API 文档', link: '/api/' },
      ],
    },
  },
})
