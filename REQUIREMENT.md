## 需求描述

- [x] 这是一个 Monorepo 项目
- [x] docs 是该项目的说明文档，使用 vitepress 开发
- [x] packages 是该项目的源代码
- [x] 该项目为一个通用的 admin 中后台开发框架
- [x] 该项技术栈
  - 前端：Vue3 + vue-router + pinia + UnoCSS + VueUse + naive-ui
  - 后端：Hono + Prisma + MySQL/PostgreSQL/SQLite/MongoDB
  - 构建：Vite 8.0
  - 测试：Vitest
  - 静态类型检查：ESLint + @antfu/eslint-config 使用 eslint fix 格式化，而禁用 Prettier
- [x] frontend 的 auto-imports 导出一个 json 文件，用于导入 eslint.config.js 使用 @antfu@eslint-config 官方推荐的方式导入
- [x] 参考 @antfu/eslint-config 官方推荐的 .vscode 配置，实现保存时 lint 并格式化文件
- [x] 使用 lint-staged 和 simple-git-hooks 检测提交时的文件语法错误，启用自动多线程

## 基本原则

- 使用纯 JavaScript 开发，不使用 TypeScript
- 实现功能时，先参考使用的库文档，使用库的形式实现功能，避免重复造轮子
- 在写样式时，使用 UnoCSS 的 Attribute 模式

## 需求实现步骤

### 阶段一：基础框架搭建 ✅ 已完成

- [x] 项目初始化 (Monorepo + pnpm workspace)
- [x] 后端框架搭建 (Hono + Prisma)
- [x] 前端框架搭建 (Vue3 + Vite + UnoCSS)
- [x] 数据库模型设计 (User, Role, Menu, UserRole, RolePermission)
- [x] 文档框架搭建 (VitePress)

### 阶段二：认证系统 ✅ 已完成

- [x] 后端认证 API (登录/注册/登出/获取用户信息)
- [x] JWT 中间件
- [x] 前端登录页面
- [x] 前端注册页面
- [x] Pinia 认证状态管理
- [x] 路由守卫 (认证检查)
- [x] Axios 请求/响应拦截器

### 阶段三：布局与导航 ✅ 已完成

- [x] 默认布局组件 (DefaultLayout)
- [x] 侧边栏组件 (AppSidebar) - 可折叠
- [x] 顶部栏组件 (AppHeader) - 用户信息/登出
- [x] 仪表盘页面
- [x] 404 错误页面

### 阶段四：后端管理 API ✅ 已完成

- [x] 用户管理 API (CRUD + 分页 + 搜索)
- [x] 角色管理 API (CRUD + 分页)
- [x] 菜单管理 API (CRUD + 树形结构)
- [x] 数据库种子 (初始管理员账号)

### 阶段五：管理页面基础 ✅ 已完成

- [x] 用户管理列表页
- [x] 角色管理列表页
- [x] 菜单管理列表页 (树形表格)
- [x] 用户新增/编辑弹窗
- [x] 角色新增/编辑弹窗
- [x] 菜单新增/编辑弹窗
- [x] 角色权限分配功能
- [x] 用户角色分配功能

### 阶段六：shadcn-vue 组件集成 ✅ 已完成

- [x] 初始化 shadcn-vue (创建 UI 组件库)
- [x] 替换表单组件 (Input, Button, Select, Label)
- [x] 替换表格组件 (Table)
- [x] 替换弹窗组件 (Dialog)
- [x] 替换登录注册页面组件

### 阶段七：权限控制 ✅ 已完成

- [x] 前端菜单权限过滤 (根据用户角色动态生成菜单)
- [x] 按钮级权限指令 (v-permission)
- [x] 后端接口权限校验中间件

### 阶段八：用户个人功能 ✅ 已完成

- [x] 个人信息页面
- [x] 修改密码功能
- [x] 头像上传功能

### 阶段九：高级功能 ✅ 已完成

- [x] 批量删除
- [x] 数据导入/导出
- [x] 操作日志记录
- [x] 系统设置页面

### 阶段十：文档完善 ✅ 已完成

- [x] API 接口文档
- [x] 快速开始指南
- [x] 部署文档
- [x] 开发规范文档
