# Docker 整体打包改进方案报告

> 评审来源：REVIEW.md 2026-07-13 评审项 2——「该系统是否能作为一个整体打包成 docker 镜像？以利于更快速部署。」
> 结论先行：**可行。** 推荐形态为**单镜像 = server 同时提供 API 与 web 静态产物**，一条 `docker run` 即得完整系统（默认 SQLite 零外部依赖）。需要少量代码与配置改动（见 §3 改动清单），无架构性障碍。
> 本报告为方案设计，Dockerfile / entrypoint / compose 均为**草案**，落地时需在 Linux 环境实测（标注 ⚠ 处为需实测确认点）。

## 1. 现状盘点：与打包相关的关键事实

| #   | 事实                                                                                     | 打包含义                                                                    |
| --- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | server 无构建、生产直跑源码（`node src/index.js`），Node ≥ 22                            | 镜像里只需源码 + node_modules，无产物阶段                                   |
| 2   | pnpm 11 workspace，server 依赖 `@admin-ai/request`（`workspace:*`，免构建直用 src）      | 不能只拷贝 apps/server——须携带 workspace 结构或做 deploy 展开               |
| 3   | `better-sqlite3` 为原生模块（pnpm `allowBuilds` 已授权其 postinstall）                   | 基础镜像选型决定是否要编译工具链（见 §4.1）                                 |
| 4   | Prisma 7 + driver adapter：client 生成到 `apps/server/generated/`（已 gitignore）        | **镜像构建时必须执行 `prisma generate`**；查询走 adapter 无需查询引擎二进制 |
| 5   | `prisma migrate deploy` 依赖 prisma CLI（当前在 devDependencies）与 schema engine        | 运行时自迁移的话，CLI 必须进镜像（见 §3 改动 2）                            |
| 6   | SQLite 数据文件在 `apps/server/data/`；`src/db/url.js` 支持 `file:` 绝对路径且自动建目录 | 数据卷方案现成：`DATABASE_URL=file:/data/app.db` + 挂载 `/data`，零代码改动 |
| 7   | `/api/health` 在鉴权白名单内                                                             | HEALTHCHECK 端点现成                                                        |
| 8   | 缺 `JWT_SECRET` 进程直接退出；容器内无 `.env` 时 `dotenv/config` 为空操作                | 配置全走容器环境变量，行为正确；`.env` 严禁进镜像                           |
| 9   | web 为纯静态产物（`vite build` → dist），当前部署故事是「静态托管 + /api 反代」          | 单镜像形态需 server 增加静态托管能力（当前**没有**，见 §3 改动 1）          |
| 10  | docs（VitePress）也是静态产物，与运行系统无耦合                                          | 不进业务镜像，另行静态托管                                                  |
| 11  | seed 语义：关系库 `db:seed` 是**清空后重播**；`prisma migrate deploy` 从不自动播种       | entrypoint 只能**首次启动**播种，不可每次启动执行（会清掉业务数据）         |
| 12  | `DB_DRIVER=mongo` 模式不用 Prisma，靠 `seed/mongo.js` 幂等建集合/索引                    | compose 提供 mongo profile；迁移步骤按驱动分叉                              |

## 2. 形态选择

| 方案                  | 描述                                                             | 评估                                                                                                                                                         |
| --------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A. 单镜像（推荐）** | server 托管 web dist 静态文件 + SPA fallback，容器内单 Node 进程 | 完全契合「更快速部署」诉求：`docker run -e JWT_SECRET=xx -v data:/data -p 3000:3000` 即得全系统；同源部署后 CORS 可收紧；改动最小（约 20 行代码 + 构建文件） |
| B. 双容器 compose     | nginx 服 web + 反代 `/api` → server 容器                         | 职责分离更「标准」，但对模板用户是两个镜像、两份配置；作为 A 的进阶选项在文档中说明即可                                                                      |
| C. 单镜像多进程       | supervisor 同时跑 nginx + node                                   | 违背单容器单进程惯例，排障复杂，不采纳                                                                                                                       |

**推荐 A**。A 与 B 不互斥：A 落地后，B 只是「不设 `WEB_DIST` + 前面加 nginx」的部署差异，无需额外开发。

## 3. 需要的改动清单

按落地顺序，1–4 为必改，5–6 为建议：

