# 架构说明

admin-ai 是基于 **pnpm monorepo** 的通用后台管理模板：`web`（Vue 3 前端）+ `server`（Hono API 服务）+ `docs`（本文档站）+ `packages/request`（同构请求包）。不绑定具体业务，提供登录认证、RBAC 权限、动态路由、系统管理等标准能力，作为业务项目的起手脚手架。

全仓库两条硬约定：**全 ESM**（根与所有子包均声明 `"type": "module"`，该字段按就近 package.json 解析、不从根继承）；**纯 JavaScript**（不引入 TypeScript，编辑器类型提示依赖 JSDoc 与依赖包自带的 `.d.ts`）。

## 仓库结构

```
├── apps/
│   ├── web/                # 前端：Vue 3 后台管理应用
│   ├── server/             # 后端：Hono API 服务
│   └── docs/               # 文档：VitePress 站点（本站）
├── packages/
│   └── request/            # 同构统一请求包：fetch（默认）/ axios 双适配器
├── eslint.config.js        # 根级唯一 ESLint 配置
├── pnpm-workspace.yaml
└── package.json            # 根 scripts 统一编排
```

根脚本：`pnpm dev`（并行 web + server）、`pnpm dev:web` / `dev:server` / `dev:docs`、`pnpm build`（全部应用）、`pnpm test`（server 契约 / RBAC + web 语言包键集）、`pnpm lint` / `lint:fix`。不引入 Turborepo / Nx，pnpm 原生 workspace 能力足够。

## 技术栈

### 前端（apps/web）

