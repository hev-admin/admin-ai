# 部署指南

本页覆盖 admin-ai 的生产部署形态，以 **Docker 单镜像**为推荐路径（M7，方案定案见仓库 `reports/2026-07-13-docker-packaging.md`）：server 在同一端口托管 `/api` 与 web 静态产物，默认 SQLite 零外部依赖，一条命令即得完整系统。

## Docker 快速部署

### docker compose（推荐）

仓库根目录已提供 `compose.yaml`：

```sh
JWT_SECRET=<强随机值> docker compose up -d
```

首次启动自动执行数据库迁移与种子播种，随后访问 `http://<主机>:3000` 即可用种子账号登录（见[快速开始](./getting-started.md)）。

### docker run

```sh
docker build -t admin-ai .
docker run -d --name admin-ai \
  -e JWT_SECRET=<强随机值> \
  -p 3000:3000 \
  -v admin-ai-data:/data \
  admin-ai
```

### 弱网构建（可选）

依赖源与 Prisma engines 下载均可经 build-arg 注入镜像源：

```sh
docker build \
  --build-arg NPM_REGISTRY=https://registry.npmmirror.com \
  --build-arg PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma \
  -t admin-ai .
```

## 镜像行为说明

- **首次启动**（数据文件不存在）：`prisma migrate deploy` 自动迁移 + 播种三账号种子数据；**再次启动只迁移不重播**（`db:seed` 是「清空后重播」语义，entrypoint 保证其只在首启执行）。设 `SEED_ON_FIRST_RUN=0` 可连播种也跳过。
- **SPA 路由**：非 `/api` 的未匹配路径回退 `index.html`（深层路由刷新不 404）；未知 `/api/*` 路径保持 JSON 404 语义。
- **健康检查**：镜像内置 `HEALTHCHECK`，探测 `/api/health`（`docker inspect` 可见 `healthy` 状态）。
- **运行用户**：容器以非 root 的 `node` 用户运行；镜像不含 `.env` 与本地数据文件。

## 容器环境变量

配置全部经容器环境变量注入（与 `.env.example` 一一对应，[全表见快速开始](./getting-started.md#配置环境变量)），容器形态的差异项：

| 变量                | 镜像内默认          | 说明                                                       |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `JWT_SECRET`        | —（必填）           | 生产必须提供强随机值，compose 未提供时直接报错             |
| `DATABASE_URL`      | `file:/data/app.db` | SQLite 数据文件固定在数据卷 `/data` 内                     |
| `WEB_DIST`          | `/app/web-dist`     | web 静态产物目录；置空可退化为纯 API 容器（前置 nginx 时） |
| `SEED_ON_FIRST_RUN` | `1`                 | 首次启动是否自动播种（`0` 关闭）                           |

## 数据卷与备份

SQLite 数据是单文件（卷内 `/data/app.db`），备份即备份该卷：

```sh
# 冷备（简单可靠）：停容器后拷出数据文件
docker compose stop app
docker run --rm -v admin-ai_app-data:/data -v "$PWD":/backup busybox cp /data/app.db /backup/
docker compose start app
```

在线热备需用支持 SQLite `.backup` 语义的工具，避免拷贝写入中的数据文件。

## MongoDB 模式（compose profile）

`compose.yaml` 内置 `mongo` profile。打开 `app` 服务中 `DB_DRIVER` / `MONGODB_URL` 两行注释后：

```sh
JWT_SECRET=<强随机值> docker compose --profile mongo up -d

# mongo 模式不自动播种（seed 幂等但不应每次启动触碰数据），部署后手动执行一次：
docker compose exec app node /app/apps/server/seed/mongo.js
```

## 生产必改项

- **`JWT_SECRET`**：必须替换为强随机值（如 `openssl rand -base64 32`），严禁使用示例值；
- **种子账号默认密码**：`super / admin / user` 的初始密码统一为 `123456`，上线后必须立即修改（个人中心改密，或用 super 在用户管理中重置）。

## 边界与升级路径

- **单实例形态**：SQLite + 单容器不可水平扩展（多副本共享 SQLite 文件不可行）。需要多实例时按[后端指南](./backend.md#数据库切换)切换 PostgreSQL / MySQL——Dockerfile 结构不变，去掉 SQLite 数据卷、`DATABASE_URL` 指向外部库即可；
- **双容器形态**：如需 nginx 统一入口（TLS 终结、多应用路由），将容器的 `WEB_DIST` 置空退化为纯 API，web 产物交 nginx 托管并反代 `/api`——与单镜像形态不互斥，仅是部署差异；
- **文档站**：docs（VitePress）产物不进业务镜像，`pnpm build` 后将 `apps/docs/.vitepress/dist/` 任意静态托管。

## 不用 Docker 的部署

server 生产直跑源码，无构建产物：部署机 `pnpm install` 后执行迁移（`pnpm --filter @admin-ai/server exec prisma migrate deploy`），配置 `.env` 再 `pnpm --filter @admin-ai/server start`；web 构建产物 `apps/web/dist/` 静态托管，将 `/api` 反向代理到 server，或设置 `WEB_DIST` 指向产物目录由 server 直接托管。
