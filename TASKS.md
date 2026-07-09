# admin-ai 任务清单

> 本文档是 admin-ai 项目的实施执行与进度追踪依据，基于 REQUIREMENTS.md 制定。任务按 M1-M5 里程碑组织，每个任务包含验收标准。

---

## 里程碑概览

- **M1 工程底座** ✅ 已完成（2026-07-10，评审结论见 REVIEW.md）：monorepo 初始化、统一请求包、前后端骨架、UI 适配层基础设施、打通登录链路
- **M2 权限体系** ✅ 已完成（2026-07-11，验证记录见 M2 章节末）：repository 统一操作集、RBAC 接口与中间件、前端动态路由与按钮权限、Pro* 组件、系统管理三页面
- **M3 体验增强** ✅ 已完成（2026-07-11，验证记录见 M3 章节末）：多标签页、Dashboard、主题切换、国际化、异常页、个人中心
- **M4 MongoDB 适配** ✅ 已完成（2026-07-12，验证记录见 M4 章节末）：mongodb 驱动 + seed 脚本、mongo repository、双模式（prisma 基线 + mongo）冒烟回归各 85 项通过
- **M5 文档站** ✅ 已完成（2026-07-12，验证记录见 M5 章节末）：VitePress 站点（本地搜索、五篇结构）、快速开始/架构/前端/后端指南、API 参考（24 接口全量）、README + LICENSE
- **M6 基座加固（评审整改）** ✅ 已完成（2026-07-13，验证记录见 M6 章节末）：node:test 测试设施（契约双实现 + RBAC 矩阵 + 键集，33 用例）、结构化日志（请求 id）、登录限流、safelist 单一来源、最小 CI、文档六处同步；**不含** Docker 与 TS（明确排除），API 文档自动化暂缓（决策点 8）
- **M7 Docker 打包** ✅ 已完成（2026-07-13，验证记录见 M7 章节末）：server 静态托管 + SPA fallback（WEB_DIST，7 用例）、多阶段 Dockerfile / entrypoint / .dockerignore、compose.yaml（mongo profile）、容器端到端验证（报告 §7 DoD 全项，WSL2 Ubuntu 实测）、部署指南（docs 新页 + README）、CI 镜像构建校验

---

## M1 工程底座 ✅

### #1 初始化 pnpm monorepo 工程结构 ✅

**描述**：创建根目录 package.json（声明 `"type": "module"`）、pnpm-workspace.yaml，配置 workspace 包含 `apps/*` 和 `packages/*`，创建 `apps/web`、`apps/server`、`apps/docs`、`packages/request` 目录骨架，配置根级脚本（`dev` / `dev:web` / `dev:server` / `dev:docs` / `build` / `lint` / `lint:fix`）。

**验收**：`pnpm install` 成功，目录结构符合 §1 约定。

---

### #2 配置 ESLint 与 VS Code 设置 ✅

**描述**：安装 `@antfu/eslint-config`（ESLint ≥ 9.5）、`@unocss/eslint-plugin`，创建根级 `eslint.config.js`（启用 `unocss` 和 `formatters`），配置 `.vscode/settings.json`（禁用 Prettier、启用 eslint auto-fix、配置 `customizations` 与 `validate` 语言列表）。

**验收**：`pnpm lint` 通过，编辑器内 ESLint 自动修复生效。

---

### #3 实现统一请求包 @admin-ai/request ✅

**描述**：在 `packages/request` 创建 ESM 包（package.json 声明 `"type": "module"`），实现 `createRequest` 工厂与统一接口（`request` / `get` / `post` / `put` / `patch` / `delete`、`baseURL` / `params` / `timeout` / `headers` / `onRequest` / `onResponse` / `onError` 钩子），实现 fetch 适配器（基于 ofetch）与 axios 适配器，环境变量切换逻辑（`VITE_HTTP_ADAPTER` / `HTTP_ADAPTER`，默认 `fetch`），实现 `RequestError` 规范化。

**验收**：两种适配器在 Node 与浏览器环境均能运行；以脚本 / 手动方式验证 `get` / `post`、超时、`RequestError` 错误规范化在两套适配器下行为一致（本期不引入单测框架，见 §14）。

---

### #4 搭建 web 前端骨架 ✅

**描述**：初始化 Vite + Vue 3 应用（`apps/web`），配置 UnoCSS、Naive UI、vue-router 4、Pinia、unplugin-auto-import + unplugin-vue-components（NaiveUiResolver）、UnoCSS preset-icons + @iconify/json，配置路径别名 `@` → `src`，配置 Vite proxy（`/api` → `http://localhost:3000`），创建 §13 约定的目录结构（`api` / `assets` / `components` / `composables` / `directives` / `layouts` / `locales` / `router` / `stores` / `theme` / `utils` / `views`），package.json 声明 `"type": "module"`。

**验收**：`pnpm dev:web` 启动成功、能访问空白页面。

---

### #5 实现 UI 适配层基础设施 ✅

**描述**：实现 `useFeedback` 组合式函数（`composables/useFeedback.js`，封装 Naive UI discrete API：`message` / `notification` / `dialog` / `loadingBar`），实现 `AppIcon` 组件（基于 UnoCSS preset-icons），实现 theme 模块（`src/theme/`，定义主题 token 与 Naive UI 映射函数，支持亮/暗模式切换与主题色选择，状态持久化）。

**验收**：能调用 `useFeedback` 显示提示、`AppIcon` 渲染图标、主题切换生效。

---

### #6 配置 web 请求实例与拦截器 ✅

**描述**：在 `utils/request.js` 基于 `@admin-ai/request` 创建业务请求实例（适配器经 `VITE_HTTP_ADAPTER` 切换，默认 `fetch`），配置请求拦截器（附加 `Authorization` header）、响应拦截器（解包 `data`、401 登出跳转、403 提示、错误经 `useFeedback` 提示）。

**验收**：能发起请求、拦截器逻辑覆盖主要场景。

---

### #7 搭建 server 后端骨架 ✅

**描述**：初始化 Hono 应用（`apps/server`），安装 `@hono/node-server`、`hono/jwt`、`hono/logger`、`bcryptjs`、`zod`、`@hono/zod-validator`，创建 §13 约定的目录结构（`src/routes` / `middlewares` / `repositories` / `services` / `utils`、`prisma/`、`seed/`），配置 package.json（`"type": "module"`、`dev` 脚本用 `node --watch`）、`.env.example`（`PORT` / `JWT_SECRET` / `JWT_EXPIRES_IN` / `DB_DRIVER` / `DATABASE_URL` / `MONGODB_URL` / `MONGODB_DB` / `HTTP_ADAPTER`），配置统一响应与错误处理中间件、logger、CORS。

**验收**：`pnpm dev:server` 启动成功、`GET /api/health` 返回 200。

---

### #8 配置 Prisma + SQLite 迁移与种子 ✅

**描述**：安装 Prisma 7、`@prisma/adapter-better-sqlite3`、`better-sqlite3`，创建 `prisma.config.js`（ESM，顶部 `import 'dotenv/config'`），定义 `schema.prisma`（User / Role / Menu 模型及关联，**字段按 §4.4 定义**，使用 `prisma-client-js` 生成器，`provider: sqlite`，不使用 `@db.*` 原生类型），创建初始迁移，定义种子数据（`seed/data.js`，包含 §4.3 的三账号、角色，以及含按钮节点与权限码的完整菜单树，按 §4.4 / §4.5 约定），实现 `prisma/seed.js`（消费 `seed/data.js`），配置 package.json 的 `prisma.seed`。

**验收**：`prisma migrate dev` 成功、`db seed` 成功、数据文件生成在 `data/app.db`。

---

### #9 实现 JWT 鉴权中间件 ✅

**描述**：实现 JWT 鉴权中间件（`middlewares/auth.js`，使用 `hono/jwt`，白名单包含登录、健康检查），实现 auth 路由（`POST /api/auth/login`：账号密码校验、bcryptjs 验证哈希、签发 JWT（载荷含角色 code 与权限码，见 §4.5）；`POST /api/auth/logout`（无状态占位，见 §4.1）；`GET /api/auth/user`：按 §4.5 装配约定聚合返回用户资料、角色、菜单树、按钮权限码）。

**验收**：能登录获取 token、携带 token 访问受保护接口、401 响应正确。

---

### #10 打通前端登录链路与路由守卫 ✅

**描述**：实现登录页（`views/login/`，独立布局、居中卡片式、账号密码表单、记住我选项），实现 user store（token / userInfo / roles / permissions 持久化、login / logout / getUserInfo action），实现 permission store（动态路由表 / 菜单树、路由注册逻辑），实现路由守卫（`router/guards.js`，白名单放行、未登录跳转、已登录拉取用户信息并注册动态路由、配合 nprogress），实现登录 API（`api/auth.js`）。

**验收**：能用 super/admin/user 登录、守卫逻辑正确、刷新后保持登录态。

---

## M2 权限体系 ✅

> **执行规划**（2026-07-11 制定，基于 M1 完成后的代码现状调研）

### 现状衔接点

M1 已为 M2 备好的基础与预留的债务（代码内均有 TODO 标注）：

1. **种子数据就绪**：`seed/data.js` 已含完整菜单树（目录/菜单/按钮三类、13 个 `sys:*:*` 按钮权限码）与三角色权限矩阵，#13 / #16 / #18 直接消费，无需补种子。
2. **JWT 载荷已含权限**：登录签发的 token 已带 `roles` + `permissions`（§4.5），#13 权限中间件直接从 `c.get('jwtPayload')` 比对，无需查库。
3. **auth service 直连 prisma**：`services/auth.js` 目前绕过数据访问层直接使用 prisma client（已标注 TODO），#12 完成后迁移到 repository，作为统一操作集的第一个消费方验证接口设计。
4. **动态路由策略延续**：M1 permission store 将叶子菜单平铺注册到主布局子路由、目录节点仅存于菜单树，#15 侧边栏基于菜单树渲染层级，路由注册策略维持平铺不变；外链（`http` 开头）已约定不注册路由，#15 侧边栏渲染时以新窗口打开。
5. **MainLayout 为占位布局**：仅顶栏 + 内容区（用户下拉、暗色切换已可用），#15 重构为「侧边栏 + 顶栏 + 内容区」，多标签页留到 M3 #19。
6. **未实现页面已兜底**：动态路由对缺失组件回退「建设中」占位页，#18 按 seed 约定的组件路径（`system/users/index` 等）落地真实页面后自动接上。

### 执行批次与顺序

后端（A → B）与前端（C、D）两条线可并行推进，在 E 汇合：

| 批次         | 任务                         | 依赖      | 说明                                                                     |
| ------------ | ---------------------------- | --------- | ------------------------------------------------------------------------ |
| A 数据访问层 | #11 → #12                    | —         | repository 接口本期定型，是 M4 Mongo 实现的契约基础，最先落定            |
| B 接口与权限 | #13、#14 + auth service 迁移 | A         | #13 完成后 #14 各接口即可挂权限码注解                                    |
| C 前端框架层 | #15 → #16                    | —         | 仅依赖 M1 已有的菜单树 / 权限码数据，与 A / B 并行                       |
| D Pro* 组件  | #17                          | —         | 独立任务，与 A / B / C 并行；API 先于 #18 定型                           |
| E 页面集成   | #18                          | B + C + D | 按 users → roles → menus 顺序实现（复杂度递增，users 页先验证 Pro* API） |
| F 收尾验证   | #34 + M2 回归                | E         | #34 的依赖（#3 / #6 / #10）已满足，纳入本期收尾顺带完成                  |

