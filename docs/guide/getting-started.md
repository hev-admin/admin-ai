# 快速开始

本指南将帮助你从零开始运行 Admin AI 项目。

## 环境要求

- **Node.js** >= 18.0.0
- **pnpm** >= 9.0.0

```bash
npm install -g pnpm
```

## 克隆项目

```bash
git clone <repository-url>
cd admin-ai
```

## 环境变量配置

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env`，至少设置以下变量：

```env
# 必填：JWT 签名密钥，至少 32 位随机字符串
JWT_SECRET=your-strong-secret-key-at-least-32-chars

# 可选：后端端口（默认 3001）
PORT=3001

# 可选：CORS 允许的前端域名（默认 http://localhost:3000）
CORS_ORIGINS=http://localhost:3000

# 可选：运行环境
NODE_ENV=development
```

::: warning 安全提示
`JWT_SECRET` 是必需的环境变量，服务启动时会校验。生产环境请使用足够复杂的随机字符串。
:::

## 安装依赖

```bash
pnpm install
```

## 初始化数据库

```bash
# 生成 Prisma Client
pnpm --filter backend db:generate

# 同步数据库结构
pnpm --filter backend db:push

# 填充初始数据（创建管理员账号）
pnpm --filter backend db:seed
```

## 启动开发服务器

```bash
# 同时启动前端和后端
pnpm dev
```

或者分别启动：

```bash
pnpm dev:frontend  # http://localhost:3000
pnpm dev:backend   # http://localhost:3001
pnpm dev:docs      # http://localhost:5173
```

## 访问系统

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 默认账号

| 用户名 | 密码     | 角色   |
| ------ | -------- | ------ |
| admin  | admin123 | 管理员 |

::: warning
首次登录后，请立即修改默认密码。
:::

## 常用命令

| 命令                              | 说明                 |
| --------------------------------- | -------------------- |
| `pnpm dev`                        | 启动所有开发服务     |
| `pnpm dev:frontend`               | 仅启动前端           |
| `pnpm dev:backend`                | 仅启动后端           |
| `pnpm build`                      | 构建所有包           |
| `pnpm lint`                       | 代码检查             |
| `pnpm lint:fix`                   | 代码检查并自动修复   |
| `pnpm test`                       | 运行测试（监听模式） |
| `pnpm test:run`                   | 运行测试（单次）     |
| `pnpm --filter backend db:studio` | 打开 Prisma Studio   |

## 健康检查

后端提供了健康检查接口：

```bash
curl http://localhost:3001/health
# {"status":"ok","timestamp":"2026-01-01T00:00:00.000Z"}
```

## 下一步

- [架构设计](/guide/architecture) — 了解项目架构和设计决策
- [安全机制](/guide/security) — 了解安全特性
- [API 文档](/api/) — 了解后端接口