1. **server 增加静态托管（唯一的业务代码改动）**：`apps/server/src/app.js` 在业务路由之后，按环境变量 `WEB_DIST`（未设置则完全不启用，dev 行为零变化）挂载 `@hono/node-server/serve-static`，并对**非 `/api` 前缀**的未匹配路径回退 `index.html`（SPA history 路由）。要点：fallback 必须排除 `/api`，否则未知 API 路径会返回 HTML 破坏 404 语义。预估 15–20 行。
2. **`prisma` 从 devDependencies 移入 dependencies**（apps/server/package.json）：镜像以「启动时自迁移」为部署形态，运行时需要 `prisma migrate deploy`。代价是生产 node_modules 增加约 100 MB 级体积（CLI + schema engine）；可接受，追求极致体积的替代方案见 §6。
3. **新增 `Dockerfile` + `docker-entrypoint.sh` + `.dockerignore`**（根目录，草案见 §5）。entrypoint 职责：`DB_DRIVER=prisma` 时执行 `migrate deploy`，并仅当数据文件不存在（首次启动）时播种；`DB_DRIVER=mongo` 时不做迁移，播种建议文档化为手动一次性命令（`seed/mongo.js` 虽幂等，但避免每次启动触碰数据）。
4. **`compose.yaml`（可选但建议）**：默认 profile 单服务 + 数据卷 + healthcheck；`mongo` profile 附带 MongoDB 服务。降低「更快速部署」的最后一步门槛。
5. **文档更新**：README「构建与部署」与 docs 站 getting-started 增补 Docker 一节（环境变量表已现成，补容器示例即可）；明确生产必改项——`JWT_SECRET` 强随机、种子账号默认密码 123456 必须修改。
6. **（建议）CI 增加镜像构建校验**：与二开评估报告的最小 CI 建议合并考虑。

## 4. 关键技术决策与依据

### 4.1 基础镜像：`node:22-bookworm-slim`（glibc），不用 alpine

- better-sqlite3 对 linux-x64/arm64 glibc 提供预编译二进制，安装期直接下载，运行镜像无需 python3/make/g++；alpine（musl）大概率触发源码编译，需在构建阶段安装工具链（⚠ 预编译产物覆盖面以实际安装日志为准，构建阶段兜底装工具链、运行阶段不带，是稳妥写法）；
- Prisma schema engine 对 debian 系支持最成熟；
- 体积差（slim vs alpine 约几十 MB）相对 node_modules 占比不敏感。

### 4.2 依赖装配：整仓 workspace 结构进镜像，不用 `pnpm deploy`

两条路线：

- **路线 I（采纳）：workspace-in-image。** 构建与运行装配均保持 monorepo 目录结构（`/app/apps/server`、`/app/packages/request` + 根 node_modules），用 `pnpm install --prod --filter` 的过滤安装产出生产依赖，最终镜像直接携带该结构。优点：不依赖任何 deploy 语义，pnpm 的相对符号链接在镜像内天然成立，行为与现有「目标机 pnpm install 直跑」完全同构，风险最低。
- 路线 II（暂缓）：`pnpm deploy` 展开成自包含目录，镜像更「干净」。但 pnpm 10+ 的 deploy 语义有变（需 `injectWorkspacePackages: true` 或 legacy 开关，⚠ pnpm 11 下行为需实测），且该设置会影响本地 dev 的链接行为。收益（略小的镜像）不抵语义风险，作为后续优化项。

### 4.3 构建缓存与弱网（本机环境已知约束）

- 先只 COPY 各包 `package.json` + `pnpm-lock.yaml` + `pnpm-workspace.yaml` 执行 `pnpm fetch`，源码变更不失效依赖层；
- `pnpm fetch` 仅按 lockfile 拉包，天然配合 `--offline` 安装；workspace yaml 中已有的 `fetchTimeout/fetchRetries` 弱网参数在镜像构建中同样生效；
- 需要时通过 build-arg 注入 registry 镜像源与 `PRISMA_ENGINES_MIRROR`（Prisma engines 下载是弱网下最常见的构建卡点）；
- ⚠ 注意 lockfile 的 importers 含 `apps/docs`：`.dockerignore` 需保留 `apps/docs/package.json`（排除其余内容），否则 `--frozen-lockfile` 因 workspace 项目集不一致而失败（以实测为准）。

### 4.4 数据与配置

