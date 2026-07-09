# admin-ai 需求文档

> 基于 **pnpm monorepo** 的通用后台管理模板：`web`（Vue 3 前端）+ `server`（Hono API 服务）+ `docs`（VitePress 文档站）。不绑定具体业务，提供登录认证、RBAC 权限、动态路由、系统管理等标准能力，作为后续业务项目的起手脚手架。全仓库使用 JavaScript（不引入 TypeScript）。

## 1. 仓库形态（pnpm Monorepo）

- pnpm workspace 组织，Node.js ≥ 22（Active LTS；Node 20 已于 2026-04 EOL）。
- **全仓库 ESM**：根目录与所有子包的 `package.json` 均声明 `"type": "module"`。注意该字段按「就近 package.json」解析、**不会从根继承**，因此每个子包都要各自声明。声明后所有 `.js` 文件即 ESM，统一 `import` / `export` 语法，不再需要 `.mjs` 后缀；确需 CommonJS 的孤例以 `.cjs` 显式标注（本技术栈内原则上不应出现）。
- 目录结构：

```
├── apps/
│   ├── web/                # 前端：Vue 3 后台管理应用
│   ├── server/             # 后端：Hono API 服务
│   └── docs/               # 文档：VitePress 站点
├── packages/               # 跨端共享代码
│   └── request/            # 统一请求包：原生 fetch（默认）/ axios 双适配器（见 §2.2）；权限码、响应码常量等后续按需增设
├── eslint.config.js        # 根级唯一 ESLint 配置（ESM）
├── pnpm-workspace.yaml
└── package.json            # 根 scripts 统一编排
```

- 根 `package.json` 脚本约定：
  - `pnpm dev`：并行启动 web + server；
  - `pnpm dev:web` / `pnpm dev:server` / `pnpm dev:docs`：按 `--filter` 单独启动；
  - `pnpm build`：构建全部应用；
  - `pnpm lint` / `pnpm lint:fix`：全仓库 ESLint 检查 / 修复。
- 不引入 Turborepo / Nx，pnpm 原生 workspace 能力足够。
- 根 `package.json` 声明 `"engines": { "node": ">=22" }` 与 `"packageManager": "pnpm@<版本>"`，锁定 Node 与包管理器版本。

## 2. 技术选型

### 2.1 前端（apps/web）

- 构建：Vite；框架：Vue 3（Composition API + `<script setup>`）。
- CSS：UnoCSS；UI 组件库：Naive UI；路由：vue-router 4；状态：Pinia。

| 用途              | 选型                                                                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP 请求         | 统一请求包 `@admin-ai/request`（原生 fetch（默认）/ axios 双适配器，`VITE_HTTP_ADAPTER` 环境变量切换，见 §2.2）；业务实例走 `/api` 前缀 + Vite proxy |
| 图表              | ECharts + vue-echarts（按需注册）                                                                                                                    |
| 国际化            | vue-i18n                                                                                                                                             |
| 状态持久化        | pinia-plugin-persistedstate                                                                                                                          |
| 组件/API 自动导入 | unplugin-auto-import + unplugin-vue-components（NaiveUiResolver）                                                                                    |
| 图标              | UnoCSS preset-icons + @iconify/json 按需图标集                                                                                                       |
| 路由进度条        | nprogress                                                                                                                                            |
| UI 适配层         | 反馈门面 + Pro* 封装组件 + 主题 token 模块，支持更换 UI 库（见 §9）                                                                                  |

### 2.2 统一请求包（packages/request）

> 目标：为保持对以原生 fetch 为代表的最新网络请求范式的兼容，HTTP 客户端可在 **原生 fetch（默认）与 axios** 之间切换（开发/构建期经环境变量选择，非运行时开关）；且前后端都可能发起外部请求（web 调用 `/api`、server 出站调用第三方接口），故收敛为 workspace 共享包，两端复用同一套请求方法。

- 形态：workspace 子包 `packages/request`（包名 `@admin-ai/request`），**同构**（浏览器 / Node 均可运行）、全 ESM，不依赖任何浏览器或 Node 专属 API。
- **适配器架构**（与 §6 repository 统一操作集同思路）：
  - 对外暴露 `createRequest(options)` 工厂，返回统一实例：`request(config)` 与 `get / post / put / patch / delete` 便捷方法；能力覆盖 `baseURL`、`params` 查询串序列化、JSON 自动序列化/解析、`timeout`、自定义 headers，以及请求 / 响应 / 错误三类拦截钩子（`onRequest` / `onResponse` / `onError`）；
  - 两套适配器实现同一内部接口，业务代码不感知差异：
    - `fetch` 适配器（默认）：基于 **ofetch** 二次封装（ofetch 底层即原生 fetch）；
    - `axios` 适配器（可选）：包装 axios 实例；
  - 接口按「**最小公共能力集**」设计，不把单侧特有能力（axios 的 XSRF / 上传进度、fetch 的流式消费等）泄漏进统一接口；确需底层能力的孤例可从实例上取原始适配器对象逃逸使用，但须集中标注、控制数量；
  - **错误规范化**：两套适配器抛出结构一致的 `RequestError`（含 `status` / `data` / `message` / 原始错误引用），上层拦截与业务处理不感知适配器差异。
