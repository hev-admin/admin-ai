# syntax=docker/dockerfile:1
# admin-ai 单镜像（M7，reports/2026-07-13-docker-packaging.md 形态 A）：
# server 同源托管 /api 与 web 静态产物，默认 SQLite 零外部依赖。
ARG NODE_IMAGE=node:22-bookworm-slim

# ---------- 基底：启用 pnpm（版本读根 package.json 的 packageManager） ----------
FROM ${NODE_IMAGE} AS base
# 弱网可选注入：--build-arg NPM_REGISTRY=https://registry.npmmirror.com \
#              --build-arg PRISMA_ENGINES_MIRROR=...
ARG NPM_REGISTRY=
ARG PRISMA_ENGINES_MIRROR=
# 空值在消费端均按未设置处理（corepack / prisma 对空字符串回退默认源）；
# CI=true：pnpm 11 在无 TTY 下清理 modules 目录（--prod 重装）需显式 CI 环境确认
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    COREPACK_NPM_REGISTRY=${NPM_REGISTRY} \
    PRISMA_ENGINES_MIRROR=${PRISMA_ENGINES_MIRROR} \
    CI=true
RUN corepack enable \
  && { [ -z "$NPM_REGISTRY" ] || echo "registry=$NPM_REGISTRY" > /root/.npmrc; }
WORKDIR /app

# ---------- 依赖清单层（缓存关键：源码变更不失效依赖层） ----------
FROM base AS manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json    apps/web/
# docs 不进镜像，但 lockfile importers 含 apps/docs，缺清单会使 --frozen-lockfile 失败
COPY apps/docs/package.json   apps/docs/
COPY packages/request/package.json packages/request/
RUN pnpm fetch

# ---------- 构建：web 产物 + prisma client ----------
FROM manifests AS build
COPY . .
RUN pnpm install --frozen-lockfile --offline \
      --filter @admin-ai/web --filter @admin-ai/server --filter @admin-ai/request
RUN pnpm --filter @admin-ai/web build
RUN pnpm --filter @admin-ai/server exec prisma generate

# ---------- 生产依赖（prisma 在 dependencies，支撑启动时 migrate deploy） ----------
FROM manifests AS prod-deps
COPY . .
# 先清掉 fetch 物化的全量虚拟店（含 dev/web 依赖），再从全局 store 离线重装：
# 仅 server + request 的生产依赖进入最终 node_modules（实测省 ~1.6GB）
RUN rm -rf node_modules \
  && pnpm install --frozen-lockfile --offline --prod \
       --filter @admin-ai/server --filter @admin-ai/request

# ---------- 运行镜像：workspace 结构整体带入（pnpm 相对符号链接天然成立） ----------
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production PORT=3000 \
    DATABASE_URL="file:/data/app.db" WEB_DIST=/app/web-dist
# openssl：Prisma schema engine 检测 libssl 版本所需（缺失时告警并按 1.1.x 回退）
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=prod-deps /app/node_modules             ./node_modules
COPY --from=prod-deps /app/packages/request         ./packages/request
COPY --from=prod-deps /app/apps/server/node_modules ./apps/server/node_modules
COPY apps/server/src              ./apps/server/src
COPY apps/server/prisma           ./apps/server/prisma
COPY apps/server/seed             ./apps/server/seed
COPY apps/server/prisma.config.js apps/server/package.json ./apps/server/
COPY --from=build /app/apps/server/generated ./apps/server/generated
COPY --from=build /app/apps/web/dist         ./web-dist
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && mkdir -p /data && chown -R node:node /data /app
USER node
VOLUME /data
EXPOSE 3000
# slim 镜像无 curl/wget，用 node 内置 fetch 探测（/api/health 在鉴权白名单）
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["docker-entrypoint.sh"]
