# 快速开始

本指南将帮助你从零开始运行 Admin AI 项目。

## 环境要求

在开始之前，请确保你的开发环境满足以下要求：

- **Node.js** >= 18.0.0
- **pnpm** >= 9.0.0

如果还没有安装 pnpm，可以通过以下命令安装：

```bash
npm install -g pnpm
```

## 克隆项目

```bash
git clone <repository-url>
cd admin-ai
```

## 安装依赖

```bash
pnpm install
```

## 配置后端环境变量

进入后端目录，创建环境变量文件：

```bash
cd packages/backend
```

创建 `.env` 文件，添加数据库连接配置：

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret-key"
```

::: tip 说明

- `DATABASE_URL`: 项目默认使用 SQLite 数据库，`file:./dev.db` 表示在 `packages/backend/prisma/` 目录下创建 `dev.db` 文件
- `JWT_SECRET`: 用于 JWT 令牌签名的密钥，生产环境请使用复杂的随机字符串
  :::

## 初始化数据库

回到项目根目录，执行以下命令初始化数据库：

```bash
cd ../..

# 生成 Prisma Client
pnpm --filter backend db:generate

# 同步数据库结构
pnpm --filter backend db:push

# 填充初始数据（创建管理员账号）
pnpm --filter backend db:seed
```

## 启动开发服务器

```bash
# 同时启动前端和后端服务
pnpm dev
```

或者分别启动：

```bash
# 仅启动前端
pnpm dev:frontend  # http://localhost:3000

# 仅启动后端
pnpm dev:backend   # http://localhost:3001
```

## 访问系统

启动成功后，打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 默认账号

使用以下账号登录系统：

| 用户名 | 密码     | 角色   |
| ------ | -------- | ------ |
| admin  | admin123 | 管理员 |

::: warning 安全提示
首次登录后，建议立即修改默认密码。
:::

## 常用命令

| 命令                              | 说明                              |
| --------------------------------- | --------------------------------- |
| `pnpm dev`                        | 启动所有开发服务                  |
| `pnpm dev:frontend`               | 仅启动前端                        |
| `pnpm dev:backend`                | 仅启动后端                        |
| `pnpm build`                      | 构建所有包                        |
| `pnpm lint`                       | 代码检查                          |
| `pnpm lint:fix`                   | 代码检查并自动修复                |
| `pnpm test`                       | 运行测试                          |
| `pnpm --filter backend db:studio` | 打开 Prisma Studio 数据库管理界面 |

## 下一步

- 查看 [项目结构](/guide/) 了解代码组织方式
- 查看 [API 文档](/api/) 了解后端接口