- **切换方式**：适配器在 `createRequest` 时注入，取值来自环境变量——web 侧 `VITE_HTTP_ADAPTER`、server 侧 `HTTP_ADAPTER`，取值 `fetch | axios`，**默认 `fetch`**（原生 fetch 为 Web 标准、浏览器与 Node ≥ 22 原生内置，零依赖即可用；axios 作为可选适配器按需启用）；开发/构建期决定，不做运行时动态切换（与 `DB_DRIVER` 同一策略）。
- **分层约定**：本包只做协议层通用能力；业务语义拦截器（附带 token、401 登出、解包 `{ code, data, message }`、useFeedback 错误提示）留在 `apps/web/src/utils/request.js` 中基于统一实例装配（见 §7）；server 出站请求同理在自身 `utils/` 内创建独立实例。
- 双适配器均纳入回归：开发期分别以两种适配器取值启动，验证登录与列表页核心链路。

> **fetch 封装选型说明（2026-07 评估）**：不从零手写 fetch 封装（超时、重试、JSON、错误规范化均为重复轮子），采用 **ofetch**（unjs 生态，Nuxt 默认请求库）作为 fetch 适配器底座——同构（浏览器 / Node / Workers）、ESM-first、自带 `onRequest/onResponse/onResponseError` 钩子、自动 JSON 解析、超时与重试、错误对象携带响应体，与本包的统一钩子模型可直接映射。备选 ky 偏浏览器场景、钩子模型较薄，不如 ofetch 契合同构诉求。

### 2.3 后端（apps/server）

| 用途          | 选型                                                                          |
| ------------- | ----------------------------------------------------------------------------- |
| Web 框架      | **Hono** + @hono/node-server（Node.js 运行时）                                |
| 鉴权          | hono/jwt（内置中间件），bcryptjs 密码哈希                                     |
| 参数校验      | zod + @hono/zod-validator                                                     |
| ORM（关系库） | **Prisma 7**（`prisma-client-js` 生成器，见下方 ORM 选型说明）                |
| 关系数据库    | SQLite（默认，文件库零部署）；支持切换 PostgreSQL / MySQL（MariaDB）          |
| MongoDB       | 官方 `mongodb` Node.js 驱动直连（不经 ORM），实现同一套 repository 接口       |
| 数据访问层    | **统一操作集**：repository 接口 + 工厂装配，业务代码不感知底层实现（见 §6）   |
| 日志          | 自研结构化 JSON 行日志（零依赖：级别过滤 + 请求 id，M6 #37 替换 hono/logger） |
| 登录防护      | 登录接口内存滑窗限流（只计失败、成功清零，单实例语义，M6 #38）                |
| 测试          | Node 内置 `node:test`（零依赖直跑源码；repository 契约 + RBAC 集成，M6 #36）  |
| 开发启动      | `node --watch`（零额外依赖）                                                  |

> **选型说明（2026-07 评估）**：主流 JS 后端框架中——Express 已处维护模式、性能垫底；Fastify 是 Node 专属的成熟高性能之选；Elysia 深度绑定 Bun 运行时，不适合 Node 部署；Hono 基于 Web 标准、多运行时可移植（Node/Bun/Deno/Workers）、周下载约 180 万、内置 JWT/CORS/logger 等常用中间件、`app.request()` 无需起服务即可测试，被普遍视为新建 JS API 项目的务实默认项。本项目为轻量模板 API，无重度插件生态诉求，**确认采用 Hono 符合当前最佳实践**；数据层做薄封装，未来如需可平移至 Fastify 或更换存储。

> **ORM 选型说明（2026-07 评估）**：Prisma 7（2025-11-19 发布）已移除 Rust 查询引擎、改用 TS 查询编译器——包体积缩小约 90%、查询最高提速 3 倍、客户端 ESM-first 且要求 `"type": "module"`，与本仓库全 ESM 形态天然契合，**确认采用**。两个已知约束需遵守：
>
> 1. v7 默认的 `prisma-client` 生成器只产出 TypeScript 代码；本仓库为纯 JS，使用官方仍保留的 `prisma-client-js` 生成器（v7 中标记为 deprecated 但可用，产出 JS + `.d.ts`，编辑器内仍有完整类型提示；待官方为新生成器提供 JS 输出后再迁移）。
> 2. **v7 暂不支持 MongoDB**（官方称支持将回归但截至 2026-07 无时间表）。因此 MongoDB 不经 ORM 接入，改用官方 `mongodb` Node.js 驱动直连，与 Prisma 实现同一套 repository 统一操作集（见 §6），经 `DB_DRIVER` 环境变量在启动时选择激活哪套实现。
>
> 数据库支持策略：关系库 **SQLite（默认）/ PostgreSQL / MySQL（MariaDB）** 之间经 Prisma 切换——schema 层面可移植（约定不使用 `@db.*` 原生类型注解），但 `provider` 不支持环境变量动态化、迁移文件绑定 SQL 方言不可跨库复用，切换是「文档化流程」而非运行时开关；**MongoDB** 作为第二类存储经原生驱动接入。
>
> 备选 ORM 评估结论（2026-07，供追溯）：MikroORM 是唯一同一套 API 一等支持 SQL + MongoDB 的主流 ORM，但社区较小、纯 JS 需用 EntitySchema 写法；TypeORM 1.0（2026-05 发布，维护已恢复健康）支持数据库名单最长、改配置即切库，但 MongoDB 仅 basic 级支持；Drizzle 的 schema 按方言绑定（pgTable/sqliteTable 不同包），最不利于切库；Sequelize v7 长期停留 alpha。综合社区规模、DX、与全 ESM/纯 JS 仓库的契合度，采用 **Prisma（关系库）+ 原生驱动（MongoDB）+ 统一操作集** 组合。