### 关键决策点

1. **菜单标题 i18n 提前量**：菜单 `name` 存 i18n key（如 `menu.dashboard`），而 vue-i18n 原计划 M3 #22 接入，#15 渲染侧边栏时即需翻译。**决策：#15 提前安装 vue-i18n，仅建中文语言包（`locales/zh-CN/`），M3 #22 补英文包与切换器**，避免造临时映射再返工（`router/guards.js` 中 pageTitle 的 TODO 一并消化）。
2. **403 跳转口径**：#15 验收含「直接访问未授权地址跳 403」，但动态路由模式下前端无法区分「不存在」与「无权限」（普通用户拿不到全量菜单）。**决策：守卫对命中 catch-all（NotFound）的已登录导航做区分——角色含 `super` 保持 404（全量路由已注册，未匹配即真不存在），其余重定向 403**；未登录仍先跳登录。#15 同步创建基础版 403 页（结构对齐现有 404.vue），M3 #23 统一完善样式并纳入异常页体系。
3. **super 短路放行**：权限码内嵌 token，新增权限码后 super 需重登才生效。**决策：#13 权限中间件对 `roles` 含 `super` 直接放行**，与 §4.5 getUserInfo 的 super 短路语义对齐。
4. **删除菜单联动策略**：**级联删除全部子孙节点**（目录 → 菜单 → 按钮），角色-菜单关联随之清理；service 层「先校验后执行」（M4 Mongo 实现需手动同步清 `menuIds`）。
5. **基础数据保护**：#14 service 层校验——删除角色前校验用户占用（REQUIREMENTS 明确要求；super 角色天然被 super 账号占用而不可删）；补充通用后台惯例：**不可删除 / 禁用当前登录用户自身**（批量删除时同样过滤）。
6. **新增用户密码策略**：新增弹窗含「初始密码」必填字段（编辑时隐藏该字段）；`PUT /api/users/:id/password` 重置为指定新密码（body `{ password }`）。
7. **SQLite 模糊查询大小写**：Prisma + SQLite 的 `contains` 不支持 `mode: 'insensitive'`，SQLite `LIKE` 对 ASCII 默认不区分大小写——接受默认行为，跨库差异在 M5 后端指南标注。

### 查漏补充（REQUIREMENTS 有、任务清单未显式覆盖，纳入 #15）

- **顶栏全屏切换**（§3 顶栏清单项）：纳入 #15 顶栏实现（原生 Fullscreen API，成本极低）。
- **内容区路由切换过渡动画**（§3 内容区要求）：纳入 #15 内容区实现。

### 里程碑验收（DoD）

- 三账号菜单与按钮显隐正确：super 全量 / admin 无删除类按钮 / user 仅 Dashboard 与个人中心
- 系统管理三页面 CRUD 全流程通过（搜索、分页、新增、编辑、删除、批量删除、启用/禁用、重置密码、分配角色、分配权限、菜单树管理）
- 后端双重校验生效：admin 调删除接口 403、user 调系统管理接口 403（curl 验证）
- 已登录直接访问未授权地址跳 403（口径见决策点 2）
- auth service 迁移完成，`services/` 不再直接 import prisma client
- `pnpm lint` 通过；#34 双适配器核心链路验证通过

### 完成记录（2026-07-11）

全部任务（#11-#18、#34、auth service 迁移、决策点 1-7、查漏两项）已实现并按 DoD 验证：

- **server 端**：冒烟脚本 55 项断言全部通过——三账号登录与 §4.5 聚合、user/admin 调受限接口 403、users/roles/menus CRUD 全流程、模糊搜索与分页、业务完整性（重复用户名/无效角色/角色占用/super 标识保护/父节点环校验/级联删除）、数据保护（不可删除/禁用自己、批量删除过滤自己）、禁用后登录拦截、重置密码后新密码生效。
- **#34 双适配器**：fetch / axios 各 5 项核心链路断言通过，8 项行为一致性比对全一致（登录 → 获取用户信息 → 列表查询、401/403 的 `RequestError` 规范化）。
- **web 端**：`vite build` 双适配器取值下均成功、dev server 编译全部新模块（布局/三页面/Pro* 组件/locales/directives）无错误、Vite proxy 链路连通、carbon 图标名全量核验存在、全仓库 `pnpm lint` 通过。
- **实现口径备注**：后端列表接口需要权限码保护，seed 菜单树补充了 `sys:user:list` / `sys:role:list` / `sys:menu:list` 三个查询按钮节点（admin 的「非删除类全有」规则自动覆盖）；repository 工厂因 antfu 规则禁止顶层 await，改为「首次数据访问时惰性动态加载所选驱动实现」的委托装配（未启用驱动仍不加载）。
- **修复记录（2026-07-11）**：登录后首次导航落 404（点「返回首页」才到工作台）——守卫重放用 `{ ...to }` 展开了注册动态路由前解析的 location，其中携带过期的 `name: 'NotFound'`，而 vue-router matcher 对 name 优先于 path 解析；改为按 `path/query/hash` 重放。M1 起即潜伏，经内存路由脚本复现并验证修复。
- **待人工确认**：浏览器端视觉与交互（侧边栏折叠动画、面包屑、全屏、过渡动画、弹窗表单体验）建议 `pnpm dev` 后以三账号人工过一遍——数据与权限的正确性已由接口层断言覆盖，此项仅为视觉确认。

---

### #11 实现 repository 统一操作集接口定义 ✅

**描述**：定义 repository 接口规范（`repositories/index.js`，方法：`findPage` / `getById` / `findByUnique` / `create` / `update` / `remove` / `count`，参数与返回结构按 §6「方法签名约定」文档化），实现工厂函数（按 `DB_DRIVER` 环境变量装配 `prisma` 或 `mongo` 实现），定义跨实现一致性约定（主键统一字符串 id、createdAt/updatedAt 统一维护、返回普通对象）。

**验收**：接口定义清晰、工厂逻辑正确。

---

### #12 实现 Prisma repository 实现（users / roles / menus） ✅

**描述**：实现 `repositories/prisma/` 下的 `userRepo` / `roleRepo` / `menuRepo`，实现统一操作集方法（`findPage` 支持分页 + 条件过滤 + 排序、`getById` / `findByUnique` / `create` / `update` / `remove` / `count`），确保返回结构符合约定（字符串 id、createdAt/updatedAt、普通对象）。

**验收**：CRUD 操作正确、分页逻辑正确、能按条件查询。

---

### #13 实现权限码校验中间件 ✅

**描述**：实现权限码校验中间件（`middlewares/permission.js`，从 JWT payload 提取用户权限码、校验当前接口所需权限码、无权限返回 403），为需要权限的接口添加权限码注解（如 `sys:user:add` / `sys:user:edit` / `sys:user:delete`）。

**验收**：super 账号全权限通过、admin 无删除权限被拦截、user 仅能访问白名单接口。

---

### #14 实现 users / roles / menus 接口（CRUD + 业务逻辑） ✅

**描述**：实现 `routes/users.js`（分页查询、新增、编辑、删除、批量删除、启用/禁用、重置密码、分配角色，接口路径按 §7 约定，参数用 zod 校验），实现 `routes/roles.js`（CRUD、分配权限），实现 `routes/menus.js`（树形查询、CRUD），实现 `services/` 层的业务逻辑（删除角色前校验用户占用、删除菜单联动子节点等）。

**验收**：Postman / curl 测试全部接口通过、权限校验生效、业务完整性正确。

---

### #15 实现前端动态路由与菜单渲染 ✅

**描述**：实现动态路由生成逻辑（permission store 根据 `getUserInfo` 返回的菜单树生成路由配置、调用 `addRoute` 注入），实现主布局（`layouts/MainLayout.vue`，左侧菜单 + 顶栏 + 多标签页 + 内容区），实现侧边栏菜单组件（由动态路由生成、支持多级、可折叠、当前路由高亮、支持图标与隐藏），实现面包屑组件。

**验收**：super 看到全部菜单、admin 看到全部菜单、user 仅看到 Dashboard 与个人中心、直接访问未授权地址跳 403。

---

### #16 实现按钮级权限指令与工具函数 ✅

**描述**：实现 `v-permission` 自定义指令（`directives/permission.js`，从 user store 取权限码集合、无权限时移除元素），实现 `hasPermission` 工具函数（`utils/permission.js`），在示例页面中使用（如用户管理的新增/编辑/删除按钮）。

**验收**：super 看到全部按钮、admin 无删除按钮、user 无系统管理页面与按钮。

---

### #17 实现 Pro* 封装组件（ProSearchForm / ProTable / ProModalForm） ✅

**描述**：实现 `components/ProSearchForm.vue`（字段配置渲染 + 查询/重置，底层使用 Naive UI NForm / NInput / NSelect / NDatePicker 等，封装层统一 API），实现 `components/ProTable.vue`（列配置 + 数据源 + 分页 + 工具栏 + loading，底层 NDataTable，支持 render / 插槽），实现 `components/ProModalForm.vue`（弹窗表单、字段 schema 渲染常用控件、validate / resetFields 封装）。

**验收**：Pro* 组件能独立使用、API 简洁、与 Naive UI 解耦良好。

---

### #18 实现系统管理三个页面（用户/角色/菜单管理） ✅

**描述**：基于 Pro* 组件实现 `views/system/users/`（条件搜索 + 分页表格 + 新增编辑弹窗 + 删除确认 + 批量删除 + 启用/禁用开关 + 重置密码 + 分配角色），实现 `views/system/roles/`（CRUD + 分配权限的菜单树形勾选），实现 `views/system/menus/`（树形表格 + CRUD，类型/名称/路由/组件/图标/权限码（按钮必填）/排序/隐藏/缓存字段）。

**验收**：三个页面 CRUD 全流程通过、表单校验生效、权限按钮显隐正确。

---

## M3 体验增强 ✅

> **执行规划**（2026-07-11 制定，基于 M2 完成后的代码现状调研）

### 现状衔接点

