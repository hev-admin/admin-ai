# 测试指南

Admin AI 使用 Vitest 作为测试框架，覆盖后端服务、中间件、工具函数和前端组件。

## 运行测试

```bash
# 全部测试（监听模式）
pnpm test

# 全部测试（单次运行）
pnpm test:run

# 后端测试
cd packages/backend && npx vitest run

# 前端测试
cd packages/frontend && npx vitest run

# 运行单个测试文件
cd packages/backend && npx vitest run tests/services/auth.test.js

# 带覆盖率报告
cd packages/backend && npx vitest run --coverage
```

## 测试结构

### 后端测试

```
packages/backend/tests/
├── services/
│   ├── auth.test.js       # 认证服务测试
│   ├── user.test.js       # 用户服务测试
│   ├── role.test.js       # 角色服务测试
│   ├── menu.test.js       # 菜单服务测试
│   ├── log.test.js        # 日志服务测试
│   └── setting.test.js    # 设置服务测试
├── middleware/
│   ├── auth.test.js       # 认证中间件测试
│   ├── permission.test.js # 权限中间件测试
│   └── rateLimit.test.js  # 速率限制测试
├── routes/
│   ├── auth.test.js       # 认证路由测试
│   └── user.test.js       # 用户路由测试
└── utils/
    ├── response.test.js   # 响应工具测试
    ├── cache.test.js      # 缓存工具测试
    └── store.test.js      # 存储适配器测试
```

### 前端测试

```
packages/frontend/tests/
├── composables/           # 组合式函数测试
├── directives/            # 指令测试
├── router/                # 路由测试
├── stores/                # 状态管理测试
└── utils/                 # 工具函数测试
```

## 编写测试

### 后端测试示例

```javascript
import { beforeEach, describe, expect, it, vi } from 'vitest'
import prisma from '../../src/config/database.js'
import { roleService } from '../../src/services/role.js'

// Mock 数据库
vi.mock('../../src/config/database.js', () => ({
  default: {
    role: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}))

describe('roleService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return paginated roles', async () => {
    prisma.role.findMany.mockResolvedValue([{ id: '1', name: 'admin' }])
    prisma.role.count.mockResolvedValue(1)

    const result = await roleService.getList(1, 10)

    expect(result.list).toHaveLength(1)
    expect(result.total).toBe(1)
  })
})
```

### 关键约定

- 使用 `vi.mock()` mock 外部依赖（prisma、bcryptjs、jsonwebtoken）
- 每个 `describe` 块前使用 `beforeEach(() => vi.clearAllMocks())`
- 中间件测试需要模拟 Hono 的 Context 对象
- 缓存/存储测试使用 `vi.useFakeTimers()` 控制时间

## 覆盖率阈值

后端配置了覆盖率阈值，防止覆盖率下降：

```
// vitest.config.js
coverage: {
  thresholds: {
    lines: 60,
    functions: 60,
    branches: 50,
    statements: 60,
  },
}
```

## CI 集成

GitHub Actions 工作流会自动运行测试：

```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: pnpm test:run
```