- **卷**：`DATABASE_URL=file:/data/app.db`，挂载 `/data`（`url.js` 对绝对路径已正确处理并自动建目录）；备份 = 备份该卷（SQLite 单文件，建议停写或用 `.backup` 语义工具）；
- **配置**：全部经容器环境变量注入（PORT / JWT_SECRET / JWT_EXPIRES_IN / DB_DRIVER / DATABASE_URL / MONGODB_URL / MONGODB_DB / HTTP_ADAPTER / WEB_DIST），与现有 `.env.example` 一一对应，无新增概念；
- **安全**：以官方镜像内置 `node` 用户运行；HEALTHCHECK 用 node 内置 fetch 探测 `/api/health`（slim 镜像无 curl/wget）；`.dockerignore` 排除 `.env*` 防密钥入镜像。

### 4.5 明确的边界（如实声明，非本方案缺陷）

- SQLite + 单容器 = **单实例形态**，不可水平扩展（多副本共享 SQLite 文件不可行）。需要多实例时按既有文档切 PostgreSQL/MySQL，Dockerfile 结构不变（去掉 SQLite 卷、迁移流程按 backend.md 执行）；
- 镜像体积预估 400–600 MB（node slim 基底 + 生产依赖 + prisma CLI/engines + web dist），⚠ 以实测为准；对后台管理系统的部署场景不构成问题；
- docs 站不进镜像；如确需「文档也随容器走」，可在构建时一并 `vitepress build` 后挂到 `/docs` 路径（不推荐，膨胀构建时间与镜像）。

## 5. 草案（落地时实测调整）

### 5.1 Dockerfile（多阶段，根目录）

```dockerfile
# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:22-bookworm-slim

# ---------- 基底：启用 pnpm ----------
FROM ${NODE_IMAGE} AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

# ---------- 依赖清单层（缓存关键）----------
FROM base AS manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json    apps/web/
COPY apps/docs/package.json   apps/docs/
COPY packages/request/package.json packages/request/
# 弱网可选：--build-arg NPM_REGISTRY=... / PRISMA_ENGINES_MIRROR=...
RUN pnpm fetch

# ---------- 构建：web 产物 + prisma client ----------
FROM manifests AS build
COPY . .
RUN pnpm install --frozen-lockfile --offline \
      --filter @admin-ai/web --filter @admin-ai/server --filter @admin-ai/request
RUN pnpm --filter @admin-ai/web build
RUN pnpm --filter @admin-ai/server exec prisma generate

# ---------- 生产依赖（不含 dev；prisma 已移入 dependencies）----------
FROM manifests AS prod-deps
COPY . .
RUN pnpm install --frozen-lockfile --offline --prod \
      --filter @admin-ai/server --filter @admin-ai/request

# ---------- 运行镜像 ----------
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production PORT=3000 \
    DATABASE_URL="file:/data/app.db" WEB_DIST=/app/web-dist
WORKDIR /app
# workspace 结构整体带入（含根/子包 node_modules 的相对符号链接）
COPY --from=prod-deps /app/node_modules            ./node_modules
COPY --from=prod-deps /app/packages/request        ./packages/request
COPY --from=prod-deps /app/apps/server/node_modules ./apps/server/node_modules
COPY apps/server/src            ./apps/server/src
COPY apps/server/prisma         ./apps/server/prisma
COPY apps/server/seed           ./apps/server/seed
COPY apps/server/prisma.config.js apps/server/package.json ./apps/server/
COPY --from=build /app/apps/server/generated ./apps/server/generated
COPY --from=build /app/apps/web/dist         ./web-dist
COPY docker-entrypoint.sh /usr/local/bin/
RUN mkdir -p /data && chown -R node:node /data /app
USER node
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["docker-entrypoint.sh"]
```

### 5.2 docker-entrypoint.sh

```sh
#!/bin/sh
set -e
cd /app/apps/server

if [ "${DB_DRIVER:-prisma}" = "prisma" ]; then
  DB_FILE=$(echo "${DATABASE_URL:-file:/data/app.db}" | sed 's|^file:||')
  FIRST_RUN=0
  [ ! -f "$DB_FILE" ] && FIRST_RUN=1
  ./node_modules/.bin/prisma migrate deploy
  # 仅首次启动播种：db:seed 是「清空后重播」语义，绝不能每次启动执行
  if [ "$FIRST_RUN" = "1" ] && [ "${SEED_ON_FIRST_RUN:-1}" = "1" ]; then
    node prisma/seed.js
  fi
fi
# mongo 模式：集合/索引/种子由 seed/mongo.js 幂等维护，建议部署后手动执行一次：
#   docker compose exec app node /app/apps/server/seed/mongo.js

exec node src/index.js
```

