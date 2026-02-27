# 开发规范

## 基本原则

1. 使用纯 JavaScript，不使用 TypeScript
2. 使用 UnoCSS Attributify 模式编写样式
3. 优先使用库提供的功能，避免重复造轮子
4. 所有 API 写入接口必须使用 Zod 验证器

## 代码风格

### ESLint

项目使用 `@antfu/eslint-config`，保存时自动格式化。

```bash
pnpm lint       # 检查代码
pnpm lint:fix   # 自动修复
```

### 命名规范

| 类型      | 规范       | 示例                 |
| --------- | ---------- | -------------------- |
| 文件名    | kebab-case | `user-list.vue`      |
| 组件名    | PascalCase | `UserList`           |
| 变量/函数 | camelCase  | `getUserList`        |
| 常量      | UPPER_CASE | `MAX_PAGE_SIZE`      |
| 权限标识  | 冒号分隔   | `system:user:create` |

## 前端规范

### Vue 组件

使用 `<script setup>` 语法。Vue/Router/Pinia/i18n API 自动导入，无需手动 import。

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

onMounted(fetchUsers)
</script>
```

### UnoCSS Attributify

```vue
<!-- 推荐 -->
<div flex items-center justify-between p-4>
  <span text-lg font-bold>标题</span>
</div>

<!-- 不推荐 -->
<div class="flex items-center justify-between p-4">
  ...
</div>
```

### API 调用

```javascript
// api/user.js - 一个文件对应一个后端模块
import request from '@/utils/request.js'

export const userApi = {
  getList: params => request.get('/users', { params }),
  create: data => request.post('/users', data),
  update: (id, data) => request.put(`/users/${id}`, data),
  delete: id => request.delete(`/users/${id}`),
}
```

### 表单验证

所有管理页面的表单必须配置 Naive UI 表单验证规则：

```vue
<script setup>
const formRef = ref(null)
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名3-50个字符', trigger: 'blur' },
  ],
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  }
  catch {

  }
  // 提交逻辑...
}
</script>

<template>
  <n-form ref="formRef" :model="formData" :rules="formRules">
    <n-form-item label="用户名" path="username">
      <n-input v-model:value="formData.username" />
    </n-form-item>
  </n-form>
</template>
```

### 权限指令

```vue
<!-- 按钮级权限控制 -->
<n-button v-permission="'system:user:create'" @click="handleAdd">
新增
</n-button>
```

## 后端规范

### 路由 + 验证 + 权限

```javascript
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../middleware/auth.js'
import { permissionMiddleware } from '../middleware/permission.js'
import { createUserSchema } from '../validators/user.js'

const user = new Hono()
user.use('*', authMiddleware())

// 写入接口必须：1) 权限中间件 2) Zod 验证器
user.post('/', permissionMiddleware('system:user:create'), zValidator('json', createUserSchema), async (c) => {
  const data = c.req.valid('json')
  // ...
})
```

### 响应格式

```javascript
import { error, paginate, success } from '../utils/response.js'

c.json(success(data, '操作成功'))
c.json(error('错误信息'), 400)
c.json(paginate(list, page, pageSize, total))
```

### 添加新验证器

在 `validators/` 目录创建 Zod Schema：

```javascript
import { z } from 'zod'

export const createSomethingSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50),
  status: z.number().int().min(0).max(1).optional().default(1),
})
```

## Git 规范

### 提交格式

```
<type>: <description>
```

| 类型     | 说明      |
| -------- | --------- |
| feat     | 新功能    |
| fix      | 修复 bug  |
| docs     | 文档更新  |
| style    | 代码格式  |
| refactor | 重构      |
| test     | 测试相关  |
| chore    | 构建/工具 |

### 分支管理

- `main`: 主分支，保持稳定
- `feature/*`: 功能分支
- `fix/*`: 修复分支
