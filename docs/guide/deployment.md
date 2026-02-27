# 部署指南

## 环境要求

- Node.js >= 18.0.0
- pnpm >= 9.0.0

## 构建项目

```bash
pnpm install
pnpm --filter backend db:generate
pnpm build
```

## 环境变量

复制 `.env.example` 并配置：

```env
JWT_SECRET=your-strong-production-secret-at-least-32-chars
PORT=3001
CORS_ORIGINS=https://your-domain.com
NODE_ENV=production
```

## 方式一：Docker 部署（推荐）

### 使用 Docker Compose

```bash
# 配置环境变量
cp .env.example .env
# 编辑 .env 文件...

# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f
```

### 使用 Dockerfile

```bash
# 构建镜像
docker build -t admin-ai .

# 运行容器
docker run -d \
  -p 3001:3001 \
  -e JWT_SECRET=your-secret \
  -e CORS_ORIGINS=https://your-domain.com \
  -v admin-data:/app/data \
  admin-ai
```

## 方式二：Nginx + Node.js

### 前端部署

构建后的静态文件在 `packages/frontend/dist` 目录。

#### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /path/to/admin-ai/packages/frontend/dist;
    index index.html;

    # 开启 gzip（如果构建已生成 .gz 文件可直接使用）
    gzip_static on;

    # 前端路由 SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 上传文件目录
    location /uploads {
        proxy_pass http://127.0.0.1:3001;
    }
}
```

### 后端部署

#### 直接启动

```bash
cd packages/backend
node src/index.js
```

#### PM2 管理

```bash
npm install -g pm2

# 启动
pm2 start packages/backend/src/index.js --name admin-api

# PM2 配置文件 (ecosystem.config.cjs)
module.exports = {
  apps: [{
    name: 'admin-api',
    script: 'packages/backend/src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
```

## 数据库

### SQLite（默认）

无需额外配置，数据库文件存储在 `packages/backend/prisma/dev.db`。

### MySQL / PostgreSQL

修改 `prisma/schema.prisma` 中的 datasource 和 adapter 配置，更新 `DATABASE_URL` 环境变量。

### 数据库迁移

```bash
cd packages/backend
npx prisma db push      # 同步 Schema
npx prisma db seed      # 填充数据
```

## CI/CD

项目内置 GitHub Actions 工作流（`.github/workflows/ci.yml`）：

- 在 push 到 main 和 PR 时自动触发
- 执行 lint、test、build
- 使用 pnpm 缓存加速

## 健康检查

后端提供 `/health` 端点，可用于负载均衡器健康检查：

```bash
curl http://localhost:3001/health
# {"status":"ok","timestamp":"..."}
```

## 安全建议

1. **JWT 密钥**：至少 32 个字符的随机字符串
2. **HTTPS**：生产环境务必启用 SSL/TLS
3. **数据库**：定期备份，生产环境建议使用 MySQL/PostgreSQL
4. **日志**：配置日志轮转，避免磁盘占满
5. **防火墙**：仅开放 80/443 端口
6. **CORS**：仅配置实际使用的前端域名
