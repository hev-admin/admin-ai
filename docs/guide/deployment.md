# 部署指南

本文档介绍如何将 Admin AI 部署到生产环境。

## 环境要求

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- 数据库（SQLite / MySQL / PostgreSQL）

## 构建项目

```bash
# 安装依赖
pnpm install

# 构建前端
pnpm --filter frontend build

# 生成 Prisma Client
pnpm --filter backend db:generate
```

## 前端部署

### 静态文件部署

前端构建后会在 `packages/frontend/dist` 目录生成静态文件，可以部署到任意静态文件服务器。

#### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/admin-ai/packages/frontend/dist;
    index index.html;

    # 前端路由支持
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

    # 静态文件上传目录
    location /uploads {
        proxy_pass http://127.0.0.1:3001;
    }
}
```

## 后端部署

### 环境变量配置

在 `packages/backend` 目录创建 `.env` 文件：

```env
# 数据库连接
DATABASE_URL="file:./prod.db"

# JWT 密钥（生产环境请使用复杂随机字符串）
JWT_SECRET="your-production-secret-key"

# 服务端口
PORT=3001
```

### 数据库配置

#### SQLite（默认）

```env
DATABASE_URL="file:./prod.db"
```

#### MySQL

```env
DATABASE_URL="mysql://user:password@localhost:3306/admin_ai"
```

#### PostgreSQL

```env
DATABASE_URL="postgresql://user:password@localhost:5432/admin_ai"
```

### 初始化数据库

```bash
cd packages/backend

# 同步数据库结构
npx prisma db push

# 填充初始数据
node prisma/seed.js
```

### 启动服务

#### 直接启动

```bash
cd packages/backend
node src/index.js
```

#### 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start packages/backend/src/index.js --name admin-api

# 查看状态
pm2 status

# 查看日志
pm2 logs admin-api
```

#### PM2 配置文件

创建 `ecosystem.config.cjs`：

```javascript
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

启动：

```bash
pm2 start ecosystem.config.cjs
```

## Docker 部署

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/backend/package.json ./packages/backend/

# 安装依赖
RUN pnpm install --frozen-lockfile --prod

# 复制源码
COPY packages/backend ./packages/backend

# 生成 Prisma Client
RUN cd packages/backend && npx prisma generate

EXPOSE 3001

CMD ["node", "packages/backend/src/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - '3001:3001'
    environment:
      - DATABASE_URL=file:./data/prod.db
      - JWT_SECRET=your-secret-key
    volumes:
      - ./data:/app/packages/backend/data
      - ./uploads:/app/packages/backend/public/uploads

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
    volumes:
      - ./packages/frontend/dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - api
```

## 安全建议

1. **JWT 密钥**: 使用足够长度的随机字符串
2. **HTTPS**: 生产环境务必启用 HTTPS
3. **数据库**: 定期备份数据库
4. **日志**: 配置日志轮转，避免磁盘占满
5. **防火墙**: 仅开放必要端口

## 常见问题

### 数据库迁移

当数据模型变更时：

```bash
cd packages/backend
npx prisma migrate deploy
```

### 静态文件 404

确保 Nginx 配置了 `try_files` 指向 `index.html`。

### API 跨域问题

后端已配置 CORS，如需自定义请修改 `packages/backend/src/app.js`。