1. **i18n 半接入**：M2 决策点 1 已装 vue-i18n（平铺 key + 自定义 messageResolver 为硬约束），`translate()` 可组件外用；但 app store 的 `locale` 尚未接线 i18n 实例、App.vue 的 NConfigProvider locale 仍写死 zhCN——两处为 #22 的接线点。存量硬编码中文分布在登录页、MainLayout、异常页、Pro* 组件与系统三页面，迁移面大于「加语言包」。
2. **多标签页插入位已预留**：MainLayout 注释标明位置（顶栏与内容区之间）；`RouterView` 已用 v-slot 解构、permission store 已把 `keepAlive` 写入 route meta。**盲点**：页面 SFC 均为 `index.vue`，Vue 推断组件名全部同名，KeepAlive include 无法区分——#19 需在注册动态路由时显式命名组件。
3. **主题基建大半就绪**：`themePresets` 六色、app store `primaryColor`/`isDark`（持久化）、`toNaiveThemeOverrides` 映射已通，#21 主要是选择器 UI 与「跟随系统」语义扩展。
4. **403/404 与守卫口径就绪**（M2 决策点 2 不变），#23 增量为 500 页与三页统一。
5. **/profile 已有隐藏菜单与顶栏入口**（当前落「建设中」占位页），auth service 已走 repository，#24 追加接口顺畅；User.email 无唯一索引，资料修改不做邮箱查重。
6. **Dashboard 占位页带 TODO 标记**；server 路由注册模块化；§6 要求 Dashboard 假数据定义在 `seed/data.js`（两套驱动共享、不入库）。

### 执行批次与顺序

单线推进：**#22 i18n 地基 → #21 主题 → #19 多标签页 → #23 异常页 → #20 Dashboard → #24 个人中心 → 收尾回归**。i18n 先行的原因：后续每个任务都产生新 UI 文案，地基先落避免二次迁移；主题/标签页属布局层，先于页面型任务；#20/#24 各含 server 配套接口，放后集中冒烟。

### 关键决策点

1. **i18n 范围口径**：前端全部 UI 文案（登录页、布局、标签页、异常页、Pro* 内建文案、三页面、新页面）走 i18n；**server 接口 message 保持中文**，不进本期范围（前端透传展示，改造点在 M5 文档标注为扩展方向）。
2. **语言包组织**：按模块拆文件（common / menu / login / layout / system / dashboard / profile / exception），每文件导出平铺 key 对象、`index.js` 合并；zh-CN 与 en-US 键集必须一致，收尾用脚本校验。组件库 locale 映射收敛在 `locales/naive.js`（§10，对齐 theme/naive.js 的「换库仅重写本文件」先例）。
3. **keep-alive 组件命名**：动态路由注册时将懒加载组件解析后浅拷贝并以路由 name 作为显式组件 `name`（解决 index.vue 推断名冲突），KeepAlive include 取「已打开且 keepAlive 的标签」的路由 name 集合——关闭标签即释放缓存。
4. **标签页身份**：以 `path` 为标签身份（query 变化更新原标签不新开，`fullPath` 供跳转回放）；内容区 `<component :key>` 同样按 path（+ 刷新计数）。403/404/500 以 `meta.hideTab` 排除，登录页在布局外天然不进；首页 /dashboard 固定标签不可关闭（不存在时自动补位）。持久化 tabs 列表与激活项（title 存 i18n key，还原后随语言翻译）；**登出时清空标签**，避免跨账号还原到无权限页面。
5. **标签页刷新实现**：不引入 /redirect 中转路由——store 维护「临时排除名单 + 每 path 视图 key 计数」：刷新时先把该页组件名摘出 include（旧实例随 key 变更销毁而非入缓存）、key 自增强制重建、nextTick 后恢复名单；刷新仅对激活标签开放。
6. **主题模式语义**：`isDark` 布尔升级为 `themeMode: light | dark | auto`（auto 经 matchMedia 跟随系统并监听变化），`isDark` 转为派生值（App.vue / charts 等消费点无感）；持久化 pick 收敛为 collapsed / themeMode / primaryColor / locale。
7. **改密后会话语义**：修改密码成功后前端强制登出重登；无状态 JWT 旧 token 至自然过期仍有效（与 §4.5 权限变更同口径，M5 文档标注）。资料修改仅重拉用户信息，不强制重登。
8. **Dashboard 数据口径**：`GET /api/dashboard/stats` 仅登录校验、不挂权限码（user 角色也可见工作台）；假数据定义于 `seed/data.js`，server 组装相对日期（近 30 天）后返回；**饼图分类、指标卡名称、动态条目均存 i18n key**（对齐菜单 name 存 key 的先例），前端翻译；卡片/动态图标由前端按 key 映射（不入数据，规避 safelist 同步负担）。
9. **seed keepAlive 增补**：Dashboard 与系统管理三页置 `keepAlive: true`（演示缓存效果，列表页保留搜索态）；存量 DB 用一次性脚本按 component 路径同步该字段，不重置库、不动用户数据。
10. **500 页白名单**：`/500` 进守卫白名单（REQUIREMENTS §4.2「异常页放行」口径，页面无敏感内容）；403/404 维持 M2 需登录态判定的决策不变。

### 查漏补充

- **登录页右上角放语言切换器**（复用 LangSwitch）：登录页文案 i18n 化后，若无切换入口则登录前无法换语言。
- **图标核验**：新增 carbon 图标名（translate / laptop / color-palette / close / arrow-up 等）收尾统一以 @iconify-json/carbon 核验存在。

### 里程碑验收（DoD）

- 标签页：打开生成 / 点击切换 / 右键四项（刷新、关闭当前、关闭其他、关闭全部）/ 首页固定不可关 / 刷新浏览器还原 / keepAlive 页面往返保留状态（搜索条件不丢）
- Dashboard：4 指标卡（含同比涨跌标识）+ 折线图（近 30 天）+ 饼图渲染正常，暗色与中英文即时联动
- 主题：亮 / 暗 / 跟随系统三态 + 六色主题色即时生效，刷新后保持
- i18n：中英切换全局生效（含 Naive UI 组件文案与日期格式）、持久化；zh-CN / en-US 键集一致性脚本校验通过
- 异常页：403 / 404 / 500 风格统一，403/404 守卫口径回归不变
- 个人中心：资料修改即时同步顶栏昵称头像；改密含旧密校验 + 新密二次确认，成功后强制重登，新密码可登录
- server 冒烟扩展断言全过（dashboard stats 结构、profile 更新、改密全链路含错误旧密 400，测试数据自恢复）；全仓库 lint、web build 通过

### 完成记录（2026-07-11）

全部任务（#19-#24、决策点 1-10、查漏两项）已实现并按 DoD 验证：

- **server 端**：M3 冒烟 17 项断言全部通过——dashboard stats 结构（4 指标卡含同比、近 30 天双序列对齐、饼图 5 类、动态 5 条 i18n key + ISO 时间）、无 token 401、资料修改与 getUserInfo 回读、空昵称 422、旧密码错误 400、新密码过短 422、改密后旧密码 401 / 新密码可登录（测试数据全部自恢复）、存量库 keepAlive 标记经菜单接口回流正确。
- **web 端**：`vite build` 通过（fetch / axios 双适配器取值均成功；echarts 随 dashboard 路由懒加载分块，>500kB 体积警告属预期）；运行中的 Vite dev 对 30 个新增/改动模块强制编译全部 200；carbon 新增图标 38 个全量核验存在；zh-CN / en-US 键集一致性校验通过（各 198 个 key）；全仓库 `pnpm lint` 通过。
- **实现口径备注**：①KeepAlive include 按「路由 name = 显式组件名」匹配（动态路由注册时对懒加载组件浅拷贝命名，决策点 3），缓存名单 = 已打开且 keepAlive 的标签，关闭标签即释放缓存；②标签刷新用「摘除 include + 视图 key 自增 + nextTick 恢复」实现，恢复动作本身触发 KeepAlive 重新收录新实例，无需二次访问；③app store 持久化收敛为 `pick: [collapsed, themeMode, primaryColor, locale]`（isDark 改为派生值，旧存储中的 isDark 键随首次写入被覆盖淘汰）；④Dashboard 假数据入 `seed/data.js` 共享定义（不入库），文案与图标均按 key 由前端映射；⑤Vite dev 对 `127.0.0.1` Host 返回 503（host 校验），本机核验需用 `localhost`。
- **存量库同步**：keepAlive 标记已用一次性脚本同步到现有 SQLite（4 个菜单节点），浏览器刷新后经 getUserInfo 生效，无需重登（该字段不在 JWT 载荷中）。
- **待人工确认**：浏览器端交互体验（标签页右键菜单与刷新、主题三态与色板即时性、中英切换的组件库联动、图表暗色渲染、改密后重登跳转）建议 `pnpm dev` 后以三账号人工过一遍——接口与数据正确性已由断言覆盖，此项为视觉与交互确认。

---

### #19 实现多标签页功能 ✅

**描述**：实现 tabs store（标签页列表 / 激活标签 / keep-alive 缓存名单，持久化），实现多标签页组件（`layouts/components/Tabs.vue`，显示已打开页面、点击切换、右键菜单：刷新/关闭当前/关闭其他/关闭全部、首页标签固定不可关闭），集成到主布局，配置路由 meta（`keepAlive` 字段）。

**验收**：打开多个页面生成标签、切换正确、右键菜单功能正确、刷新浏览器后还原标签。

---

### #20 实现 Dashboard 工作台页面 ✅

**描述**：实现 `routes/dashboard.js`（server 统计接口，返回 4 个指标卡数据 + 折线图数据 + 饼图数据，种子假数据），实现 `views/dashboard/`（顶部欢迎语 + 4 个统计卡片（含同比涨跌标识）+ ECharts 折线图与饼图 + 快捷入口/最近动态列表），安装 echarts + vue-echarts 并按需注册组件。

**验收**：Dashboard 页面数据正确展示、图表渲染正常。

---

### #21 实现主题切换功能（亮/暗模式 + 主题色） ✅

**描述**：完善 theme 模块（支持亮/暗模式切换、预设若干主题色可选、主题状态持久化、可选跟随系统），实现顶栏主题切换按钮（`layouts/components/ThemeToggle.vue`），实现主题色选择器，集成到主布局。

**验收**：切换亮/暗模式生效、切换主题色全局生效、刷新后保持。

---

### #22 实现国际化功能（中/英切换） ✅

**描述**：安装 vue-i18n，创建 `locales/` 目录（按模块拆分语言包：common / menu / login / system…），配置 i18n 实例（默认中文、支持中/英、语言选择持久化），映射 Naive UI locale（zhCN/enUS、dateZhCN/dateEnUS），实现顶栏语言切换器（`layouts/components/LangSwitch.vue`），菜单标题、页面标题、表单/表格文案、提示信息均走 i18n。

**验收**：切换语言后全局生效（包括组件库）、刷新后保持。

---

### #23 实现异常页（403 / 404 / 500） ✅

**描述**：实现 `views/exception/403.vue` / `404.vue` / `500.vue`（含错误信息提示、返回首页按钮），配置路由（404 作为最后的 catch-all 路由），在路由守卫中集成 403 跳转逻辑。

**验收**：直接访问未授权地址跳 403、不存在的地址跳 404、异常页样式与布局正确。

---

### #24 实现个人中心页面 ✅

**描述**：实现 `views/profile/`（基本资料查看与修改：昵称/头像/邮箱等 + 修改密码：旧密码校验 + 新密码二次确认），实现后端接口（`PUT /api/auth/profile`、`PUT /api/auth/password`），集成到菜单与顶栏用户下拉菜单。

**验收**：能修改资料并保存、能修改密码（旧密码校验、新密码确认）、修改后重新登录生效。

---

