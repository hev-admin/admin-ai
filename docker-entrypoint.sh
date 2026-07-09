#!/bin/sh
# admin-ai 容器入口（M7）：prisma 模式启动前自迁移，仅首次启动播种。
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
# mongo 模式（DB_DRIVER=mongo）：不自动迁移/播种；集合、索引与种子由 seed/mongo.js
# 幂等维护，建议部署后手动执行一次：
#   docker compose exec app node /app/apps/server/seed/mongo.js

exec node src/index.js