| 用途       | 选型                                                                              |
| ---------- | --------------------------------------------------------------------------------- |
| 构建与框架 | Vite + Vue 3（Composition API + `<script setup>`）                                |
| UI 组件库  | Naive UI（经适配层收敛耦合面，可切换，见[前端指南](./frontend.md#ui-组件库切换)） |
| CSS / 图标 | UnoCSS + preset-icons（@iconify-json/carbon）                                     |
| 路由与状态 | vue-router 4 + Pinia（pinia-plugin-persistedstate 持久化）                        |
| HTTP       | `@admin-ai/request` 业务实例 + Vite proxy（`/api` → server）                      |
| 图表       | ECharts + vue-echarts（按需注册，随 Dashboard 路由懒加载）                        |
| 国际化     | vue-i18n（平铺 key + 自定义 messageResolver）                                     |
| 自动导入   | unplugin-auto-import + unplugin-vue-components（NaiveUiResolver）                 |

### 后端（apps/server）

| 用途          | 选型                                                                     |
| ------------- | ------------------------------------------------------------------------ |
| Web 框架      | Hono + @hono/node-server                                                 |
| 鉴权          | hono/jwt（HS256）+ bcryptjs 密码哈希                                     |
| 参数校验      | zod + @hono/zod-validator（失败统一 422 + 字段明细）                     |
| ORM（关系库） | Prisma 7（`prisma-client-js` 生成器 + `@prisma/adapter-better-sqlite3`） |
| MongoDB       | 官方 `mongodb` 驱动直连（Prisma 7 暂不支持 MongoDB，不经 ORM）           |
| 数据访问层    | repository 统一操作集，`DB_DRIVER` 启动时装配 prisma / mongo 实现        |
| 开发启动      | `node --watch`（不引入 Vite / 打包器，dev 与 prod 跑同一份源码）         |
| 日志 / 限流   | 自研零依赖 JSON 行日志（请求 id + `LOG_LEVEL` 过滤）、登录内存滑窗限流   |
| 测试          | Node 内置 `node:test`（零依赖直跑源码，不引入 vitest）                   |

### 共享包（packages/request）

同构统一请求包 `@admin-ai/request`：`createRequest(options)` 工厂返回统一实例（`request` / `get` / `post` / `put` / `patch` / `delete`），两套适配器（ofetch 封装的 fetch 适配器为默认，axios 可选）实现同一内部接口与结构一致的 `RequestError` 规范化。适配器取值：显式传入 > 环境变量（web `VITE_HTTP_ADAPTER` / server `HTTP_ADAPTER`）> 默认 `fetch`，开发 / 构建期决定，不做运行时切换。

## 前后端交互流程

开发期拓扑：浏览器访问 Vite dev server（5173），`/api` 前缀的请求经 proxy 转发到 server（3000），前端无需处理 CORS。

### 登录到页面呈现

1. 登录页提交账号密码 → `POST /api/auth/login`，server 校验并签发 JWT（载荷含 `sub` / `username` / `roles` / `permissions`）；
2. 前端按「记住我」选项把 token 存入 `localStorage`（跨会话）或 `sessionStorage`（关标签即失效）；
3. 路由守卫发现已登录但用户信息未加载 → `GET /api/auth/user` 拉取聚合数据：用户资料、角色 code、**菜单树**（目录/菜单节点）与**按钮权限码集合**；
4. permission store 把菜单树中的叶子菜单平铺注册为主布局子路由（`router.addRoute`），未授权的路由从一开始就不存在；
5. 守卫按 `path / query / hash` 重放当前导航，命中新注册的路由，页面渲染；侧边栏由菜单树渲染层级，按钮由 `v-permission` 指令按权限码显隐。

### 请求链路

业务请求统一走 `apps/web/src/utils/request.js` 装配的实例：

- **请求拦截**：自动附加 `Authorization: Bearer <token>`；
- **响应拦截**：统一解包 `{ code, data, message }`——`code === 0` 直接返回 `data`，否则弹错误提示并抛 `RequestError`（传 `silent: true` 可静默，由调用方自行处理）；
- **错误处理**：401 清空登录态并整页跳登录（带 `redirect` 回跳参数）；403 提示无权限；网络异常统一提示。

server 侧中间件链：`结构化请求日志（请求 id）→ CORS → 统一错误处理 → JWT 鉴权（白名单：/api/health、/api/auth/login）→ 权限码校验（按接口注解）→ 业务路由`；登录接口另有内存滑窗限流（见[后端指南](./backend.md#登录限流)）。

## 认证与权限模型

三层 RBAC：**用户 — 角色 — 权限（菜单 / 按钮）**。「权限」不单独建表——目录、菜单、按钮三类节点统一存于 Menu 表（`type` 区分），`type=按钮` 的行即一条按钮级权限，`permission` 字段承载权限码（如 `sys:user:add`）。角色分配权限即勾选包含按钮节点在内的 Menu id 集合。

- **前后端双重校验**：前端 `v-permission` 指令 / 动态路由控制可见性，server 端 `requirePermission(code)` 中间件从 JWT 载荷比对权限码——绕过前端直接调接口同样被 403 拦截。
- **super 短路**：角色 code 为 `super` 时，聚合接口返回全部菜单与按钮码、权限中间件直接放行——新增权限码后超管无需重登。
- **取舍**：权限码内嵌 JWT 载荷，省去每请求查库；代价是改权限后需重新登录才生效（模板可接受；如需即时生效，把权限中间件改为按用户 id 查库即可，接口契约不变）。

## 数据层：repository 统一操作集

业务代码只依赖 `repositories/index.js` 导出的 `userRepo` / `roleRepo` / `menuRepo`，不感知底层实现。两套实现遵守同一契约：

- 方法：`findPage` / `findMany` / `getById` / `findByUnique` / `create` / `update` / `remove` / `count`；
- 主键统一字符串 `id`（关系库 cuid；Mongo 侧 ObjectId ↔ 字符串在 repository 内互转）；
- `where` 为平铺条件对象（不暴露 SQL / Mongo 算子），多对多关联以 id 数组暴露（`User.roleIds` / `Role.menuIds`）；
- 关联读取不进 repository——service 层多次调用 + 内存拼装（如 getUserInfo 聚合）；跨实体完整性在 service 层「先校验后执行」。

启动时按 `DB_DRIVER` 惰性装配对应实现（未启用的驱动模块图完全不加载）。种子数据单一定义在 `seed/data.js`，Prisma 经 `prisma db seed`、Mongo 经 `db:seed:mongo` 消费同一份定义，保证两库演示数据一致。契约细节与切库流程见[后端指南](./backend.md)。

## 目录约定

### apps/web

```
apps/web/src/
├── api/            # 接口模块（按业务拆分：auth / users / roles / menus / dashboard）
├── components/     # 通用组件（Pro* 封装、AppIcon 等 UI 适配层）
├── composables/    # 组合式函数（useFeedback 反馈门面）
├── directives/     # 自定义指令（v-permission）
├── layouts/        # 主布局与侧边栏 / 顶栏 / 多标签页组件
├── locales/        # 语言包（按模块拆分，平铺 key）+ 组件库 locale 映射
├── router/         # 静态路由 + 守卫
├── stores/         # pinia stores（user / permission / app / tabs）
├── theme/          # 主题 token 定义与 UI 库主题映射
├── utils/          # request 业务实例、权限判断、token 存取等
└── views/          # 页面（按模块分目录）
```

### apps/server

```
apps/server/
├── prisma/             # schema.prisma（数据模型单一来源）、migrations/、seed.js
├── seed/               # data.js（种子定义，两套驱动共享）、mongo.js（Mongo 种子脚本）
├── src/
│   ├── routes/         # 按模块的路由定义（zod schema 就近声明）
│   ├── middlewares/    # 鉴权、权限码校验、统一错误处理
│   ├── repositories/   # 统一操作集：index.js 工厂 + prisma/ + mongo/ 两套实现
│   ├── services/       # 跨实体业务逻辑（聚合、完整性校验）
│   ├── db/             # prisma client 装配、DATABASE_URL 解析
│   └── utils/          # 响应结构、JWT、zod 封装、树构建等
├── prisma.config.js    # Prisma 7 配置（ESM，显式加载 dotenv，声明 seed 命令）
└── data/               # SQLite 数据文件（gitignore）
```

### 层级隔离规则（§9）

`stores` / `utils` / `router` / `api` 目录禁止 import UI 组件库——UI 依赖只允许出现在 `views` / `layouts` / `components`，这是「切换 UI 库成本可控」的结构性保证。

## 工程约定

- **代码规范**：@antfu/eslint-config（ESLint Flat Config），`unocss: true` + `formatters: true`，lint 与格式化统一由 ESLint 完成，**不安装 Prettier**；接受其默认风格（单引号、无分号、import 排序）。
- **server 不引入构建管线**：Node ≥ 22 原生直跑 ESM，`node --watch` 改动重启；dev 与 prod 运行同一份源码，避免为 better-sqlite3（原生二进制）与 Prisma 产物做打包特判。
- **本期非目标**（§14）：不做 SSR、不做移动端专门适配、不做 E2E 测试（M6 已引入 `node:test` 单元 / 集成测试，见[后端指南](./backend.md#测试)）、UI 库与数据驱动均不做运行时动态切换。