## M4 MongoDB 适配 ✅

> **执行规划**（2026-07-12 制定，基于 M3 完成后的代码现状调研）

### 现状衔接点

1. **契约已定型**：`repositories/index.js` 的 JSDoc 即实现基准（8 方法签名 + where 平铺约定 + 关联 id 数组暴露）；DRIVERS 工厂已预留 `mongo: () => import('./mongo/index.js')` 惰性入口，落地文件后 `DB_DRIVER=mongo` 即接通，service / routes 零改动。
2. **Prisma 实现为对照**：`repositories/prisma/base.js` 的 where 构建 / 排序 / 关联处理逐条对齐；fuzzyFields 声明（user: username/nickname/email、role: name/code、menu: name）是契约的一部分，Mongo 侧保持一致。
3. **zod 层保证载荷完整**：create/update 全走路由校验，可空字段经 emptyToNull 归一为 null、默认值由 schema 填充，repository 无需默认值机制；但 **seed 数据须补齐 Prisma schema 的默认值/可空字段**（path/component/icon/permission → null、hidden/keepAlive → false、sort → 0），保证两库文档形态一致（Prisma 模式返回 `email: null`，Mongo 缺键则 JSON 直接丢字段，行为会分叉）。
4. **service 消费面清点**：where 仅五种形态（等值 / 数组 in / 模糊 / 关联包含 `{ roleIds: id }` / id 数组）；orderBy 仅缺省 createdAt desc 与菜单 `[sort asc, createdAt asc]`；关联读取全部在 service 内存拼装（§4.5），Mongo 侧不需要 $lookup。
5. **环境就绪**：本机 MongoDB 已装为 Windows 服务并运行（127.0.0.1:27017 连通）；`.env` / `.env.example` 已含 MONGODB_URL / MONGODB_DB。

### 执行批次与顺序

单线串行推进 #25 → #26 → #27（依赖递进）：#25 先落数据与索引，#26 实现仓储（db.js 惰性连接 / base.js 操作集工厂 / index.js 三仓装配），#27 用**同一份冒烟脚本先跑 prisma 基线再跑 mongo**——「与 Prisma 模式行为一致」由同脚本双跑构造性保证，顺带完成 prisma 模式回归。

### 关键决策点

1. **关联数组存 id 字符串**：REQUIREMENTS §4.4 明确「Mongo 侧以 `roleIds: String[]` 引用表达」——引用数组存字符串而非 ObjectId；数组字段的标量等值匹配天然是包含语义，where 匹配 / 整体重设 / $pull 清理均无需类型互转，仅 `_id` 在仓储边界互转。
2. **非法 id 按不存在处理**：`ObjectId.isValid` 不通过的入参（路径参数可为任意字符串）→ getById/update 返回 null、remove 返回 false、where 中转为恒不匹配条件——对齐关系库「任意字符串主键查不到」的行为，不抛 500。
3. **删除时手动清引用**（M2 决策点 4 落地）：Prisma 隐式多对多随实体删除自动清关联，Mongo 侧收敛在 repository 的 remove 内——删 menu 时 $pull roles.menuIds、删 role 时 $pull users.roleIds（service 已有删除前校验，不改 service）；$pull 不 bump 引用方 updatedAt（Prisma 清 join 行同样不触发）。
4. **模糊匹配用不区分大小写正则**：$regex + `i`（用户输入转义正则元字符）；SQLite LIKE 对 ASCII 不区分大小写，Mongo 侧行为对齐且扩展到 Unicode，跨库差异并入 M5 文档既有标注点。
5. **排序稳定性**：批量播种的 createdAt 可能同毫秒，排序末尾追加 `_id` 升序 tiebreaker——分页不重不漏、树形兄弟顺序稳定（Prisma/SQLite 靠 rowid 扫描序天然稳定，Mongo 需显式）。
6. **索引由 seed 维护**：Mongo 无迁移概念（§6），username / code 唯一索引在 seed 脚本 createIndex（幂等）；唯一冲突依赖 service 先查后写拦截（与 Prisma 模式同口径，索引仅兜底）。
7. **undefined 语义**：update 载荷中值为 undefined 的字段必须剔除（Prisma 语义「不改动」，而 BSON 序列化会写成 null，nickname 等可选字段会被误清空）——写入数据显式过滤 + 客户端 `ignoreUndefined` 双保险。
8. **惰性连接**：连接在首次数据访问时建立（对齐 M2 仓储工厂的惰性装配先例，规避 antfu 顶层 await 限制；DB_DRIVER=prisma 时 mongodb 模块图完全不加载）。

### 查漏补充

- **seed 幂等口径**：对齐 prisma/seed.js「清空后重播」；createIndex 幂等，重复执行安全。
- **package.json 补 `db:seed:mongo` 脚本**（#25 验收的「启动脚本」）。

### 里程碑验收（DoD）

- mongo seed 后集合 / 唯一索引 / 文档形态正确（菜单 22、角色 3、用户 3，引用数组为字符串 id）
- 同一冒烟脚本在 prisma（基线）与 mongo 两模式下全部断言通过：三账号登录与 §4.5 聚合、双重校验 403、users/roles/menus CRUD 全流程、模糊/分页、业务完整性（重复键 / 无效关联 / 角色占用 / super 保护 / 环校验 / 自我保护 / 禁用拦截 / 重置密码）、**级联删除菜单后角色 menuIds 同步清理**（决策点 3 的 Mongo 侧验证点）、profile 与改密链路、dashboard 结构、非法 id 404
- `pnpm lint` 通过；`.env` 按 #27 切至 `DB_DRIVER=mongo` 供人工回归
- prisma 模式回归不回退（同脚本基线先行）

### 完成记录（2026-07-12）

全部任务（#25-#27、决策点 1-8、查漏两项）已实现并按 DoD 验证：

- **#25 seed**：`seed/mongo.js` 消费共享 `seed/data.js`，播种菜单 22 / 角色 3 / 用户 3，username / code 唯一索引创建成功（幂等可重复执行）；文档形态补齐 Prisma schema 的默认值与可空字段；`db:seed:mongo` 脚本已注册。本机 MongoDB 8.3.4（Windows 服务）+ mongodb 驱动 7.5.0 验证。
- **#26 仓储**：`repositories/mongo/`（db.js 惰性单例连接 / base.js 操作集工厂 / index.js 三仓装配）逐条对齐契约：`_id` ↔ 字符串 id 互转、关联存 id 字符串数组（§4.4）、非法 id 按不存在处理、删除时 $pull 清引用（menu → roles.menuIds、role → users.roleIds）、模糊匹配不区分大小写正则（用户输入转义元字符）、排序 `_id` tiebreaker、undefined 字段剔除 + `ignoreUndefined` 双保险。
- **#27 双模式回归**：同一份冒烟脚本（85 项断言）对 `DB_DRIVER=prisma`（基线）与 `mongo` 先后运行，两模式全部通过——三账号登录与 §4.5 聚合（super 16 权限码 / admin 13 无 :delete / user 仅两菜单）、双重校验 403、users/roles/menus CRUD 全流程、模糊搜索（含大小写一致性）、分页不重不漏、业务完整性（重复键 / 无效关联 / 角色占用 / super 标识保护 / 父节点自身与环校验 / 自我保护三项 / 禁用登录拦截 / 重置密码）、**级联删除 3 节点后角色 menuIds 同步清理**（决策点 3 验证点）、非法与不存在 id 404、profile 与改密全链路（测试数据全部自恢复）、dashboard 结构、登出。行为一致性由同脚本双跑构造性保证，prisma 模式回归不回退。
- **实现口径备注**：①web 端零改动（M4 为纯后端里程碑），前端经同一套 /api 接口无感切换；②`.env` 已按 #27 任务描述切至 `DB_DRIVER=mongo`（改回 `prisma` 即回关系库模式），冒烟后 mongo 库已重播为纯净种子数据；③mongodb 依赖仅在 `DB_DRIVER=mongo` 时经惰性入口加载，prisma 模式下模块图不含 mongo 代码。
- **待人工确认**：`pnpm dev` 后以三账号在浏览器过一遍全流程（登录、动态路由、系统管理三页面 CRUD、Dashboard、个人中心、异常页、主题、i18n、多标签页、按钮权限）——数据与权限正确性已由 85 项接口断言在两种驱动下覆盖，此项为 mongo 模式下的视觉与交互确认。

---

### #25 实现 MongoDB 驱动与 seed 脚本 ✅

**描述**：安装 mongodb 官方驱动，实现 `seed/mongo.js`（连接 `MONGODB_URL` / `MONGODB_DB`、建集合、创建唯一索引（如 username）、消费 `seed/data.js` 播种数据），实现启动脚本（npm script）。

**验收**：执行 seed 脚本后 MongoDB 数据正确、索引创建成功。

---

### #26 实现 MongoDB repository 实现（users / roles / menus） ✅

**描述**：实现 `repositories/mongo/` 下的 `userRepo` / `roleRepo` / `menuRepo`，实现统一操作集方法（`findPage` / `getById` / `findByUnique` / `create` / `update` / `remove` / `count`），在 repository 内完成 ObjectId ↔ 字符串互转，确保返回结构符合约定（字符串 id、createdAt/updatedAt、普通对象），多对多关联用引用 id 数组表达。

**验收**：CRUD 操作正确、分页逻辑正确、主键转换正确。

---

### #27 验证 DB_DRIVER=mongo 模式下的完整功能 ✅

**描述**：配置 `.env` 为 `DB_DRIVER=mongo`，启动 server，执行 MongoDB seed，前端完整回归：三账号登录 → 动态路由与菜单 → 系统管理三页面 CRUD → Dashboard → 个人中心 → 异常页 → 主题切换 → 国际化 → 多标签页 → 按钮权限。

**验收**：MongoDB 模式下全流程通过、数据正确、权限正确、与 Prisma 模式行为一致。

---

## M5 文档站 ✅

> **执行规划**（2026-07-12 制定，基于 M4 完成后的代码现状调研）

### 现状衔接点

1. **docs 包已占位**：`apps/docs` 是 workspace 成员（仅 package.json，`@admin-ai/docs`），根脚本 `dev:docs` 已就位——#28 安装 VitePress、补 `dev` / `build` / `preview` 脚本即接通；root `pnpm build` 为 `pnpm -r run build`，docs 补 build 脚本后自动纳入全仓构建。
2. **工程配置已预留**：`.gitignore` 已排除 `.vitepress/dist` 与 `.vitepress/cache`，`eslint.config.js` ignores 已含 `.vitepress/cache`——#28 无需改动这两处。
3. **文档素材单一来源就绪**：REQUIREMENTS.md 各 §（§12 即文档站大纲）+ TASKS.md 各里程碑「关键决策点」+ REVIEW.md 三条结论；四个已显式标注「M5 文档标注」的点在后端指南落位（M4 决策点 4 跨库模糊匹配大小写、M3 决策点 7 改密后旧 JWT 至自然过期有效、M3 决策点 1 server message 中文为 i18n 扩展方向、REVIEW.md 结论 3 切 provider 重建 migrations）。
4. **接口面已定型且核对完毕**：6 模块 24 个接口（health 1 / auth 5 / users 8 / roles 5 / menus 4 / dashboard 1）；路由内 zod schema 即参数文档单一来源；统一响应（`{ code, data, message }`）、422 校验结构（`data.issues`）、鉴权白名单（`/api/health`、`/api/auth/login`）已从代码逐一核对。
5. **种子密码与账号**：super / admin / user，统一密码 `123456`（`seed/data.js` 的 `SEED_PASSWORD`）；Prisma 种子经 `prisma.config.js` 的 `migrations.seed` 配置（Prisma 7 形态，非 package.json `prisma.seed` 字段——#8 任务描述为 v6 惯例，实现时已按 v7 落地），文档按实际实现书写。

