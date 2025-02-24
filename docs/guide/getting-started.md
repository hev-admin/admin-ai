# 快速开始

本指南将帮助你快速搭建和运行 Admin AI 项目。

## 环境要求

- Node.js 16.0 或更高版本
- pnpm 8.0 或更高版本

## 安装

```bash
# 克隆项目
git clone https://github.com/your-org/admin-ai.git

# 进入项目目录
cd admin-ai

# 安装依赖
pnpm install
```

## 开发

### 启动文档站点

```bash
pnpm -F @admin-ai/docs dev
```

### 启动管理系统

```bash
pnpm -F @admin-ai/admin dev
```

## 项目结构

```
admin-ai
├── packages         # 项目包目录
│   ├── admin       # 管理系统前端
│   └── server      # 后端服务
├── docs            # 文档站点
└── package.json
```

## 下一步

- 了解 [项目架构设计](/guide/architecture)
- 查看 [组件使用指南](/guide/components)
- 探索 [AI 功能集成](/guide/ai-features)