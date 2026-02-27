# 架构设计

## 整体架构

Admin AI 采用前后端分离的 Monorepo 架构，通过 pnpm workspace 管理三个包：

```
┌─────────────────────────────────────────────────┐
│                    Nginx / CDN                    │
│              (反向代理 + 静态资源)                  │
├─────────────────┬───────────────────────────────┤
│    Frontend     │          Backend               │
│   (Port 3000)  │        (Port 3001)              │
│                 │                                 │
│  Vue3 + Vite    │   Hono + Prisma                │
│  Naive UI       │   SQLite / MySQL / PostgreSQL  │
│  Pinia          │                                 │
│  Vue Router     │                                 │
│  UnoCSS         │                                 │
└─────────────────┴───────────────────────────────┘
```

## 后端架构

后端采用分层架构：

```
请求 → 中间件链 → 路由 → 服务 → 数据库
                              ↓
                          Prisma ORM
```

### 中间件链

```
CORS → Logger → Rate Limiter → Operation Logger → Auth → Permission → Route Handler
```

| 中间件       | 文件                       | 说明                             |
| ------------ | -------------------------- | -------------------------------- |
| CORS         | `app.js` (hono/cors)       | 基于白名单的跨域配置             |
| Rate Limiter | `middleware/rateLimit.js`  | IP 级速率限制，可切换 Redis 存储 |
| Auth         | `middleware/auth.js`       | JWT Token 验证                   |
| Permission   | `middleware/permission.js` | 基于 RBAC 的接口权限校验         |
| Log          | `middleware/log.js`        | 自动记录非 GET 请求到操作日志    |

### 数据验证

所有写入接口使用 Zod 验证器（`validators/` 目录）+ `@hono/zod-validator` 中间件：

```
POST /api/users → zValidator('json', createUserSchema) → route handler
```

### 存储适配器

速率限制和 Token 存储使用可切换的适配器模式（`utils/store.js`）：

- **默认**：内存 Map（适合单实例部署）
- **生产**：可替换为 Redis 适配器（适合集群部署）

```javascript
import { setStore } from './utils/store.js'
// 替换为 Redis 适配器
setStore(new RedisStoreAdapter(redisClient))
```

## 前端架构

### 数据流

```
页面组件 → API 模块 → Axios → 后端 API
  ↑                              ↓
Pinia Store ← ← ← ← ← ← ← 响应数据
```

### 权限控制

```
                      ┌─────────────────┐
                      │   路由守卫       │
                      │ (beforeEach)     │
                      │                  │
                      │ 1. 检查登录状态  │
                      │ 2. 加载用户信息  │
                      │ 3. 加载权限列表  │
                      │ 4. 检查路由权限  │
                      └─────────────────┘
                              ↓
┌──────────────┐    ┌──────────────────┐
│ v-permission │    │ 菜单过滤          │
│ 按钮级控制    │    │ (permission store)│
└──────────────┘    └──────────────────┘
```

### 自动导入

通过 `unplugin-auto-import` 和 `unplugin-vue-components` 实现：

- Vue、Vue Router、Pinia、vue-i18n API 无需手动 import
- Naive UI 组件自动按需注册
- 自定义组件自动注册

### 状态管理

| Store      | 职责                               |
| ---------- | ---------------------------------- |
| auth       | 用户认证状态、Token 管理、用户信息 |
| permission | 用户菜单、权限标识列表             |
| tabs       | 标签页管理、持久化                 |
| theme      | 主题切换（暗色/亮色）              |
| locale     | 国际化语言切换                     |

## 数据库模型

```
User ←→ UserRole ←→ Role ←→ RolePermission ←→ Menu
                                                 ↑
                                           (自引用树形结构)
                                           parentId → Menu

OperationLog   (操作日志)
Setting        (系统设置，key-value)
```

## 构建优化

- **代码分割**：Vue 生态、Naive UI、工具库、i18n 独立 chunk
- **Gzip + Brotli**：构建时生成压缩文件
- **Bundle 分析**：`pnpm --filter frontend build:analyze`
