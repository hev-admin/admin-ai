---
layout: home

hero:
  name: admin-ai
  text: 通用后台管理模板
  tagline: pnpm monorepo · Vue 3 + Naive UI 前端 · Hono 后端 · Prisma / MongoDB 双驱动 · 全仓库 ESM 纯 JavaScript
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 架构说明
      link: /guide/architecture
    - theme: alt
      text: API 参考
      link: /api/

features:
  - icon: 🔐
    title: 完整 RBAC 权限
    details: 用户—角色—权限三层模型，动态路由 + 侧边栏菜单 + v-permission 按钮级指令，权限码前后端双重校验。
  - icon: 🗄️
    title: 双数据驱动
    details: Prisma（SQLite / PostgreSQL / MySQL）与 MongoDB 官方驱动实现同一套 repository 契约，DB_DRIVER 环境变量启动时切换，业务代码零感知。
  - icon: 🧩
    title: UI 组件库可切换
    details: useFeedback 反馈门面 + Pro* 封装组件 + 主题 token 映射收敛耦合面，把 Naive UI 换成 antdv / element-plus 的成本控制在适配层。
  - icon: 🔁
    title: 同构统一请求包
    details: 原生 fetch（ofetch）与 axios 双适配器实现同一接口与 RequestError 规范化，浏览器与 Node 复用，环境变量切换。
  - icon: 🌐
    title: 体验完备
    details: 多标签页（keep-alive、右键菜单、持久化）、亮暗主题 + 六色主题色、中英国际化（组件库联动）、Dashboard 图表、403/404/500 异常页。
  - icon: 🛠️
    title: 工程即约定
    details: 全仓库 ESM + 纯 JavaScript（不引 TypeScript），@antfu/eslint-config 统一 lint 与格式化（无 Prettier），种子数据一份定义两库共享，GitHub Actions 最小 CI。
  - icon: ✅
    title: 回归有测试兜底
    details: Node 内置 node:test 零依赖——repository 契约双驱动同套用例、RBAC 三账号接口矩阵（app.request() 无服务集成）、语言包键集校验；结构化 JSON 日志（请求 id）与登录限流开箱即用。
---
