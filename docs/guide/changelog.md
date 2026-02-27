# 更新日志

## v1.0.0

### 阶段一：基础框架搭建

- Monorepo 项目结构 (pnpm workspace)
- 后端框架 (Hono + Prisma + SQLite)
- 前端框架 (Vue3 + Vite + UnoCSS)
- 数据库模型设计 (User, Role, Menu, UserRole, RolePermission)
- VitePress 文档站点

### 阶段二：认证系统

- JWT 双 Token 认证机制 (Access Token + Refresh Token)
- 登录/注册/登出 API
- 密码强度校验和 bcrypt 加密
- 登录失败锁定机制
- 前端登录/注册页面 + 路由守卫

### 阶段三：布局与导航

- DefaultLayout 布局组件
- 可折叠侧边栏 (AppSidebar)
- 顶部导航栏 (AppHeader) + 面包屑 (AppBreadcrumb)
- 多标签页管理 (TabsView)
- 仪表盘页面 + 404 页面

### 阶段四：后端管理 API

- 用户管理 CRUD + 分页搜索
- 角色管理 CRUD + 权限分配
- 菜单管理 CRUD + 树形结构
- 数据库种子脚本 (初始管理员)

### 阶段五：管理页面

- 用户/角色/菜单管理列表页
- 新增/编辑弹窗
- 角色权限分配 (菜单树勾选)
- 用户角色分配

### 阶段六：Naive UI 集成

- 全面替换为 Naive UI 组件
- 自动按需注册组件

### 阶段七：权限控制

- 前端菜单权限过滤
- v-permission 按钮级权限指令
- 后端权限校验中间件

### 阶段八：用户个人功能

- 个人信息页面
- 修改密码
- 头像上传

### 阶段九：高级功能

- 批量删除
- 数据导出 (JSON)
- 操作日志自动记录
- 系统设置页面

### 阶段十：文档完善

- API 接口文档
- 快速开始指南
- 部署文档
- 开发规范文档

---

## v1.1.0

### 阶段十一：安全加固

- CORS 白名单配置 (替代无限制 cors)
- 环境变量启动校验 (JWT_SECRET 必填)
- 统一 bcrypt salt 轮数为 12
- 可切换存储适配器 (内存 → Redis)
- 权限中间件挂载到所有写入路由

### 阶段十二：后端数据验证

- User/Role/Menu/Setting Zod 验证器
- 所有写入路由应用 zValidator
- 统一密码长度校验 (最少 8 位)

### 阶段十三：前端缺陷修复

- auth store 新增 fetchUser() 方法
- 所有 Pinia store 增加 loading/error 状态
- 用户/角色/菜单/设置页面表单验证规则
- 路由守卫增加权限校验 (meta.permission)

### 阶段十四：测试补全

- Role/Menu/Log/Setting 服务测试
- RateLimit/Permission 中间件测试
- Cache/Store 工具测试
- Vitest 覆盖率阈值配置

### 阶段十五：DevOps 基础设施

- GitHub Actions CI 工作流 (lint + test + build)
- 多阶段 Dockerfile
- docker-compose.yml
- .env.example 环境变量文档
- /health 健康检查接口

### 阶段十六：前端体验优化

- 完善 i18n 中英文翻译
- 搜索输入防抖
- 表格空状态提示
- 日志页面增强 (日期范围筛选、排序、详情查看)
- 设置页面动态加载
- 后端 API 动态排序支持

### 阶段十七：工程化与性能

- Gzip + Brotli 构建压缩
- Bundle 分析工具 (rollup-plugin-visualizer)
- 代码分割优化