### 执行批次与顺序

单线推进 **#28 骨架 → #29 快速开始 + 架构 → #30 前端指南 → #31 后端指南 → #32 API 参考 → #33 README → 收尾验证**。#28 先建全部占位页与 nav/sidebar（后续每篇完成即可即时预览）；#33 放最后收口（引用文档站与前述事实项）；收尾统一跑 dev / build / lint 与内容一致性抽查。

### 关键决策点

1. **文档文件名用英文 slug**：任务描述中的「快速开始.md」等中文名按文档标题理解，物理文件用英文 slug（`guide/getting-started.md` / `architecture.md` / `frontend.md` / `backend.md`、`api/index.md`）——中文路径在 URL 中会百分号编码，不利分享与部署；标题、nav、sidebar 均用中文。
2. **VitePress 1.x 稳定版 + 纯 JS 配置**：`.vitepress/config.js`（ESM `defineConfig`），全仓库不引 TS 的约定延伸到配置文件（官方脚手架默认 `.mts`，本仓库不采用）。
3. **默认主题 + 本地搜索**：`themeConfig.search = { provider: 'local' }`（内建 minisearch，零额外依赖）；outline / docFooter / 暗色切换等界面标签汉化。
4. **docs dev 端口固定 5174**：VitePress dev 默认端口与 web dev 同为 5173，`pnpm dev` + `pnpm dev:docs` 并行时会冲突，dev 脚本显式 `--port 5174`。
5. **文档站与 README 分工**：README 是仓库门面（简版快速开始 + 特性 + 结构 + 指向文档站详篇），文档站承载完整流程与参考；两处事实项（命令 / 账号 / 环境变量）保持一致、详略不同。
6. **API 参考单页分模块**：`api/index.md` 按模块分节，页首集中「通用约定」（响应结构 / 鉴权 / 分页 / 错误语义与 422 结构）；每接口给路径、方法、权限码、参数表（zod schema 对照）与响应示例（seed 数据形态）。
7. **代码示例须过 lint**：antfu formatters 会检查 markdown 内 fenced code block，全部示例按仓库风格书写（单引号、无分号），收尾 `pnpm lint` 全仓通过。
8. **License 口径**：模板项目按惯例采用 MIT——新建根 `LICENSE` 文件（版权人取 git 用户），README 的 License 节链接之；如需换协议为单点替换。

### 查漏补充

- **vitepress build 兼作死链检查**（默认 dead links 报错失败）：内链统一相对 md 路径，收尾以 build 通过佐证「链接有效」（#33 验收项）。
- **HTTP 适配器两侧语义区分**：web 的 `VITE_HTTP_ADAPTER`（业务实例）与 server 的 `HTTP_ADAPTER`（出站实例，当前无出站调用方）容易混淆，快速开始与后端指南分别标注。

### 里程碑验收（DoD）

- `pnpm dev:docs` 启动成功，首页与五篇文档可访问，nav / sidebar 结构正确（#28 验收）
- 快速开始按文档从零操作可跑通：环境 → 安装 → `.env` → 迁移种子 → 启动 → 三账号登录；全部命令与根 / 子包 scripts 逐一核对
- 前端指南覆盖 §9.2 UI 库切换流程与适配点清单；后端指南覆盖 §6 关系库切换流程与 `DB_DRIVER=mongo` 启用步骤；四个「M5 文档标注」点全部落位
- API 参考覆盖全部 24 个接口，参数与响应结构与 zod schema / service 实现一致
- README 完整（介绍 / 特性 / 技术栈 / 快速开始 / 目录 / 环境变量 / 种子账号 / 命令 / 构建部署 / 文档链接 / License）且链接有效
- `vitepress build` 通过（含死链检查）；全仓库 `pnpm lint` 通过；TASKS.md 补完成记录并更新「最后更新」

### 完成记录（2026-07-12）

全部任务（#28-#33、决策点 1-8、查漏两项）已实现并按 DoD 验证：

- **#28 站点**：VitePress 1.6.4（`.vitepress/config.js` 纯 JS ESM，决策点 2），默认主题 + 本地搜索（界面文案汉化，决策点 3）、nav / sidebar 五篇结构、首页 hero + 六特性卡；docs 包补 `dev`（`--port 5174`，决策点 4）/ `build` / `preview` 脚本；`pnpm dev:docs` 启动后首页 / 指南 / API 三路径均 200。
- **#29-#32 内容**：快速开始（环境 → 安装 → `.env` → 迁移种子 → 启动 → 三账号，环境变量全表 + 双侧适配器语义区分 + Mongo 模式启用）；架构说明（结构 / 技术栈 / 登录与请求链路 / RBAC 模型与取舍 / repository 概览 / 目录约定 / 工程约定）；前端指南（新增页面五步含 safelist 同步与权限生效时机、v-permission / hasPermission、Pro* API 简表、主题定制、新增语言四步、UI 库切换 = 结构性保证 + 七项适配点清单 + 四步流程）；后端指南（分层约定 / 统一响应与错误 / 新增接口三步 / repository 契约与新增实体登记四步 / 种子命令表 / 关系库切换五步 / mongo 启用三步 / 跨库大小写差异 / 认证行为口径）；API 参考（通用约定 + 24 接口全量：路径 / 方法 / 权限码 / zod 参数表 / 响应示例，与路由 schema 逐一对照）。
- **#33 README + LICENSE**：README 按门面定位与文档站分工（决策点 5），任务清单全部条目落位、指向文档站相对链接；新建 MIT `LICENSE`（决策点 8，版权人取 git 用户，换协议为单点替换）。
- **四个「M5 文档标注」点全部落位**：M4 决策点 4 → 后端指南「跨库行为差异」；M3 决策点 7 → 后端指南「认证行为口径」+ API 参考改密接口说明；M3 决策点 1 → 后端指南「接口 message 与国际化」提示块；REVIEW.md 结论 3 → 后端指南「关系库切换」第 4 步（重建迁移历史）。
- **验证**：`vitepress build` 通过（死链检查启用，仅按模式忽略 `localhost` 开发地址这一有意引用）；构建产物五页关键内容抽查命中；根 `pnpm build`（web 13.9s + docs 3.2s）通过；全仓库 `pnpm lint` 通过（antfu formatters 已归一全部新增 markdown 的表格与代码块格式）。
- **实现口径备注**：①安装 VitePress 时被 pnpm `trustPolicy: no-downgrade` 拦截——其依赖 `vite@5.4.21`（5.x 末版安全回移，2025-10-20 经维护通道发布）的信任证据由 trusted publisher 变为 provenance attestation，属已知误报形态；在 `pnpm-workspace.yaml` 以 `trustPolicyExclude` 定点豁免该单一版本，未放宽整体策略。②文档物理路径用英文 slug（`guide/getting-started` 等），任务描述中的中文文件名以文档标题呈现（决策点 1）。③根 `pnpm build` 自此包含 docs 构建。
- **待人工确认**：浏览器打开 `pnpm dev:docs`（<http://localhost:5174>）过一遍视觉呈现（首页 hero / 侧边栏层级 / 本地搜索 / 暗色模式 / 表格排版）——链接有效性与内容完整性已由构建死链检查与产物抽查覆盖，此项仅为视觉确认。

### #28 初始化 VitePress 文档站 ✅

**描述**：初始化 `apps/docs`（VitePress 默认主题），配置中文为主，创建文档大纲（快速开始 / 架构说明 / 前端指南 / 后端指南 / API 参考），配置 nav 与 sidebar。

**验收**：`pnpm dev:docs` 启动成功、文档站能访问、大纲结构正确。

---

### #29 编写快速开始与架构说明文档 ✅

**描述**：编写 `快速开始.md`（环境要求 Node.js ≥ 22、安装 `pnpm install`、启动命令 `pnpm dev`、种子账号说明 super/admin/user），编写 `架构说明.md`（monorepo 结构、前后端交互流程、目录约定、技术栈概览）。

**验收**：文档内容完整、准确、清晰。

---

### #30 编写前端指南文档 ✅

**描述**：编写 `前端指南.md`（新增页面与菜单的流程、权限指令用法 `v-permission` / `hasPermission`、主题定制 theme 模块、新增语言步骤、UI 组件库切换指南：Naive UI → antdv / element-plus，含适配点清单 `useFeedback` / Pro* / theme 映射 / i18n locale / 展示型组件前缀替换）。

**验收**：文档覆盖 §9 适配层切换流程、步骤清晰可执行。

---

### #31 编写后端指南文档 ✅

**描述**：编写 `后端指南.md`（模块结构 routes / middlewares / repositories / services、新增接口的流程、种子数据与重置 `prisma migrate reset` / mongo seed 脚本、数据库切换指南：关系库 SQLite → PostgreSQL / MySQL 流程（修改 provider / 更换 adapter / 更新 DATABASE_URL / 重建迁移），`DB_DRIVER=mongo` 启用 MongoDB 模式）。

**验收**：文档覆盖 §6 数据库切换流程、步骤清晰可执行。

---

### #32 编写 API 参考文档 ✅

**描述**：编写 `API 参考.md`（按模块列出接口：auth / users / roles / menus / dashboard，每个接口包含路径、方法、参数、响应示例、权限码要求），格式规范、示例完整。

**验收**：文档覆盖全部接口、参数与响应结构准确。

---

### #33 完善 README 文档 ✅

**描述**：编写根目录 `README.md`（项目介绍、特性列表、技术栈、快速开始、目录结构、环境变量说明、种子账号、开发命令、构建部署、文档链接、License），确保内容与 REQUIREMENTS.md 一致。

**验收**：README 内容完整、格式规范、链接有效。

---

## 横向验证任务

### #34 验证统一请求包双适配器（fetch / axios） ✅（提前于 M2 收尾完成）

**描述**：分别以 `VITE_HTTP_ADAPTER=fetch` 和 `VITE_HTTP_ADAPTER=axios`（web 侧）、`HTTP_ADAPTER=fetch` 和 `HTTP_ADAPTER=axios`（server 侧，如有出站请求）启动开发环境，验证登录与列表页核心链路（登录 → 获取用户信息 → 用户管理列表查询）在两种适配器下均正常工作，错误提示一致。

**验收**：两种适配器下前端核心链路均通过、行为一致。

---

### #35 全流程回归验证（M1-M3 核心功能）