### 5.3 compose.yaml

```yaml
services:
  app:
    build: .
    ports: ['3000:3000']
    environment:
      JWT_SECRET: ${JWT_SECRET:?请在 .env 或环境中提供强随机 JWT_SECRET}
      # DB_DRIVER: mongo          # 启用 mongo profile 时打开
      # MONGODB_URL: mongodb://mongo:27017
    volumes:
      - app-data:/data

  mongo:
    image: mongo:7
    profiles: [mongo]
    volumes:
      - mongo-data:/data/db

volumes:
  app-data:
  mongo-data:
```

### 5.4 .dockerignore（要点）

```
node_modules
**/node_modules
.git
apps/server/data
apps/server/generated     # 构建阶段重新 generate
apps/web/dist
apps/docs/*               # 但保留 package.json（workspace/lockfile 一致性）
!apps/docs/package.json
.env
**/.env
**/.env.*
!**/.env.example
*.md
!apps/docs/package.json
```

## 6. 后续优化项（本期不做）

1. **pnpm deploy 减重**：待 pnpm 11 deploy 语义实测确认后，可换路线 II 收缩镜像；
2. **构建期分发 corepack/pnpm 离线化**：弱网环境把 pnpm 二进制固化进基底层；
3. **多架构镜像**（linux/amd64 + arm64）：better-sqlite3 与 Prisma engines 均有 arm64 支持，buildx 一次产出；
4. **迁移与运行分离**：K8s 类编排下把 `migrate deploy` 拆为 initContainer/Job，entrypoint 退化为纯启动——镜像不变，仅编排差异。

## 7. 验证清单（落地 DoD）

1. `docker build` 在干净环境成功（无本地缓存依赖）；
2. `docker run -e JWT_SECRET=test -p 3000:3000 -v tmp:/data` 首启：自动迁移 + 播种，三种子账号可登录，系统管理 CRUD 正常，web 页面（含刷新深层路由，验证 SPA fallback）与 `/api` 均从 3000 端口服务；
3. 重启容器：数据保留、**不重播种**（新建的业务数据仍在）；
4. 未知 API 路径返回 JSON 404（非 index.html）；`docker inspect` 健康状态 healthy；
5. compose `--profile mongo` 起双服务，手动执行 mongo 播种后三账号全流程回归；
6. 镜像内确认无 `.env`、无 `apps/server/data`；容器以 node 用户运行。

## 8. 结论

系统**可以且适合**整体打包为单个 Docker 镜像：后端免构建直跑、前端纯静态产物、SQLite 零外部服务的组合天然适配单容器形态；唯一的架构性补齐是 server 静态托管能力（约 20 行）。原生依赖（better-sqlite3）与 Prisma 7 生成产物是构建流程要点而非障碍，草案已给出对应处理。建议按 §3 清单排期落地，验收以 §7 清单为准。

## 9. 落地记录（2026-07-13，TASKS.md M7 #42–#47）

方案已全量落地并按 §7 清单验证通过（实测环境 WSL2 Ubuntu-24.04 + Docker 29）。草案与实测的偏差修正：

1. **pnpm 11 容器内需 `CI=true`**：无 TTY 下 `--prod` 重装触发 `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`，基底层显式设置；
2. **`pnpm fetch` 会物化全量虚拟店**：fetch 把 lockfile 内全部包（含 dev / web 依赖）写入 `node_modules/.pnpm`，`--prod --filter` 重装只重建链接不清理——prod-deps 阶段须先 `rm -rf node_modules` 再离线重装（node_modules 796MB → 386MB，省 ~1.6GB 镜像层）；
3. **runtime 补装 openssl**：Prisma schema engine 的 libssl 版本检测在 slim 镜像缺 openssl 时告警回退（migrate 仍可用），按官方建议 apt 安装消除；
4. **新增根 `.gitattributes`**（`*.sh eol=lf`）：Windows checkout（`autocrlf=true`）会把 entrypoint 转 CRLF 破坏容器内 shebang。

⚠ 实测点结论：`--frozen-lockfile` 携 docs 清单通过（§4.3 成立）；better-sqlite3 在 slim 镜像走 prebuild-install 预编译、无编译工具链需求（§4.1 成立）；镜像 1.31GB（docker 29 磁盘占用口径），高于 §4.5 预估——主要成本是 prisma CLI 依赖链（studio-core / typescript / pglite 等约 150MB），§6 优化项 1（pnpm deploy 减重）维持暂缓。
