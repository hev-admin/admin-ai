# admin-ai

基于 **pnpm monorepo** 的通用后台管理模板：Vue 3 前端 + Hono API 服务 + VitePress 文档站。不绑定具体业务，提供登录认证、RBAC 权限、动态路由、系统管理等标准能力，作为业务项目的起手脚手架。全仓库 ESM + 纯 JavaScript（不引入 TypeScript）。

## 特性

- 🔐 **完整 RBAC 权限**：用户—角色—权限三层模型，动态路由 + 侧边栏菜单 + `v-permission` 按钮级指令，权限码前后端双重校验
- 🗄️ **双数据驱动**：Prisma（SQLite / PostgreSQL / MySQL）与 MongoDB 官方驱动实现同一套 repository 契约，`DB_DRIVER` 环境变量启动时切换，业务代码零感知
- 🧩 **UI 组件库可切换**：`useFeedback` 反馈门面 + Pro\* 封装组件（ProSearchForm / ProTable / ProModalForm）+ 主题 token 映射收敛耦合面，Naive UI → antdv / element-plus 成本可控
- 🔁 **同构统一请求包**：原生 fetch（ofetch）/ axios 双适配器同一接口与 `RequestError` 规范化，浏览器与 Node 复用，环境变量切换
- 🌐 **体验完备**：多标签页（keep-alive、右键菜单、持久化）、亮暗主题 + 六色主题色、中英国际化（组件库联动）、Dashboard 图表（ECharts）、403 / 404 / 500 异常页、个人中心
- 🛠️ **工程即约定**：@antfu/eslint-config 统一 lint 与格式化（无 Prettier）、种子数据一份定义两库共享、pnpm 原生 workspace（不引 Turborepo / Nx）、GitHub Actions 最小 CI
- ✅ **回归有测试兜底**：Node 内置 `node:test` 零依赖——repository 契约测试双驱动同套用例、RBAC 三账号接口矩阵（`app.request()` 无服务集成）、语言包键集校验；结构化 JSON 日志（请求 id）+ 登录限流开箱即用

## 技术栈

| 端                 | 选型                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| 前端 `apps/web`    | Vite · Vue 3 · Naive UI · UnoCSS（preset-icons）· vue-router 4 · Pinia（持久化）· vue-i18n · ECharts        |
| 后端 `apps/server` | Hono · @hono/node-server · hono/jwt + bcryptjs · zod · Prisma 7（better-sqlite3 adapter）· mongodb 官方驱动 |
| 共享包             | `@admin-ai/request`（ofetch / axios 双适配器同构请求包）                                                    |
| 文档 `apps/docs`   | VitePress                                                                                                   |

## 快速开始

环境要求：**Node.js ≥ 22**、**pnpm 11**（`corepack enable` 即可），MongoDB 可选（默认 SQLite 零部署）。

```sh
git clone https://github.com/hev-admin/admin-ai.git
cd admin-ai
pnpm install

# server 必须有 .env（缺 JWT_SECRET 不启动）
cp apps/server/.env.example apps/server/.env

# 初始化 SQLite：建库、迁移、播种
pnpm --filter @admin-ai/server db:migrate

# 并行启动 web(5173) + server(3000)
pnpm dev
```

打开 <http://localhost:5173>，用种子账号登录：

| 账号  | 密码   | 权限范围                     |
| ----- | ------ | ---------------------------- |
| super | 123456 | 全部菜单 + 全部按钮          |
| admin | 123456 | 全部菜单，但无删除类按钮权限 |
| user  | 123456 | 仅 Dashboard 与个人中心      |

切换 MongoDB 模式：启动本机 MongoDB → `pnpm --filter @admin-ai/server db:seed:mongo` → `.env` 改 `DB_DRIVER=mongo` 重启。完整步骤见[快速开始](./apps/docs/guide/getting-started.md)。

## 目录结构

```
├── apps/
│   ├── web/                # 前端：Vue 3 后台管理应用
│   │   └── src/            # api / components(Pro*) / composables / directives /
│   │                       # layouts / locales / router / stores / theme / utils / views
│   ├── server/             # 后端：Hono API 服务
│   │   ├── prisma/         # schema（单一数据源）+ migrations + seed 入口
│   │   ├── seed/           # data.js（两套驱动共享的种子定义）+ mongo.js
│   │   └── src/            # routes / middlewares / repositories(prisma|mongo) / services / utils
│   └── docs/               # 文档：VitePress 站点
├── packages/
│   └── request/            # @admin-ai/request 同构请求包
├── eslint.config.js        # 根级唯一 ESLint 配置
└── pnpm-workspace.yaml
```