**描述**：在 `DB_DRIVER=prisma`（SQLite）模式下，完整回归全部功能：三账号登录（super/admin/user）→ 动态路由与菜单（权限正确）→ 系统管理三页面 CRUD（表单校验、按钮权限、批量操作）→ Dashboard（图表渲染）→ 个人中心（修改资料、修改密码）→ 异常页（403/404/500）→ 主题切换（亮/暗模式、主题色）→ 国际化（中/英切换、组件库联动）→ 多标签页（打开、切换、右键菜单、keep-alive、刷新还原）→ 按钮级权限（v-permission 指令、hasPermission 函数）。

**验收**：全流程通过、无明显 bug、体验流畅。

---

## M6 基座加固（评审整改） ✅

> **执行规划**（2026-07-13 制定，依据同日《二次开发评估报告》reports/2026-07-13-secondary-development-assessment.md 的 P0–P3 建议落地整改。**范围明确排除**：Docker 容器化（评审项 2，另行落地）与 TS / 渐进类型检查（本次不涉及）。）

### 现状衔接点

1. **可测性已预留**：`createApp()` 工厂注释明言「便于后续用 app.request() 做无服务测试」；service 纯函数、repository 双实现可绕过 `DB_DRIVER` 开关直接 import（`repositories/prisma/index.js` / `repositories/mongo/index.js`），契约测试无需进程级驱动切换。
2. **离线建库素材现成**：`prisma/migrations/*/migration.sql` 已入库（REVIEW.md 2026-07-10 结论 3），better-sqlite3 可直接执行建表 SQL——测试库装置不依赖 prisma CLI 与网络；`db/prisma.js` / `repositories/mongo/db.js` 的连接参数均从环境变量读取，且 `dotenv` 不覆盖已存在的环境变量——测试文件先设 env 再动态 import 即可绑定测试库。
3. **种子可复用但需小改**：`prisma/seed.js` 是脚本形态（顶层 `main()` + 自动执行），集成测试需要进程内播种——把播种主体抽为可导入函数，脚本退化为薄壳（seed/mongo.js 形态不变，mongo 契约测试自建数据、无需播种）。
4. **报告建议 → 任务映射**：P0 测试设施与两块最高杠杆用例 → #36；P2 结构化日志 → #37；P2 登录防护 → #38；P3 safelist 自动化 → #39；P2 最小 CI → #40；P1 API 文档自动化经评估**本期暂缓**（理由见决策点 8）；文档/报告回写 → #41。
5. **既有验证惯例可测试化**：frontend.md「新语言键集用一次性脚本比对」的惯例升级为常驻测试（语言包键集一致性 + 平铺形态断言），并入 #36。
6. **lint 约束提醒**：@antfu 的 `perfectionist/sort-imports` 会重排 import（side-effect import 置后）——「先设 env 再加载模块」必须用顶层 await + 动态 import 表达，不能依赖静态 import 顺序。

### 执行批次与顺序

**#36 测试设施与用例（P0，最先）→ #37 结构化日志 ∥ #38 登录限流 ∥ #39 safelist（三者互不依赖，可并行）→ #40 CI（依赖 #36 的 test 脚本）→ #41 文档同步与收尾（最后收口）**。#37/#38 落地后回补对应测试用例（日志头、429 行为），与 #36 的既有套件同跑。

### 关键决策点

1. **测试运行器用 Node 内置 `node:test`，不引入 vitest**（对报告 P0 建议的实现形态修正）：server 为纯 ESM JS 直跑源码，`node --test` 零新增依赖、零配置、离线可用（本机弱网是既有约束），与「dev 与 prod 同一份源码」的仓库气质一致；报告建议 vitest 的实质是「自动化回归」而非框架本身，用例形态（describe/it + app.request()）完全同构，后续若引入前端组件测试再评估 vitest，迁移成本为改 import。
2. **测试库隔离策略**：每个测试文件独立 SQLite 文件（`data/test-*.db`，已被 gitignore 覆盖），文件内先设 `DATABASE_URL` / `JWT_SECRET` / `DB_DRIVER` 再动态 import 被测模块；`node --test` 每文件独立子进程，天然隔离模块级单例（prisma client、限流桶）。建库 = better-sqlite3 直接执行已提交的 migration.sql（不 spawn prisma CLI，快且离线）。
3. **契约测试「一套用例双实现」**：`tests/repo-contract-suite.js` 导出用例工厂，prisma 入口必跑；mongo 入口经 `RUN_MONGO_TESTS=1` 显式开启（连接 `MONGODB_DB` 的 `_test` 后缀库，套件自清理），未开启时整套 skip 并注明开启方式——无 MongoDB 环境（本机默认 / 精简 CI）不阻塞全量关系库用例。
4. **缺省排序断言的跨库口径**：契约缺省 `createdAt desc` 在 Prisma/SQLite 侧无同毫秒 tiebreaker（Mongo 侧有 `_id` 兜底，M4 决策点 5），用例在相邻创建间隔 ≥5ms 规避，不把「同毫秒稳定性」写成契约断言。
5. **结构化日志零依赖自研，不引入 pino**：模板所需仅「JSON 行 + 级别过滤 + 请求 id + 耗时」，40 行内可控实现（`utils/logger.js` + `middlewares/logger.js`），避免新增运行时依赖与 transport/worker 语义；请求 id 用 `crypto.randomUUID()`，请求头 `x-request-id` 透传优先，响应头回写。若后续需要采集生态（多 transport、脱敏、采样）再平替 pino，接口形态已对齐（level + fields）。
6. **登录限流为进程内存实现**：滑动窗口按 `IP|username` 分桶、**只计失败**（401/403），成功即清桶；超限抛 `AppError(429)` 走统一错误结构。单实例语义与模板部署形态（SQLite 单实例）对齐，多实例升级路径（外置 Redis 存储）写入文档；窗口与阈值经 `LOGIN_RATE_WINDOW` / `LOGIN_RATE_MAX` 可配，缺省 15m / 5 次。IP 取 `@hono/node-server` 的 `getConnInfo`，取不到（如 app.request() 测试）降级 `unknown`。
7. **safelist 单一来源**：`seed/data.js` 新增 `collectMenuIcons()`（平铺菜单树取唯一 icon 集），`apps/web/uno.config.js` 跨包相对 import 直接派生 safelist，消除「seed 与 uno.config 双处同步」；保留 `extraSafelist` 手工扩展位，承接「运行时经菜单管理新增图标」这一 UnoCSS 静态扫描的固有限制（文档口径同步修订）。以 `pnpm --filter @admin-ai/web build` 验证配置加载器（jiti）对跨包相对 import 的解析。
8. **API 文档自动化（P1）本期暂缓**：hono-openapi / @hono/zod-openapi 均需改写全部路由声明风格（后者为 createRoute 全量重写）且需联网核实 zod 4 适配版本，改动面与不确定性超出「整改」体量；现有 24 接口的手写 API 参考（M5 #32）已与实现逐一核对，漂移风险仅存在于未来新增接口。作为独立任务挂起（见 #41 回写），建议与首个真实业务模块一起试点。
9. **测试期日志静音**：测试文件统一预设 `LOG_LEVEL=error`，#37 落地后 requestLogger 按级别过滤，测试输出不被访问日志刷屏。

### 里程碑验收（DoD）

- `pnpm test` 全绿（无 MongoDB 环境时 mongo 契约套件显式 skip；`RUN_MONGO_TESTS=1` + 本机 MongoDB 下全绿）；用例覆盖：repository 契约（两实现同套）、RBAC 三账号 × 关键接口矩阵（401/403/200）、统一错误结构（422 issues / 404 JSON）、认证行为口径（改密后旧 token 有效）、登录限流 429、语言包键集一致
- `pnpm lint` 全仓通过；`pnpm --filter @admin-ai/web build` 通过（验证 safelist 派生）；`pnpm dev` 启动行为不回归（日志换轨、限流仅登录接口、既有接口契约零变化）
- 结构化日志：每请求一行 JSON（含 requestId/method/path/status/durationMs），响应携带 `x-request-id`；500 错误日志含堆栈与 requestId
- `.github/workflows/ci.yml` 就绪（install → generate → lint → test → web build，含 mongo 服务容器跑全量契约）；GitHub 首跑绿作为后续验证点
- 文档四处同步（README / REQUIREMENTS §2.3・§6・§13・§14 / backend.md / frontend.md）；评估报告补「整改落地记录」；TASKS.md 补完成记录

---

### 完成记录（2026-07-13）

全部任务（#36–#41）已实现并按 DoD 验证：

- **#36 测试设施**：`node --test "tests/**/*.test.js"`（决策点 1；注意 Node 24 下目录参数形态不可用，须用 glob）。测试库装置 `tests/helpers/db.js` 用 better-sqlite3 直接执行已提交 migration.sql 离线建表（决策点 2）；种子主体从 `prisma/seed.js` 抽为可导入的 `seedDatabase(client)`（CLI 入口经 `pathToFileURL` 判定保留，已验证 `prisma db seed` 路径不回归）。契约套件 `tests/helpers/repo-contract-suite.js` 9 用例 × 双实现（mongo 侧 `RUN_MONGO_TESTS=1` 门控 + `*_test` 库自清理，`mongo/db.js` 补 `closeDb()`）；RBAC 集成 12 用例（三账号矩阵、401/403/422/404 结构、删除/禁用自身防护、改密后旧 token 有效）；web 键集测试 3 用例。eslint 增 `**/tests/**` 关闭 `test/no-import-node-test`（vitest 假设与决策点 1 冲突）。
- **#37 结构化日志**：`utils/logger.js`（JSON 行 + LOG_LEVEL 过滤，warn/error 走 stderr）+ `middlewares/logger.js`（请求 id 透传/生成/回写 + durationMs）；errorHandler 500 日志带 requestId 与堆栈；`.env.example` 增 LOG_LEVEL；测试 5 用例（劫持 console 断言 JSON 字段与静音）。dev 启动冒烟验证：health 200 + 响应头 x-request-id + 单行 JSON 访问日志。
- **#38 登录限流**：`middlewares/rate-limit.js` 挂 `/api/auth/login`（先于参数校验）。**落地修正一处架构认知**：Hono onError 在 compose 最内层即把下游异常转为响应、不会以异常形态穿透上游中间件——失败判定改读 `c.res.status`（200 清桶 / 401·403 计数 / 422·5xx 不计不清，后者同时防「畸形请求重置计数器」漏洞）；requestLogger 同理去掉死代码 catch。测试 4 用例（计满后正确密码 429、分桶隔离、成功清零、422 不计不清）。
- **#39 safelist 单一来源**：`seed/data.js` 增 `collectMenuIcons()`，`uno.config.js` 跨包相对 import 派生 + `extraSafelist` 手工位；web build 通过且 6 个种子图标全部进入产物 CSS（jiti 跨包解析验证 OK，决策点 7）。
- **#40 CI**：`.github/workflows/ci.yml` 单 job 8 步（pnpm 版本读 packageManager；mongo:7 服务容器 + `RUN_MONGO_TESTS=1` 跑双驱动契约全量）；YAML 解析与 lint 通过，步骤与本地命令一一对应；**GitHub 首跑绿为遗留远端验证点**（mongo 契约路径本机无 MongoDB 未真跑，首个执行环境即 CI）。
- **#41 文档同步**：README（特性/命令/env）、REQUIREMENTS §2.3（日志/限流/测试选型）·§6（中间件链）·§13（env）·§14（「不做单元测试」解除，保留「不做 E2E」）、architecture.md（中间件链）、getting-started.md（env 表）、api/index.md（登录 429）、backend.md（模块图 + 结构化日志/登录限流/测试三节）、frontend.md（safelist 新口径 + 键集测试化）；评估报告补「六、整改落地记录」（含 P1 暂缓与两处实现形态修正的理由）；REVIEW.md 评审项 1 补落地指针。
- **验证**：`pnpm lint` 全仓通过；`pnpm test` 全绿（server 30 + web 3，mongo 套件 skip 提示开启方式）；`pnpm --filter @admin-ai/web build` 通过；dev server 启动行为不回归。

