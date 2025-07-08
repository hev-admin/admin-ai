# 开发规范

本文档定义了 Admin AI 项目的开发规范和最佳实践。

## 技术栈

- **前端**: Vue3 + Vue Router + Pinia + UnoCSS + Naive UI
- **后端**: Hono + Prisma
- **构建**: Vite
- **代码检查**: ESLint + @antfu/eslint-config

## 基本原则

1. 使用纯 JavaScript，不使用 TypeScript
2. 使用 UnoCSS Attributify 模式编写样式
3. 优先使用库提供的功能，避免重复造轮子

## 代码风格

### ESLint 配置

项目使用 `@antfu/eslint-config`，保存时自动格式化。

```bash
# 检查代码
pnpm lint

# 自动修复
pnpm lint:fix
```

### 命名规范

| 类型      | 规范       | 示例            |
| --------- | ---------- | --------------- |
| 文件名    | kebab-case | `user-list.vue` |
| 组件名    | PascalCase | `UserList`      |
| 变量/函数 | camelCase  | `getUserList`   |
| 常量      | UPPER_CASE | `MAX_PAGE_SIZE` |
| CSS 类名  | kebab-case | `user-card`     |

## 前端规范

### 目录结构

```
src/
├── api/          # API 接口
├── assets/       # 静态资源
├── components/   # 公共组件
├── directives/   # 自定义指令
├── layouts/      # 布局组件
├── pages/        # 页面组件
├── router/       # 路由配置
├── stores/       # Pinia 状态
└── utils/        # 工具函数
```

### Vue 组件规范

使用 `<script setup>` 语法：

```vue
<script setup>
import { userApi } from '@/api/user.js'

const users = ref([])
const loading = ref(false)

async function fetchUsers() {
  loading.value = true
  try {
    const res = await userApi.getList()
    users.value = res.data
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div>
    <n-spin :show="loading">
      <div v-for="user in users" :key="user.id">
        {{ user.name }}
      </div>
    </n-spin>
  </div>
</template>
```

### UnoCSS Attributify 模式

使用属性模式编写样式：

```vue
<!-- 推荐 -->
<div flex items-center justify-between p-4>
  <span text-lg font-bold>标题</span>
  <button btn btn-primary>按钮</button>
</div>

<!-- 不推荐 -->
<div class="flex items-center justify-between p-4">
  <span class="text-lg font-bold">标题</span>
</div>
```

### API 调用规范

```javascript
// api/user.js
import request from '@/utils/request.js'

export const userApi = {
  getList: params => request.get('/users', { params }),
  getById: id => request.get(`/users/${id}`),
  create: data => request.post('/users', data),
  update: (id, data) => request.put(`/users/${id}`, data),
  delete: id => request.delete(`/users/${id}`),
}
```

## 后端规范

### 目录结构

```
src/
├── config/       # 配置文件
├── middleware/   # 中间件
├── routes/       # 路由
├── services/     # 业务逻辑
└── utils/        # 工具函数
```

### 路由规范

```javascript
// routes/user.js
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { userService } from '../services/user.js'
import { error, success } from '../utils/response.js'

const user = new Hono()

user.use('*', authMiddleware())

user.get('/', async (c) => {
  const { page = 1, pageSize = 10 } = c.req.query()
  const result = await userService.getList(Number(page), Number(pageSize))
  return c.json(success(result))
})

export default user
```

### 响应格式

统一使用 `utils/response.js` 中的函数：

```javascript
// 成功响应
c.json(success(data, '操作成功'))

// 错误响应
c.json(error('错误信息'), 400)

// 分页响应
c.json(paginate(list, page, pageSize, total))
```

## Git 规范

### 提交信息格式

```
<type>: <description>

[optional body]
```

类型说明：

| 类型     | 说明      |
| -------- | --------- |
| feat     | 新功能    |
| fix      | 修复 bug  |
| docs     | 文档更新  |
| style    | 代码格式  |
| refactor | 重构      |
| test     | 测试相关  |
| chore    | 构建/工具 |

示例：

```
feat: 添加用户批量删除功能

- 新增批量删除 API
- 前端添加多选和批量删除按钮
```

### 分支管理

- `main`: 主分支，保持稳定
- `feature/*`: 功能分支
- `fix/*`: 修复分支

## 测试规范

使用 Vitest 编写测试：

```javascript
import { describe, expect, it } from 'vitest'

describe('userService', () => {
  it('should create user', async () => {
    const user = await userService.create({
      username: 'test',
      email: 'test@example.com',
    })
    expect(user.username).toBe('test')
  })
})
```

运行测试：

```bash
pnpm test        # 监听模式
pnpm test:run    # 单次运行
```
