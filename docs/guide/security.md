# 安全机制

Admin AI 实现了多层安全防护，覆盖认证、授权、数据验证、传输安全等方面。

## 认证系统

### JWT 双 Token

- **Access Token**：有效期 2 小时，用于接口认证
- **Refresh Token**：有效期 7 天，用于无感刷新 Access Token
- Token 签名密钥通过环境变量 `JWT_SECRET` 配置，启动时强制校验

### 密码安全

- **bcrypt 加密**：统一使用 12 轮 salt
- **密码强度校验**：至少 8 位，必须包含大小写字母和数字
- **新旧密码校验**：修改密码时确保新密码与旧密码不同

### 登录保护

- **失败锁定**：同一账户连续 5 次登录失败后锁定 15 分钟
- **速率限制**：登录/注册接口每 IP 每分钟最多 5 次请求

## CORS 配置

CORS 白名单通过环境变量 `CORS_ORIGINS` 配置：

```env
# 多个域名用逗号分隔
CORS_ORIGINS=https://admin.example.com,https://dev.example.com
```

默认允许 `http://localhost:3000` 和 `http://localhost:5173`（开发环境）。

配置细节：

- 仅允许 `GET, POST, PUT, DELETE, OPTIONS` 方法
- 仅允许 `Content-Type, Authorization` 请求头
- 启用 Credentials（支持 Cookie 传递）
- 预检请求缓存 24 小时

## 速率限制

| 范围      | 限制           | 说明          |
| --------- | -------------- | ------------- |
| 全局 API  | 100 次/分钟/IP | 防止 API 滥用 |
| 登录/注册 | 5 次/分钟/IP   | 防止暴力破解  |

速率限制信息通过响应头暴露：

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000
```

### Redis 迁移

默认使用内存存储，适合单实例。生产环境可通过适配器切换到 Redis：

```javascript
import { setStore } from './utils/store.js'
setStore(new RedisStoreAdapter(redisClient))
```

## 数据验证

所有写入接口使用 Zod Schema 进行服务端验证：

| 模块 | 验证器文件              | 覆盖接口                       |
| ---- | ----------------------- | ------------------------------ |
| 认证 | `validators/auth.js`    | 登录、注册、修改密码           |
| 用户 | `validators/user.js`    | 创建、更新、批量删除、列表查询 |
| 角色 | `validators/role.js`    | 创建、更新、批量删除           |
| 菜单 | `validators/menu.js`    | 创建、更新、批量删除           |
| 设置 | `validators/setting.js` | 批量保存                       |

验证失败时返回 400 状态码和详细的错误信息。

## 权限控制 (RBAC)

### 后端

通过 `permissionMiddleware` 对写入接口进行权限检查：

```javascript
// 仅有 system:user:create 权限的用户才能创建用户
user.post('/', permissionMiddleware('system:user:create'), handler)
```

权限标识格式：`模块:资源:操作`，例如：

- `system:user:create` — 创建用户
- `system:role:update` — 更新角色
- `system:menu:delete` — 删除菜单

### 前端

- **路由守卫**：`router.beforeEach` 检查路由的 `meta.permission`，无权限则跳转 404
- **v-permission 指令**：按钮级权限控制

```vue
<n-button v-permission="'system:user:create'">
新增用户
</n-button>
```

## 文件上传安全

- 白名单校验文件类型：仅允许 `image/jpeg, image/png, image/gif, image/webp`
- 文件大小限制：最大 2MB
- 随机文件名：防止路径遍历攻击

## 环境变量

| 变量         | 必填 | 默认值                | 说明         |
| ------------ | ---- | --------------------- | ------------ |
| JWT_SECRET   | 是   | -                     | JWT 签名密钥 |
| PORT         | 否   | 3001                  | 后端端口     |
| CORS_ORIGINS | 否   | http://localhost:3000 | CORS 白名单  |
| NODE_ENV     | 否   | development           | 运行环境     |