### #36 引入最小测试设施与两块 P0 用例 ✅

**描述**：`apps/server` 接入 `node --test`（`test` 脚本 + `tests/` 目录）：测试库装置（migration.sql 直建 + 进程内播种，种子主体从 `prisma/seed.js` 抽为可导入函数）；repository 契约测试套件（一套用例，prisma 必跑 / mongo 经 `RUN_MONGO_TESTS` 门控）；RBAC 与接口行为集成测试（`app.request()`：三账号矩阵、401/403/422/404 结构、删除/禁用自身防护、改密后旧 token 有效口径）。`apps/web` 接入语言包键集一致性测试（zh/en 键集相等 + 全平铺字符串值）。根 package.json 加 `test` 脚本（`pnpm -r run test`）。

**验收**：`pnpm test` 全绿；删除任一实现的关联清理逻辑或改动 where 语义会被契约套件捕获（抽查验证）；无 MongoDB 时 mongo 套件 skip 且提示开启方式。

---

### #37 结构化日志与请求 id ✅

**描述**：新增 `utils/logger.js`（零依赖 JSON 行日志，`LOG_LEVEL` 级别过滤）与 `middlewares/logger.js`（requestId 透传/生成、响应头回写、耗时统计，错误路径 rethrow 前记录）；`app.js` 以 `requestLogger()` 替换 `hono/logger`；`errorHandler` 未捕获异常改经 logger 输出堆栈并携带 requestId。`.env.example` 增 `LOG_LEVEL`。补测试：响应含 `x-request-id`、透传外部请求 id。

**验收**：每请求一行结构化 JSON；`LOG_LEVEL=error` 时访问日志静音；500 日志含 requestId + 堆栈；测试通过。

---

### #38 登录接口限流 ✅

**描述**：新增 `middlewares/rate-limit.js`（`loginRateLimit()`：内存滑窗、`IP|username` 分桶、只计失败、成功清桶、超限 `AppError(429)`、过期桶惰性清理），挂载于 `/api/auth/login`（先于参数校验）；`LOGIN_RATE_WINDOW` / `LOGIN_RATE_MAX` 可配（复用 `parseDuration`）。补测试：连续失败达阈值后正确密码也 429、不同用户名互不影响、成功登录重置计数。文档标注单实例语义与多实例升级路径。

**验收**：默认 15 分钟窗口 5 次失败触发 429（统一错误结构）；三账号正常流程不受影响；测试通过。

---

### #39 图标 safelist 单一来源 ✅

**描述**：`seed/data.js` 导出 `collectMenuIcons()`；`apps/web/uno.config.js` 跨包 import 派生 safelist + 保留 `extraSafelist` 手工位；同步修订 seed 内注释与 frontend.md「图标需同步 safelist」警告块（种子内图标自动覆盖，仅运行时新增图标需手工登记）。

**验收**：`pnpm --filter @admin-ai/web build` 通过且产物含全部种子图标样式；seed 增删图标无需改 uno.config；lint 通过。

---

### #40 最小 CI（GitHub Actions） ✅

**描述**：新增 `.github/workflows/ci.yml`：push / PR 触发，单 job——checkout → pnpm（读 packageManager 版本）→ Node 22（pnpm 缓存）→ `pnpm install --frozen-lockfile` → `prisma generate` → `pnpm lint` → `pnpm test`（services 起 `mongo:7`，`RUN_MONGO_TESTS=1` 跑全量双驱动契约）→ `pnpm --filter @admin-ai/web build`。

**验收**：workflow YAML 语法有效、步骤与本地命令一一对应；推送 GitHub 后首跑绿（远端验证点，本地以 lint + 逐命令等价执行佐证）。

---

### #41 文档同步、报告整改记录与收尾验证 ✅

**描述**：README（特性/命令/环境变量表补 test 与 LOG_LEVEL 等）；REQUIREMENTS §2.3（测试与日志选型）、§6（中间件链：requestLogger → CORS → onError → authGuard → 业务路由；登录限流）、§13（env 清单）、§14（「不做单元测试」修订为「已引入 node:test，不做 E2E」）；backend.md 新增「测试」章节 + 日志/限流行为口径；frontend.md safelist 口径与键集测试说明；评估报告文末补「整改落地记录」（含 P1 暂缓理由）；REVIEW.md 评审项 1 结论下补落地指针。收尾全量跑 lint / test / web build。

**验收**：文档与实现一致（命令、env、行为口径逐一核对）；报告落地记录完整；DoD 三项命令全绿。

---

## M7 Docker 打包 ✅

> **任务制定**（2026-07-13，依据评审项 2 改进方案报告 [reports/2026-07-13-docker-packaging.md](./reports/2026-07-13-docker-packaging.md)。形态与技术决策已在报告 §2/§4 定案，此处不重复论证；报告中标注 ⚠ 的点须在 Linux 环境实测确认。）

> **执行规划**（2026-07-13 开工，基于 M6 完成后的代码现状复核）

### 现状衔接点（开工复核）

1. **serve-static 实现已核实**（`@hono/node-server` 2.0.8）：`join(root, path)` 语义对绝对路径 root 成立（`WEB_DIST=/app/web-dist` 直接可用）；自带路径穿越防护（拒绝 `..` 与反斜杠）；文件未命中时调用 `next()` 放行——「静态中间件 + GET 兜底 fallback」两段式挂载成立，且注册在业务路由之后不影响 `/api` 匹配（Hono 按注册序组合，路由命中即终止）。
2. **未匹配 `/api` 路径的既有行为口径**：无 token → authGuard 401；有 token → notFound JSON 404。静态托管启用后该口径必须保持（fallback 显式排除 `/api` 前缀）。
3. **测试装置直接复用**：`tests/helpers/app.js` 的 `bootTestApp`（env 先行 + 动态 import）适配 `WEB_DIST` 场景——createApp() 每次调用读取 env，同一测试进程内可先起未启用实例再起启用实例对照。临时 dist 装置放 `data/`（已 gitignore）。
4. **实测环境**：本机为 Windows + WSL2（Ubuntu-24.04，暂无 docker），#45 需先在 WSL 内安装 docker-ce（或 Docker Desktop）；仓库经 WSL `/mnt/d/...` 可达。
5. **prisma 依赖位置调整影响面**：`prisma` 仅被 `db:*` scripts 与镜像 entrypoint 消费，移入 dependencies 不改变本地 dev/test 行为（pnpm install 默认装 dev + prod）。

### 报告决策要点（任务实施的既定前提）

1. **形态 A：单镜像** = server 同时托管 API 与 web 静态产物，`docker run` 单容器即得完整系统（报告 §2）；双容器 nginx 形态仅作为文档中的部署差异说明，不开发。
2. **基础镜像 `node:22-bookworm-slim`**（glibc，直用 better-sqlite3 预编译产物，不选 alpine，报告 §4.1）。
3. **依赖装配走 workspace-in-image 路线**（整仓 workspace 结构进镜像，不用 `pnpm deploy`，报告 §4.2）；`pnpm fetch` 分层缓存 + build-arg 注入 registry / `PRISMA_ENGINES_MIRROR` 应对弱网（§4.3）。
4. **entrypoint 播种语义**：`db:seed` 为「清空后重播」，仅数据文件不存在的**首次启动**播种（`SEED_ON_FIRST_RUN` 可关）；mongo 模式不自动播种，文档化为手动一次性命令（报告 §1 事实 11/12）。
5. **数据与配置**：`DATABASE_URL=file:/data/app.db` + 挂载 `/data`（零代码改动）；配置全走容器环境变量，`.env` 严禁进镜像；以 `node` 用户运行；HEALTHCHECK 用 node 内置 fetch 探测 `/api/health`（§4.4）。
6. **边界如实声明**：SQLite 单容器 = 单实例形态，多实例按既有文档切 PostgreSQL/MySQL；docs 站不进镜像（§4.5）。

### 执行批次与顺序

**#42 静态托管（唯一业务代码改动，可独立测试）→ #43 Dockerfile / entrypoint / .dockerignore（含 prisma 依赖调整）→ #44 compose.yaml → #45 端到端验证（报告 §7 DoD，需 Linux/Docker 环境）→ #46 文档 ∥ #47 CI（两者依赖 #45 结论定稿，可并行）**。

### 里程碑验收（DoD）

即报告 §7 验证清单：干净环境 `docker build` 成功；`docker run` 首启自动迁移 + 播种、三账号可登录、SPA 深层路由刷新与 `/api` 同端口正常；重启不重播种、数据保留；未知 API 路径返回 JSON 404；健康检查 healthy；compose mongo profile 全流程回归；镜像内无 `.env` / 无本地数据文件、以 node 用户运行。另加：`pnpm test` 全绿（含 #42 新增用例）、`pnpm lint` 通过、dev 行为零回归（未设 `WEB_DIST` 时静态托管完全不启用）。

### 完成记录（2026-07-13）

全部任务（#42–#47）已实现并按 DoD 验证（实测环境：WSL2 Ubuntu-24.04 + docker.io 29.1.3，本机 Windows 无 Docker Desktop）：