## 环境变量

server（`apps/server/.env`，提供 `.env.example`）：

| 变量                                   | 默认                                     | 说明                                                               |
| -------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| `PORT`                                 | `3000`                                   | API 端口                                                           |
| `JWT_SECRET`                           | —                                        | JWT 签名密钥（必填）                                               |
| `JWT_EXPIRES_IN`                       | `7d`                                     | token 有效期（`s / m / h / d` 单位，纯数字按秒）                   |
| `DB_DRIVER`                            | `prisma`                                 | 数据驱动：`prisma` \| `mongo`                                      |
| `DATABASE_URL`                         | `file:./data/app.db`                     | 关系库连接串                                                       |
| `MONGODB_URL` / `MONGODB_DB`           | `mongodb://localhost:27017` / `admin_ai` | MongoDB 连接（`DB_DRIVER=mongo` 时生效）                           |
| `HTTP_ADAPTER`                         | `fetch`                                  | server 出站请求适配器：`fetch` \| `axios`                          |
| `LOG_LEVEL`                            | `info`                                   | 日志级别（结构化 JSON 行，含请求 id）                              |
| `LOGIN_RATE_MAX` / `LOGIN_RATE_WINDOW` | `5` / `15m`                              | 登录限流：窗口内失败阈值与窗口时长                                 |
| `WEB_DIST`                             | —                                        | web 产物目录，设置后 server 同源托管页面（部署形态用，开发不设置） |

web（`apps/web/.env`，可选）：`VITE_HTTP_ADAPTER=fetch|axios`，前端业务请求适配器，默认 `fetch`。

## 开发命令

| 命令                                           | 说明                                           |
| ---------------------------------------------- | ---------------------------------------------- |
| `pnpm dev`                                     | 并行启动 web + server                          |
| `pnpm dev:web` / `dev:server` / `dev:docs`     | 单独启动（web 5173 / server 3000 / docs 5174） |
| `pnpm build`                                   | 构建全部应用（web + docs）                     |
| `pnpm test`                                    | 全部测试（server 契约/RBAC + web 语言包键集）  |
| `pnpm lint` / `lint:fix`                       | 全仓库 ESLint 检查 / 修复                      |
| `pnpm --filter @admin-ai/server db:migrate`    | 关系库迁移（新建库自动播种）                   |
| `pnpm --filter @admin-ai/server db:seed`       | 关系库手动播种（幂等）                         |
| `pnpm --filter @admin-ai/server db:reset`      | 关系库一键重置                                 |
| `pnpm --filter @admin-ai/server db:seed:mongo` | MongoDB 播种（建集合、索引，幂等）             |

## 构建与部署

**Docker 单镜像（推荐）**：server 同源托管 `/api` 与 web 静态产物，默认 SQLite 零外部依赖，首次启动自动迁移 + 播种：

```sh
JWT_SECRET=<强随机值> docker compose up -d    # 或 docker build -t admin-ai . && docker run ...
```

MongoDB 模式（compose `--profile mongo`）、弱网构建镜像源、数据卷备份、生产必改项（`JWT_SECRET` 强随机、种子账号默认密码 123456 必须修改）与单实例边界详见[部署指南](./apps/docs/guide/deployment.md)。

**手动部署**：

```sh
pnpm build
```

- **web**：产物在 `apps/web/dist/`，静态托管即可；需将 `/api` 反向代理到 server（或利用 server 已开启的 CORS 直连）；
- **server**：无构建产物，生产直跑源码——部署机器上 `pnpm install` 后执行迁移（`pnpm --filter @admin-ai/server exec prisma migrate deploy`），配置好 `.env` 再 `pnpm --filter @admin-ai/server start`；
- **docs**：产物在 `apps/docs/.vitepress/dist/`，任意静态托管。

## 文档

完整文档在 `apps/docs`（本地 `pnpm dev:docs` 后访问 <http://localhost:5174>）：

- [快速开始](./apps/docs/guide/getting-started.md) —— 环境、安装、初始化与启动
- [架构说明](./apps/docs/guide/architecture.md) —— monorepo 结构、交互流程、目录约定
- [前端指南](./apps/docs/guide/frontend.md) —— 新增页面与菜单、权限指令、主题、i18n、UI 库切换
- [后端指南](./apps/docs/guide/backend.md) —— 新增接口、repository 契约、种子、数据库切换
- [部署指南](./apps/docs/guide/deployment.md) —— Docker 单镜像、compose、数据备份、生产必改项
- [API 参考](./apps/docs/api/index.md) —— 全部接口的路径、参数、权限码与响应示例

## License

[MIT](./LICENSE)
