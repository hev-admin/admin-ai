# 介绍

Admin AI 是一个通用的中后台开发框架，采用 Monorepo 架构，开箱即用。

## 技术栈

| 分类     | 技术                                             |
| -------- | ------------------------------------------------ |
| 前端     | Vue3 + Vue Router + Pinia + UnoCSS + Naive UI    |
| 后端     | Hono + Prisma + SQLite (可切换 MySQL/PostgreSQL) |
| 构建     | Vite 6.0 + pnpm Monorepo                         |
| 测试     | Vitest                                           |
| 代码规范 | ESLint + @antfu/eslint-config                    |
| CI/CD    | GitHub Actions + Docker                          |
| 文档     | VitePress                                        |

## 核心特性

- **认证系统** — JWT 双 Token 机制（Access Token + Refresh Token），登录失败锁定，密码强度校验
- **RBAC 权限** — 角色-权限-菜单三级关联，前端路由守卫 + 后端中间件双重校验
- **用户管理** — 用户 CRUD、角色分配、批量操作、数据导出
- **角色管理** — 角色 CRUD、菜单权限分配
- **菜单管理** — 树形菜单管理，支持目录/菜单/按钮三种类型
- **操作日志** — 自动记录非 GET 请求，支持日期范围筛选、排序、详情查看
- **系统设置** — 动态配置管理，从后端加载
- **国际化** — 中英文双语，可扩展
- **安全加固** — CORS 白名单、速率限制（可切换 Redis）、Zod 数据验证、bcrypt 12 轮加密
- **DevOps** — GitHub Actions CI、Dockerfile、docker-compose、健康检查接口
- **构建优化** — Gzip/Brotli 压缩、代码分割、Bundle 分析

## 项目结构

```
admin-ai/
├── packages/
│   ├── frontend/          # Vue3 前端 SPA
│   │   ├── src/
│   │   │   ├── api/       # API 接口层
│   │   │   ├── components/ # 公共组件
│   │   │   ├── composables/ # 组合式函数
│   │   │   ├── directives/ # 自定义指令 (v-permission)
│   │   │   ├── i18n/      # 国际化
│   │   │   ├── layouts/   # 布局组件
│   │   │   ├── pages/     # 页面组件
│   │   │   ├── router/    # 路由配置
│   │   │   ├── stores/    # Pinia 状态管理
│   │   │   └── utils/     # 工具函数
│   │   └── tests/         # 前端测试
│   └── backend/           # Hono 后端 API
│       ├── src/
│       │   ├── config/    # 数据库配置
│       │   ├── middleware/ # 中间件 (auth, permission, rateLimit, log)
│       │   ├── routes/    # 路由定义
│       │   ├── services/  # 业务逻辑
│       │   ├── validators/ # Zod 验证器
│       │   └── utils/     # 工具函数 (response, cache, store)
│       ├── prisma/        # 数据库 Schema + 种子
│       └── tests/         # 后端测试
├── docs/                  # VitePress 文档
├── .github/workflows/     # CI/CD
├── Dockerfile             # Docker 构建
├── docker-compose.yml     # Docker Compose
└── .env.example           # 环境变量示例
```
