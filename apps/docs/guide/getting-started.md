# 快速开始

本页带你从零启动 admin-ai：安装依赖 → 初始化数据库 → 启动前后端 → 用种子账号登录。

## 环境要求

| 依赖    | 版本                 | 说明                                                          |
| ------- | -------------------- | ------------------------------------------------------------- |
| Node.js | ≥ 22                 | 根 package.json 的 `engines` 已锁定；Node 20 已于 2026-04 EOL |
| pnpm    | 11.x                 | 根 package.json 的 `packageManager` 已锁定版本                |
| MongoDB | 任意近期版本（可选） | 仅在启用 `DB_DRIVER=mongo` 模式时需要；默认 SQLite 零部署     |

::: tip 安装 pnpm
推荐用 corepack（Node 内置）：`corepack enable`，之后在仓库内执行的 `pnpm` 会自动匹配锁定版本；也可以 `npm i -g pnpm` 全局安装。
:::

## 安装依赖

```sh
git clone https://github.com/hev-admin/admin-ai.git
cd admin-ai
pnpm install
```

需要执行安装脚本的依赖（prisma / better-sqlite3 / esbuild）已在 `pnpm-workspace.yaml` 的 `allowBuilds` 中预先放行，无需交互确认。

## 配置环境变量

server 必须有 `.env` 才能启动（缺少 `JWT_SECRET` 时进程直接退出并提示）：

```sh
cp apps/server/.env.example apps/server/.env
```

默认值即可跑通本地开发，生产部署前务必修改 `JWT_SECRET`。各变量含义：

| 变量                | 默认值                      | 说明                                                                                                   |
| ------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------ |
| `PORT`              | `3000`                      | API 服务端口                                                                                           |
| `JWT_SECRET`        | —                           | JWT 签名密钥，必填                                                                                     |
| `JWT_EXPIRES_IN`    | `7d`                        | token 有效期，支持 `s / m / h / d` 单位，纯数字按秒                                                    |
| `DB_DRIVER`         | `prisma`                    | 数据驱动：`prisma`（关系库）\| `mongo`，启动时装配                                                     |
| `DATABASE_URL`      | `file:./data/app.db`        | 关系库连接串；SQLite 相对路径相对 `apps/server` 目录解析                                               |
| `MONGODB_URL`       | `mongodb://localhost:27017` | MongoDB 连接串（`DB_DRIVER=mongo` 时生效）                                                             |
| `MONGODB_DB`        | `admin_ai`                  | MongoDB 数据库名                                                                                       |
| `HTTP_ADAPTER`      | `fetch`                     | server **出站**请求适配器（`fetch` \| `axios`）                                                        |
| `LOG_LEVEL`         | `info`                      | 日志级别 `debug` \| `info` \| `warn` \| `error`（结构化 JSON 行，含请求 id）                           |
| `LOGIN_RATE_MAX`    | `5`                         | 登录限流：窗口内失败次数阈值（达到后返回 429）                                                         |
| `LOGIN_RATE_WINDOW` | `15m`                       | 登录限流窗口，支持 `s / m / h / d` 单位                                                                |
| `WEB_DIST`          | —                           | web 静态产物目录；设置后 server 同源托管页面 + SPA 回退（[部署形态](./deployment.md)，本地开发不设置） |

web 侧环境变量可选（`apps/web/.env.example`）：`VITE_HTTP_ADAPTER=fetch|axios` 切换**前端业务请求**的底层适配器，默认 `fetch`，不配置也能启动。两个适配器变量作用于不同进程：`VITE_HTTP_ADAPTER` 管浏览器里的业务请求，`HTTP_ADAPTER` 管 server 对第三方接口的出站请求（当前模板内暂无出站调用方，为扩展预留）。

## 初始化数据库（SQLite，默认）

```sh
pnpm --filter @admin-ai/server db:migrate
```

`prisma migrate dev` 会创建 `apps/server/data/app.db`、应用迁移，并在新建库时自动执行种子脚本。如需手动重新播种（幂等，清空后重播）：

```sh
pnpm --filter @admin-ai/server db:seed
```

一键重置（删库重建 + 重新播种）：

```sh
pnpm --filter @admin-ai/server db:reset
```

## 启动

```sh
pnpm dev
```

并行启动 web 与 server：

- web：<http://localhost:5173>（Vite dev server，`/api` 已代理到 server）
- server：<http://localhost:3000>（`GET /api/health` 可用于连通性检查）

也可以分开启动：`pnpm dev:web` / `pnpm dev:server`；文档站为 `pnpm dev:docs`（端口 5174）。

## 种子账号

| 账号  | 密码   | 角色       | 权限范围                     |
| ----- | ------ | ---------- | ---------------------------- |
| super | 123456 | 超级管理员 | 全部菜单 + 全部按钮          |
| admin | 123456 | 管理员     | 全部菜单，但无删除类按钮权限 |
| user  | 123456 | 普通用户   | 仅 Dashboard 与个人中心      |

打开 <http://localhost:5173>，分别用三个账号登录即可体验完整 RBAC：侧边栏菜单、页面内按钮随权限显隐，无权限地址跳转 403。

## 启用 MongoDB 模式（可选）

默认走 Prisma + SQLite。切换到 MongoDB：

```sh
# 1. 确保本机 MongoDB 已运行（默认连接 mongodb://localhost:27017）

# 2. 播种 Mongo 数据（建集合、唯一索引并写入与 SQLite 同源的种子数据，幂等）
pnpm --filter @admin-ai/server db:seed:mongo

# 3. 修改 apps/server/.env：DB_DRIVER=mongo，然后重启 server
```

两套驱动实现同一套 repository 契约，前端与接口行为完全一致；切回关系库改回 `DB_DRIVER=prisma` 重启即可。详见[后端指南](./backend.md#数据库切换)。

## 下一步

- 了解整体设计：[架构说明](./architecture.md)
- 新增页面、定制主题、切换 UI 库：[前端指南](./frontend.md)
- 新增接口、切换数据库：[后端指南](./backend.md)
- Docker 单镜像部署、数据备份：[部署指南](./deployment.md)
- 全部接口一览：[API 参考](../api/index.md)