> **开发启动选型说明（2026-07 M1 评审确认）**：server 不引入 Vite / 打包器。Vite 的核心价值在浏览器侧（模块图 + HMR + TS/JSX 转译），跑 Node 服务需借助 vite-node / vite-plugin-node 等衍生方案，收益主要是转译与热更新——而本仓库 server 为纯 JS ESM，Node ≥ 22 原生直跑、无转译需求，`node --watch` 零依赖即可改动重启；引入构建管线反而要为 `better-sqlite3`（原生 `.node` 二进制）与 Prisma 生成产物做 external 特判，且导致 dev（构建管线）与 prod（`node` 直跑）行为分叉。现状 `dev` 与 `start` 运行同一份源码，一致性最高；API 服务无状态、重启 < 1s，HMR 边际收益小。未来若引入 TS，优先考虑 Node 内建 type stripping（22.6+）或 `tsx`，而非 Vite。

### 2.4 文档（apps/docs）

- VitePress 默认主题，中文为主，内容见 [§12](#12-文档站appsdocs)。

### 2.5 代码规范（仓库级）

- **只使用 ESLint 体系，不安装 Prettier**——lint 与格式化统一由 ESLint 完成。
- 采用 [@antfu/eslint-config](https://github.com/antfu/eslint-config)（ESLint Flat Config，要求 ESLint ≥ 9.5）：
  - 根目录唯一 `eslint.config.js`（全仓库 ESM 后无需 `.mjs` 后缀），覆盖全部子包：

    ```js
    import antfu from '@antfu/eslint-config'

    export default antfu({
      unocss: true, // 需安装 @unocss/eslint-plugin
      formatters: true, // css / html / markdown 交由 eslint-plugin-format 格式化
    })
    ```

  - Vue 支持自动检测（workspace 内装有 vue 即启用），无需显式开启；
  - **接受其默认风格**（单引号、无分号、import 排序、尾逗号），不做大量自定义覆盖；
  - 注意其插件前缀已重命名，内联注释需用新前缀（如 `style/*`、`import/*`、`node/*`）；
  - 提供 `.vscode/settings.json`：禁用 Prettier、`codeActionsOnSave` 开启 `source.fixAll.eslint`、按其 README 配置 `eslint.rules.customizations`（隐藏风格类告警噪音但保留自动修复）与 `eslint.validate` 语言列表（vue/json/yaml/markdown 等）。

## 3. 整体布局（web）

- **登录页**：独立布局，居中卡片式。
- **主布局**：左侧菜单 + 顶栏 + 多标签页 + 内容区。
  - 侧边栏：多级菜单（由动态路由生成）、可折叠、折叠时仅显示图标、当前路由高亮。
  - 顶栏：折叠按钮、面包屑、全屏切换、主题切换（亮/暗）、语言切换、用户头像下拉（个人中心 / 退出登录）。
  - 多标签页：
    - 打开过的页面以标签形式展示，可点击切换；
    - 支持 keep-alive 页面缓存（按路由 meta 配置）；
    - 右键菜单：刷新、关闭当前、关闭其他、关闭全部；
    - 首页（Dashboard）标签固定不可关闭；
    - 标签状态持久化，刷新浏览器后还原。
  - 内容区：路由视图 + 切换过渡动画。
- **异常页**：403（无权限）、404（未找到）、500（服务异常）。

## 4. 认证与权限（完整 RBAC）

### 4.1 登录认证

- 账号 + 密码登录，「记住我」选项：勾选时 token 存 `localStorage`（跨会话保留）、未勾选存 `sessionStorage`（关闭标签即失效）；不改变服务端签发的 JWT 过期时间。
- server 校验通过后签发 JWT（含过期时间与角色 / 权限码载荷，见 §4.5），前端按上一条策略持久化存储。
- 请求拦截器（统一请求实例，见 §2.2）自动附加 `Authorization: Bearer <token>`；响应 401 时清空登录态并跳转登录页（携带 redirect 参数，登录后回跳）。
- 退出登录：前端清空 token、用户信息、动态路由、标签页，回到登录页；`POST /api/auth/logout` 服务端为无状态 JWT，不维护黑名单，仅作占位与审计钩子（真正失效依赖前端清除与 token 自然过期）。

### 4.2 权限模型

- 三层模型：**用户 — 角色 — 权限（菜单 / 按钮）**，数据由 server 维护。
- 登录后调用「获取用户信息」接口，返回用户资料、角色、菜单树、按钮权限码集合。
- **动态路由**：根据接口返回的菜单数据生成路由并 `addRoute` 注入；未授权的路由不注册，直接访问未授权地址跳 403。
- **菜单渲染**：侧边栏菜单由动态路由生成，支持隐藏菜单（meta.hidden）、外链、图标、排序。
- **按钮级权限**：提供 `v-permission="'sys:user:add'"` 自定义指令与 `hasPermission()` 工具函数，无权限时不渲染该元素；server 侧对应接口同样校验权限码（前后端双重校验）。
- **路由守卫**：
  - 白名单（登录页、异常页）直接放行；
  - 未登录访问受控页面 → 跳登录页；
  - 已登录首次进入 → 拉取用户信息并注册动态路由；
  - 守卫全程配合 nprogress 进度条；页面标题随路由切换（含 i18n）。

### 4.3 预置种子账号（server 种子数据）

| 账号  | 密码   | 角色       | 权限范围                     |
| ----- | ------ | ---------- | ---------------------------- |
| super | 123456 | 超级管理员 | 全部菜单 + 全部按钮          |
| admin | 123456 | 管理员     | 全部菜单，但无删除类按钮权限 |
| user  | 123456 | 普通用户   | 仅 Dashboard 与个人中心      |

### 4.4 数据模型（User / Role / Menu）

> 关系库（Prisma schema）与 MongoDB 集合共用同一套字段语义；两套实现对外返回结构完全一致的普通对象（见 §6）。主键统一为字符串 `id`（关系库 cuid / uuid，Mongo 侧 ObjectId ↔ 字符串在 repository 内互转）；`createdAt` / `updatedAt` 由数据层统一维护；约定不使用 `@db.*` 原生类型注解以保证跨库可移植。

**User（用户）**

| 字段                  | 类型     | 说明                                                                |
| --------------------- | -------- | ------------------------------------------------------------------- |
| id                    | String   | 主键                                                                |
| username              | String   | 登录账号，唯一索引                                                  |
| password              | String   | bcryptjs 哈希，不返回给前端                                         |
| nickname              | String   | 昵称（显示名）                                                      |
| email                 | String?  | 邮箱，可空                                                          |
| avatar                | String?  | 头像 URL 字符串（本期不做文件上传，见 §5.3）                        |
| status                | Int      | 状态：1 启用 / 0 禁用，默认 1                                       |
| roles                 | Role[]   | 多对多（用户可有多个角色）；Mongo 侧以 `roleIds: String[]` 引用表达 |
| createdAt / updatedAt | DateTime | 数据层维护                                                          |

**Role（角色）**

| 字段                  | 类型     | 说明                                                                         |
| --------------------- | -------- | ---------------------------------------------------------------------------- |
| id                    | String   | 主键                                                                         |
| name                  | String   | 角色显示名（如「超级管理员」）                                               |
| code                  | String   | 角色标识，唯一索引（如 `super` / `admin` / `user`）                          |
| remark                | String?  | 备注，可空                                                                   |
| menus                 | Menu[]   | 多对多（角色勾选的菜单 + 按钮节点）；Mongo 侧以 `menuIds: String[]` 引用表达 |
| createdAt / updatedAt | DateTime | 数据层维护                                                                   |

**Menu（菜单 / 权限，目录·菜单·按钮三类同表）**

| 字段                  | 类型     | 说明                                                                            |
| --------------------- | -------- | ------------------------------------------------------------------------------- |
| id                    | String   | 主键                                                                            |
| parentId              | String?  | 父节点 id，根节点为 null（自关联，构成树）                                      |
| type                  | Int      | 1 目录 / 2 菜单 / 3 按钮                                                        |
| name                  | String   | i18n key（如 `menu.system.users`），前端据此翻译标题                            |
| path                  | String?  | 路由路径（目录 / 菜单用；按钮为空）                                             |
| component             | String?  | 组件路径（菜单用；目录 / 按钮为空）                                             |
| icon                  | String?  | 图标名（UnoCSS / Iconify 图标 id）                                              |
| permission            | String?  | 权限码（按钮类型必填，如 `sys:user:add`；供 v-permission 与后端权限中间件比对） |
| sort                  | Int      | 同级排序，升序                                                                  |
| hidden                | Boolean  | 是否在侧边栏隐藏（对应 route.meta.hidden），默认 false                          |
| keepAlive             | Boolean  | 是否 keep-alive 缓存（对应 route.meta.keepAlive），默认 false                   |
| createdAt / updatedAt | DateTime | 数据层维护                                                                      |

> **关于「权限」实体**：三层模型「用户—角色—权限」中的「权限」不单独建表——菜单与按钮统一存放于 Menu 表，`type=按钮` 的行即一条按钮级权限，`permission` 字段承载其权限码。角色分配权限（§5.2）即勾选包含按钮节点在内的 Menu id 集合。

### 4.5 用户信息聚合（getUserInfo 装配约定）

> RBAC 天然需要「用户 → 角色 → 菜单 / 按钮码」的多表聚合，但 repository 接口按最小公共能力集设计、不暴露 join（见 §6）。因此该聚合固定在 **service 层**用多次 repository 调用 + 内存拼装完成（Mongo 侧靠 `roleIds` / `menuIds` 手动 populate），两套实现走同一段 service 逻辑：

- **roles**：查用户关联的角色列表（返回 code + name）；
- **menuTree**：取所有关联角色的菜单并集中 `type ∈ {目录, 菜单}` 的节点去重，按 `parentId` 组树、`sort` 升序排列（`hidden` 节点保留，前端渲染时再判断）——作为动态路由与侧边栏数据源；
- **permissions**：取上述菜单并集中 `type=按钮` 节点的 `permission` 去重集合——作为按钮级权限码；
- **超级管理员**（角色 code = `super`）短路为全部菜单 + 全部按钮码，不再按角色求并集。
- **JWT 载荷**：签发时载荷含 `sub`（用户 id）、`username`、`roles`（角色 code 数组）、`permissions`（权限码数组）与过期时间；权限中间件（§4.2、任务 #13）直接从载荷比对权限码。**取舍**：权限码内嵌 token 省去每请求查库，代价是改权限后需重新登录才生效（本模板可接受；如需即时生效，改为中间件按用户 id 查库即可，接口契约不变）。

## 5. 功能模块（页面清单）

### 5.1 Dashboard 工作台

- 顶部欢迎语（用户名、问候语）。
- 统计卡片区：4 个指标卡（如访问量、用户数、订单量、转化率），含同比涨跌标识。
- 图表区（ECharts）：折线图（近 30 天趋势）、饼图/环形图（分类占比）。
- 快捷入口 / 最近动态列表。
- 数据来自 server 统计接口。

### 5.2 系统管理

> 三个页面的增删改查统一基于 §9 的 `ProSearchForm` / `ProTable` / `ProModalForm` 封装实现，不直接散用 UI 库的表格 / 表单组合。

- **用户管理**：
  - 条件搜索（用户名 / 状态）+ 分页表格；
  - 新增、编辑（弹窗表单 + 校验）、删除（二次确认）、批量删除；
  - 启用 / 禁用开关、重置密码、分配角色。
- **角色管理**：
  - 角色 CRUD；
  - 分配权限：菜单树形勾选（含按钮级权限节点），保存后生效。
- **菜单管理**：
  - 树形表格展示菜单层级；
  - CRUD：类型（目录 / 菜单 / 按钮）、名称（i18n key）、路由路径、组件路径、图标、权限码（按钮类型必填，见 §4.4）、排序、是否隐藏、是否缓存。

### 5.3 个人中心

- 基本资料查看与修改（昵称、头像、邮箱等）。头像本期为 URL 字符串（可填外链或预置头像地址），不做文件上传（上传能力预留后续引入）。
- 修改密码（旧密码校验 + 新密码二次确认）。

### 5.4 异常页

- 403 / 404 / 500，提供「返回首页」操作。

## 6. 后端服务（apps/server）

- **模块划分**（按资源拆分路由）：`auth`（登录 / 登出 / 获取用户信息）、`users`、`roles`、`menus`、`dashboard`（统计数据）。
- **中间件链**：结构化请求日志（请求 id 透传/生成 + 响应头回写，M6 #37）→ CORS → 统一错误处理 → JWT 鉴权（登录、健康检查等白名单除外）→ 权限码校验；登录接口另挂内存滑窗限流（`IP|用户名` 分桶只计失败，缺省 15 分钟 5 次，M6 #38）。
- **参数校验**：zod schema + @hono/zod-validator，校验失败返回统一错误结构与字段信息。
- **数据层总体设计——统一操作集（repository 抽象）**：
  - 业务代码只依赖 repository 接口（`userRepo` / `roleRepo` / `menuRepo` 等，方法如 `findPage / getById / findByUnique / create / update / remove / count`），不感知底层实现；
  - 两套实现：`prisma`（关系库：SQLite / PostgreSQL / MySQL）与 `mongo`（官方 `mongodb` 驱动直连）；启动时按 `DB_DRIVER=prisma|mongo`（默认 `prisma`）由工厂装配对应实现；
  - 接口按「**最小公共能力集**」设计：CRUD、分页 + 条件过滤 + 排序、按唯一键查询、计数；跨实体组合逻辑放 service 层，不把 SQL 特有能力（join、级联、聚合）泄漏进接口；
  - **方法签名约定**（两套实现完全一致）：
    - `findPage({ page = 1, pageSize = 10, where = {}, orderBy })` → `{ list, total }`；`where` 为字段→值的平铺条件对象（字符串字段按包含匹配、其余按等值），`orderBy` 为 `{ field, order: 'asc' | 'desc' }`，缺省按 `createdAt desc`；
    - `getById(id)` / `findByUnique(field, value)` → 单条对象或 `null`；`create(data)` / `update(id, data)` → 写入后的完整对象；`remove(id)` → `boolean`；`count(where)` → 数字；
    - 关联读取（用户的角色、角色的菜单）不进 repository，由 service 层多次调用 + 内存拼装完成（见 §4.5）；
  - **跨实现一致性约定**：主键统一为字符串 id（关系库用 cuid/uuid 字符串主键，Mongo 侧在 repository 内完成 ObjectId ↔ 字符串互转），`createdAt` / `updatedAt` 由数据层统一维护，两套实现对外返回结构完全一致的普通对象；
  - 不承诺跨实体事务（Mongo 多文档事务依赖副本集部署）：完整性逻辑在 service 层按「先校验后执行」顺序保证。
- **Prisma 实现（默认）**：SQLite（数据文件 `data/app.db`，加入 .gitignore；driver adapter：`@prisma/adapter-better-sqlite3`，v7 起所有数据库均须显式提供 adapter）。
  - 数据模型单一来源 `prisma/schema.prisma`：User / Role / Menu 及关联；约定不使用 `@db.*` 原生类型注解，保证跨库可移植；
  - 迁移用 `prisma migrate dev` 管理；`prisma migrate reset` 一键重置并重新播种；
  - 配置文件 `prisma.config.js`（ESM；顶部 `import 'dotenv/config'` 加载 `.env` 中的 `DATABASE_URL`，v7 不再自动读取 .env）；
  - **关系库切换流程**（SQLite → PostgreSQL / MySQL）：修改 `provider` → 更换 driver adapter（`@prisma/adapter-pg` / `@prisma/adapter-mariadb`）→ 更新 `DATABASE_URL` → 重建迁移历史（迁移 SQL 绑定方言），完整步骤写入文档站后端指南。
- **Mongo 实现**：官方 `mongodb` 驱动，连接 `MONGODB_URL` / `MONGODB_DB`；无迁移概念，由种子脚本初始化集合与索引（username 唯一索引等）；多对多关联用引用 id 数组表达。
- **种子数据**：账号 / 角色 / 菜单树 / 示例列表 / Dashboard 假数据统一定义在共享模块（`seed/data.js`），Prisma 经 `prisma db seed`、Mongo 经独立 seed 脚本消费同一份定义，保证两套实现演示数据一致。
- **基础数据完整性**：删除角色前校验是否被用户占用、删除菜单联动子节点处理等。
- **安全基线**：密码 bcryptjs 哈希存储；JWT 密钥、过期时间、端口、数据库连接走 `.env` 环境变量（提供 `.env.example`）。
- **出站外部请求**：如需调用外部第三方接口，统一经 `@admin-ai/request` 创建的出站实例发起（适配器经 `HTTP_ADAPTER` 切换，见 §2.2），不散用裸 fetch / axios。
- **健康检查**：`GET /api/health`。

## 7. 接口约定

- 路由统一前缀 `/api`；开发期 web 的 Vite dev server 将 `/api` proxy 到 `http://localhost:3000`，前端无需处理 CORS。
- 统一响应结构：`{ code, data, message }`，`code === 0` 表示成功；HTTP 状态码保持语义（401 未认证、403 无权限、422 参数错误、500 服务异常）。
- 鉴权：`Authorization: Bearer <token>`。
- 分页约定：请求 `page` / `pageSize`，响应 `data: { list, total }`。
- **接口路径约定**（非标准操作用子资源 / 动作路径，避免动词散落）：
  - auth：`POST /api/auth/login`、`POST /api/auth/logout`、`GET /api/auth/user`、`PUT /api/auth/profile`、`PUT /api/auth/password`；
  - users：`GET /api/users`（分页）、`POST /api/users`、`PUT /api/users/:id`、`DELETE /api/users/:id`、`DELETE /api/users`（批量，body `{ ids }`）、`PATCH /api/users/:id/status`（启用 / 禁用，body `{ status }`）、`PUT /api/users/:id/password`（重置密码）、`PUT /api/users/:id/roles`（分配角色，body `{ roleIds }`）；
  - roles：`GET /api/roles`（分页）、`POST /api/roles`、`PUT /api/roles/:id`、`DELETE /api/roles/:id`、`PUT /api/roles/:id/menus`（分配权限，body `{ menuIds }`）；
  - menus：`GET /api/menus`（树形）、`POST /api/menus`、`PUT /api/menus/:id`、`DELETE /api/menus/:id`；
  - dashboard：`GET /api/dashboard/stats`（指标卡 + 折线 / 饼图数据）。
- 请求封装（web）：业务实例基于统一请求包 `@admin-ai/request` 创建（见 §2.2，适配器经 `VITE_HTTP_ADAPTER` 切换）；响应拦截统一解包 `data`，业务错误经 §9 的统一反馈门面 `useFeedback` 提示（当前底层实现为 Naive UI discrete API）；401 → 登出并跳登录；403 → 提示无权限；网络异常 → 统一错误提示。

## 8. 主题与样式

- 主题 token（主色、圆角、暗色开关等）收敛于 `src/theme/` 单一模块，经映射函数输出为当前 UI 库的主题配置（Naive UI：`darkTheme` + `themeOverrides`）：
  - 亮 / 暗模式切换，支持跟随系统（可选）；
  - 预设若干主题色可选（主色切换全局生效）；
  - 主题状态持久化；
  - 切换 UI 库时仅重写映射函数（antdv：ConfigProvider theme token；element-plus：CSS 变量覆盖），token 定义不变。
- UnoCSS 负责布局与原子样式，与 Naive UI 主题变量配合（暗色下背景/文字随主题联动）。
- 目标分辨率：桌面端优先，≥ 1280px 体验完整；窄屏下侧边栏自动折叠。

## 9. UI 组件库适配层（可切换设计）

> 目标等级：**设计时受控切换**，而非运行时开关——UI 库的组件 API、表单校验模型、主题系统差异过大，「零改动切换」不现实；本设计通过收敛耦合面，把「Naive UI → Ant Design Vue / Element Plus」的迁移成本控制在「替换适配层实现 + 按清单批量替换」范围内。

### 9.1 耦合面收敛规则

- **反馈门面**：message / notification / dialog / loadingBar 一律经 `useFeedback()` 组合式函数调用，禁止业务代码直接使用 Naive UI 的 discrete API（全项目只有门面这一处实现方）。
- *_高频 CRUD 封装（Pro_ 组件）**：
  - `ProSearchForm`：条件搜索区（字段配置渲染 + 查询/重置）；
  - `ProTable`：列配置 + 数据源 + 分页 + 工具栏 + loading，列渲染支持 render / 插槽；
  - `ProModalForm`：弹窗表单，字段 schema 渲染常用控件（input / select / radio / switch / tree-select / date 等），插槽承接特殊控件；validate / resetFields 等库间语义差异由封装层消化。
  - 业务页面的增删改查一律基于 Pro* 组件实现，不散用 UI 库原始表格/表单组合。
- **图标**：统一 `<AppIcon>`，基于 UnoCSS preset-icons / Iconify，不依赖任何 UI 库的图标包。
- **布局与间距**：用 UnoCSS 原子类实现，不使用 UI 库的栅格 / 间距组件（NGrid、NSpace 等）。
- **Provider 集中**：NConfigProvider 等全局 Provider 仅出现在应用入口一处；组件库 locale 的映射收敛在 i18n 模块（见 §10）；主题映射收敛在 `src/theme/`（见 §8）。
- **层级隔离**：`stores` / `utils` / `router` / `api` 目录禁止 import UI 库，UI 依赖只允许出现在 `views`、`layouts`、`components`。
- 低频展示型组件（NTag、NAvatar、NStatistic 等）允许在 views / layouts 直接使用；因组件前缀统一（`n-` / `a-` / `el-`），切换时可全局检索精确枚举替换面。

### 9.2 切换流程（详细步骤写入文档站前端指南）

1. 更换依赖与 unplugin-vue-components 的 resolver（NaiveUiResolver → AntDesignVueResolver / ElementPlusResolver）；
2. 重写适配实现：`useFeedback` 底层、Pro* 组件内部、`src/theme/` 映射函数、i18n 的组件库 locale 映射；
3. 按组件前缀全局检索直接使用的展示型组件，逐个替换；
4. 回归验证：三账号 RBAC 全流程、主题切换、国际化联动。

## 10. 国际化

- vue-i18n，默认中文，支持中 / 英切换，语言选择持久化。
- 语言包按模块拆分（common、menu、login、system…）。
- 组件库 locale 随语言联动，映射收敛在 i18n 模块（当前为 Naive UI 的 zhCN/enUS、dateZhCN/dateEnUS）。
- 菜单标题、页面标题、表单/表格文案、提示信息均走 i18n。

## 11. 状态管理（Pinia stores）

- `user`：token、用户信息、角色、按钮权限码；登录 / 登出 / 拉取用户信息 action。
- `permission`：动态路由表、菜单树，路由注册逻辑。
- `app`：侧边栏折叠状态、暗黑模式、主题色、语言。
- `tabs`：多标签页列表与当前激活标签、keep-alive 缓存名单。
- 持久化范围：token、主题、语言、侧边栏状态、标签页。

## 12. 文档站（apps/docs）

- VitePress 搭建，内容大纲：
  - **快速开始**：环境要求、安装、启动命令、种子账号说明；
  - **架构说明**：monorepo 结构、前后端交互流程、目录约定；
  - **前端指南**：新增页面与菜单的流程、权限指令用法、主题定制、新增语言、UI 组件库切换指南（Naive UI → antdv / element-plus，含适配点清单）；
  - **后端指南**：模块结构、新增接口的流程、种子数据与重置、数据库切换指南（关系库 SQLite → PostgreSQL / MySQL；`DB_DRIVER=mongo` 启用 MongoDB 模式）；
  - **API 参考**：按模块列出接口（路径、方法、参数、响应示例）。
- 文档随各里程碑同步更新，作为验收项之一。

## 13. 目录与环境约定

- `apps/web` 内部结构：

```
apps/web/src/
├── api/            # 接口模块（按业务拆分）
├── assets/
├── components/     # 通用组件（含 Pro* 封装、AppIcon 等 UI 适配层）
├── composables/    # 组合式函数（含 useFeedback 反馈门面）
├── directives/     # 自定义指令（v-permission 等）
├── layouts/        # 布局组件
├── locales/        # 语言包
├── router/         # 路由（静态路由 + 守卫 + 动态路由工具）
├── stores/         # pinia stores
├── theme/          # 主题 token 定义与 UI 库主题映射
├── utils/          # 工具（request 业务实例装配等，基于 @admin-ai/request）
└── views/          # 页面（按模块分目录）
```

- `packages/request` 内部结构：`src/index.js`（`createRequest` 工厂与统一实例）+ `src/adapters/axios.js` / `src/adapters/fetch.js`（双适配器）+ `src/error.js`（`RequestError` 规范化）。

- `apps/server` 内部结构：

```
apps/server/
├── prisma/
│   ├── schema.prisma   # 关系库数据模型（单一数据源）
│   ├── migrations/     # 迁移历史（绑定当前 provider）
│   └── seed.js         # Prisma 种子入口（消费 seed/data.js）
├── seed/
│   ├── data.js         # 种子数据定义（两套实现共享）
│   └── mongo.js        # Mongo 种子脚本（建集合、索引并播种）
├── src/
│   ├── routes/         # 按模块的路由定义
│   ├── middlewares/    # 鉴权、错误处理、权限校验
│   ├── repositories/   # 统一操作集
│   │   ├── index.js    # 工厂：按 DB_DRIVER 装配实现
│   │   ├── prisma/     # Prisma 实现
│   │   └── mongo/      # mongodb 驱动实现
│   ├── services/       # 跨实体业务逻辑（完整性校验等）
│   ├── utils/
│   └── index.js        # 入口
├── prisma.config.js    # Prisma 配置（ESM）
└── data/               # SQLite 数据文件（gitignore）
```

- 路径别名：web 内 `@` → `apps/web/src`。
- 环境变量：web 用 `VITE_` 前缀 `.env`（含 `VITE_HTTP_ADAPTER=fetch|axios`，默认 `fetch`）；server 用 `.env`（`PORT`、`JWT_SECRET`、`JWT_EXPIRES_IN`、`DB_DRIVER`、`DATABASE_URL`、`MONGODB_URL`、`MONGODB_DB`、`HTTP_ADAPTER`（默认 `fetch`）、`LOG_LEVEL`（默认 `info`）、`LOGIN_RATE_MAX` / `LOGIN_RATE_WINDOW`（默认 5 次 / 15m，M6）），均提供 `.env.example`。
- ESM 注意项：模块内没有 `__dirname` / `__filename`，取路径用 `import.meta.dirname`（Node ≥ 20.11 可用，本仓库要求 ≥ 22 天然满足）；种子数据写成 `.js` 模块导出对象，避免直接 import JSON 需要 import attributes 的兼容问题。
- 组件名多单词、`<script setup>` 优先；Naive UI 组件按需自动引入，不全量注册。

## 14. 非目标（本期不做）

- 不使用 TypeScript、不做 SSR。
- 不做移动端专门适配（仅保证桌面端与基本窄屏可用）。
- MongoDB 不经 ORM 接入（Prisma 7 尚未支持），仅通过官方驱动实现统一操作集；不追求公共能力集之外的 Mongo 高级特性（聚合管道、跨实体事务等）。
- 不做运行时动态切换 / 多库并存（`DB_DRIVER` 在启动时决定；关系库之间切换按 §6 文档化流程执行）。
- 请求适配器（fetch / axios）不做运行时动态切换（`VITE_HTTP_ADAPTER` / `HTTP_ADAPTER` 在开发/构建期决定，默认 `fetch`）；统一请求接口不承诺覆盖 fetch 与 axios 各自的全部特有能力（流式消费、上传进度等按逃逸口径个案处理，见 §2.2）。
- 不引入 Turborepo / Nx 等构建编排工具。
- 不做 UI 库运行时 / 构建时双套并存，不承诺零改动切换（切换按 §9.2 流程执行，成本为「适配层重写 + 有限清单替换」）。
- 不安装 Prettier（格式化由 ESLint 承担）。
- 不做 E2E 测试（M6 已引入 `node:test` 单元/集成测试：repository 双驱动契约、RBAC 接口矩阵、语言包键集——原「不做单元测试」的裁剪于 2026-07-13 评审整改中解除）。

## 15. 里程碑建议

1. **M1 工程底座**：monorepo 初始化（workspace、根脚本、@antfu/eslint-config、VS Code 配置）；统一请求包 `packages/request`（fetch（默认）/ axios 双适配器 + 环境变量切换，见 §2.2）；web 骨架（UnoCSS / Naive UI / 自动导入 / 基于统一请求包的业务请求实例 / proxy，UI 适配层地基：useFeedback、AppIcon、theme 模块）；server 骨架（Hono / Prisma + SQLite 迁移与种子 / JWT / 统一响应与错误处理）；打通登录链路 + 路由守卫。
2. **M2 权限体系**：server 端 users / roles / menus 接口与权限码校验（repository 统一操作集接口在本期定型）；web 端 RBAC 动态路由、菜单渲染、按钮权限指令；Pro* 封装组件与系统管理三个页面。
3. **M3 体验增强**：多标签页、Dashboard（server 统计接口 + ECharts）、暗黑模式 + 主题色、国际化、异常页、个人中心。
4. **M4 MongoDB 适配**：mongo repository 实现与种子脚本；`DB_DRIVER=mongo` 下三账号 RBAC 全流程回归验证。
5. **M5 文档站**：VitePress 站点与各指南、API 参考编写，README 完善。