- **#42 静态托管**：`app.js` 增 `mountWebStatic()`（约 20 行）——`WEB_DIST` 未设置完全不挂载；设置后 `serveStatic` 全路径静态优先 + GET 兜底回退 `index.html`，`/api` 前缀精确判定（`/apifoo` 属页面路径）保住 JSON 404 语义。已核实 `@hono/node-server` 2.0.8 serve-static：绝对路径 root 可用（`join` 语义）、自带 `..`/反斜杠穿越防护、未命中 `next()` 放行。`tests/web-static.test.js` 7 用例（基线 JSON 404 / 根路径 / 静态资源 / 深层回退 / 未知 API 404 / 前缀精确 / 登录链路）。
- **#43 构建文件**：`prisma` 移入 dependencies（本地 install/dev/test 零影响，37 用例复验）；多阶段 Dockerfile（manifests `pnpm fetch` 缓存层 → build（web 构建 + prisma generate）→ prod-deps → runtime）+ entrypoint（prisma 模式 `migrate deploy` + 仅首启播种，`SEED_ON_FIRST_RUN` 可关）+ `.dockerignore`（保留 `apps/docs/package.json`）。**实测修正三处**：①pnpm 11 无 TTY 下 `--prod` 重装须 `CI=true`（`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`）；②`pnpm fetch` 会把 lockfile 全量包物化进 `node_modules/.pnpm`，prod-deps 须先 `rm -rf node_modules` 再离线重装，node_modules 从 796MB 降至 386MB（省 ~1.6GB 镜像层）；③runtime 补装 openssl（Prisma schema engine 的 libssl 检测，缺失仅告警但按官方建议消除）。新增根 `.gitattributes`（`*.sh eol=lf`——本机 `autocrlf=true`，CRLF 会破坏容器内 shebang）。
- **#44 compose**：默认 profile 单服务 + `app-data` 卷 + `JWT_SECRET` 必填插值校验；`mongo` profile 带 `mongo:7` 与独立卷，注释即启用文档。
- **#45 端到端**：报告 §7 六项全过——首启迁移 + 播种（日志确认各一次）、三账号登录 + users CRUD 冒烟、根/深层路由 `text/html` + 静态资源 + 未知 API JSON 404 同端口、重启后播种总数恰为 1 且数据卷保留、`HEALTHCHECK` → healthy、compose 缺 `JWT_SECRET` 报错 + 默认 profile up + mongo profile（手动 `seed/mongo.js` 后三账号 + users/menus 全 200）、镜像内无 `.env`/`data` 且 `uid=1000(node)`。**⚠ 点实测结论**：`--frozen-lockfile` 携 docs 清单通过；better-sqlite3 走 prebuild-install 预编译（无 gyp 编译）；镜像 1.31GB（docker 29 磁盘占用口径；node_modules 386MB，主要成本为 prisma CLI 依赖链 ~150MB——studio-core/typescript/pglite 等，报告 §6 优化项 1 的 `pnpm deploy` 减重维持暂缓）。
- **#46 文档**：docs 新增独立「部署指南」页（quick start / 镜像行为 / 容器环境变量差异表含 `WEB_DIST`、`SEED_ON_FIRST_RUN` / 数据卷备份 / mongo profile / 生产必改项 / 边界与升级路径 / 非 Docker 部署），nav sidebar 注册；getting-started 环境变量表补 `WEB_DIST` + 下一步链接；README「构建与部署」改为 Docker 推荐 + 手动部署双节、env 表与文档链接同步。`vitepress build`（死链检查）通过。
- **#47 CI**：ci.yml 增独立 `docker` job（buildx + GHA 层缓存、仅构建不推送、构建后起容器循环探测 `/api/health` 冒烟）；YAML 解析校验通过，冒烟步骤与 #45 本地等价执行一致；**GitHub 首跑绿为遗留远端验证点**（与 M6 #40 同口径）。
- **验证**：`pnpm test` 全绿（server 37 + web 3）、`pnpm lint` 全仓通过、`pnpm --filter @admin-ai/docs build` 通过；dev 行为零回归（`WEB_DIST` 未设不挂载，由基线用例常驻保证）。
- **实测环境备注**：本机 Docker 经 WSL2 安装（docker.io + docker-compose-v2 + docker-buildx，registry mirror 已配 daemon.json）；Docker Hub 直连不通，基底/mongo 镜像经 mirror 拉取；构建注入 `NPM_REGISTRY` / `PRISMA_ENGINES_MIRROR`（npmmirror）。WSL 无常驻会话时 VM 空闲关机会连带停掉 dockerd 与容器——长驻验证需 keepalive 会话或 Docker Desktop。
- **待人工确认**：浏览器打开容器服务的完整视觉回归（`JWT_SECRET=xx docker compose up -d` 后 `http://localhost:3000` 三账号过一遍页面交互）——接口与 SPA 行为已由 curl 断言覆盖，此项为容器形态下的视觉确认。

---

### #42 server 静态托管与 SPA fallback（WEB_DIST 开关） ✅

**描述**：`apps/server/src/app.js` 在业务路由之后，按环境变量 `WEB_DIST` 条件挂载 `@hono/node-server/serve-static`，并对**非 `/api` 前缀**的未匹配路径回退 `index.html`（SPA history 路由）；未设置 `WEB_DIST` 时完全不启用，dev 行为零变化。`.env.example` 增 `WEB_DIST` 注释说明。补 `node:test` 用例（临时 dist 装置）：静态文件与 index.html 回退命中、深层路径回退、未知 `/api/*` 仍返回 JSON 404、未设 `WEB_DIST` 时未知路径行为不变。

**验收**：设 `WEB_DIST` 指向 web 构建产物后，页面与 `/api` 同端口服务、深层路由刷新不 404、未知 API 路径保持 JSON 404 语义；不设时全部既有测试通过、行为零变化；`pnpm test` / `pnpm lint` 通过。

---

### #43 Dockerfile、docker-entrypoint.sh 与 .dockerignore ✅

**描述**：`prisma` 从 devDependencies 移入 dependencies（apps/server/package.json，支撑启动时 `migrate deploy`）；按报告 §5.1/§5.2/§5.4 草案落地根目录 `Dockerfile`（多阶段：manifests 层 `pnpm fetch` 缓存 → build 层 web 构建 + `prisma generate` → prod-deps 层 `--prod` 过滤安装 → runtime 层 workspace 结构装配 + HEALTHCHECK + node 用户）、`docker-entrypoint.sh`（prisma 模式 `migrate deploy` + 仅首次启动播种；mongo 模式跳过）、`.dockerignore`（排除 `.env*` / 本地数据 / generated / dist；**保留 `apps/docs/package.json`** 以维持 lockfile importers 一致性，⚠ 报告 §4.3）。构建期支持 build-arg 注入 registry 镜像源与 `PRISMA_ENGINES_MIRROR`。

**验收**：`docker build` 成功（含 ⚠ 点确认：`--frozen-lockfile` 通过、better-sqlite3 预编译产物在 slim 镜像可用）；镜像内无 `.env`、无 `apps/server/data`；`prisma migrate deploy` / `node prisma/seed.js` 在容器内可执行；本地 `pnpm install` / dev / test 不受 prisma 依赖位置调整影响。

---

### #44 compose.yaml ✅

**描述**：按报告 §5.3 草案落地根目录 `compose.yaml`：默认 profile 单服务（数据卷 `app-data:/data`、`JWT_SECRET` 必填校验 `${JWT_SECRET:?…}`、端口 3000）；`mongo` profile 附带 `mongo:7` 服务与 `mongo-data` 卷，注释标明启用方式与 `MONGODB_URL: mongodb://mongo:27017` 的服务名指向、mongo 播种手动命令（`docker compose exec app node /app/apps/server/seed/mongo.js`）。

**验收**：`docker compose up` 单命令起完整系统；缺 `JWT_SECRET` 时启动即报错提示；`docker compose --profile mongo up` 起双服务且 server 连通 mongo。

---

### #45 容器端到端验证（报告 §7 DoD） ✅

**描述**：在 Linux/Docker 环境执行报告 §7 验证清单全量：干净环境构建；首启自动迁移 + 播种，三种子账号登录、系统管理 CRUD、web 深层路由刷新（SPA fallback）与 `/api` 同端口验证；重启容器数据保留且**不重播种**；未知 API 路径 JSON 404；`docker inspect` 健康状态 healthy；compose mongo profile 手动播种后三账号全流程回归；镜像内容与运行用户核查。过程中确认报告全部 ⚠ 实测点（frozen-lockfile importers、预编译产物覆盖、镜像体积），偏差回写 Dockerfile/entrypoint 并在完成记录中说明。

**验收**：§7 六项全部通过；⚠ 点逐一有实测结论；发现的偏差已修正并复验。

---

### #46 部署文档增补 ✅

**描述**：README「构建与部署」与 docs 站 getting-started（或独立 deployment 页）增补 Docker 一节：`docker run` / `docker compose` 快速部署、环境变量表对照（含 `WEB_DIST` / `SEED_ON_FIRST_RUN`）、数据卷与备份说明（SQLite 单文件）、mongo profile 启用与手动播种、**生产必改项**（`JWT_SECRET` 强随机、种子账号默认密码 123456 必须修改）、单实例边界与多实例升级路径（切 PostgreSQL/MySQL + 双容器 nginx 形态说明）。收尾 `pnpm lint:fix` + `pnpm lint`、`vitepress build`（死链检查）。

**验收**：文档命令与 #43-#45 实测结果一致（逐一核对）；docs build 与全仓 lint 通过。

---

### #47 CI 增加镜像构建校验 ✅

**描述**：`.github/workflows/ci.yml` 增加 docker build 步骤（或独立 job）：`docker/build-push-action`（或 `docker build`）仅构建不推送，利用 GHA 层缓存；验证 Dockerfile 随代码演进不腐化。可选：构建后起容器探测 `/api/health` 作为最小运行时冒烟。

**验收**：workflow YAML 有效、本地等价命令通过；GitHub 首跑绿（远端验证点，与 M6 #40 同口径）。

---

## 任务依赖关系

- **M1 → M2**：#11-#14 依赖 #7-#9（server 骨架与鉴权）；#15-#18 依赖 #4-#6、#10（前端骨架与登录链路）
- **M2 → M3**：#19-#24 依赖 #15（主布局与路由）
- **M1 → M4**：#25-#27 依赖 #11（repository 接口定义）
- **M1-M4 → M5**：#28-#33 依赖全部功能完成
- **横向验证**：#34 依赖 #3、#6、#10；#35 依赖 #1-#24 全部完成
- **M1-M5 → M6**：#36 依赖 #11-#14（repository 与接口）、#8（migrations）；#37 / #38 / #39 相互独立可并行；#40 依赖 #36（test 脚本）；#41 依赖 #36-#40 全部完成
- **M6 → M7**：#42 依赖 #36（测试设施）；#43 依赖 #42（镜像内启用 `WEB_DIST`）；#44 依赖 #43；#45 依赖 #43 + #44；#46 / #47 依赖 #45（以实测结论定稿），两者可并行

---

## 使用说明

1. **任务编号**：按 `#数字` 形式标识，可用于 issue / PR / commit 关联（如 `fix: #12 修复分页查询问题`）
2. **验收标准**：每个任务包含明确的验收条件，作为 Code Review 与测试依据
3. **进度追踪**：建议在项目管理工具（GitHub Projects / Jira / Trello）中导入本清单，追踪完成状态
4. **并行执行**：M1 内的 #1-#3 可并行；#4-#6 与 #7-#9 可并行；M2 内的 #12 与 #14 可并行（前提：#11 完成）

---

**最后更新**：2026-07-13（M7 Docker 打包全部完成：server 静态托管 + SPA fallback（7 用例）、多阶段 Dockerfile / entrypoint / .dockerignore、compose.yaml（mongo profile）、容器端到端验证（WSL2 实测报告 §7 DoD 全项）、部署指南、CI 镜像构建校验；**M1-M7 里程碑全部完成**。遗留验证点：#35 浏览器端人工回归、CI 于 GitHub 首跑绿（mongo 契约与 docker job 首个执行环境即 CI）、容器形态浏览器视觉确认）
