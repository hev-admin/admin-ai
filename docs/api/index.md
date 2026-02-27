# API 概览

## 基础信息

- **基础路径**: `/api/v1` (也支持 `/api` 兼容旧版)
- **认证方式**: Bearer Token (JWT)
- **响应格式**: JSON
- **数据验证**: Zod Schema（所有写入接口）

## 响应结构

所有接口返回统一的 JSON 格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 状态码说明

| 状态码 | 说明         |
| ------ | ------------ |
| 200    | 请求成功     |
| 400    | 请求参数错误 |
| 401    | 未授权       |
| 403    | 无操作权限   |
| 404    | 资源不存在   |
| 429    | 请求频率超限 |
| 500    | 服务器错误   |

## 认证

除登录、注册和健康检查外，其他接口都需要在请求头中携带 Token：

```
Authorization: Bearer <token>
```

## 速率限制

所有 API 接口受速率限制保护，限制信息通过响应头返回：

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000
```

## 权限控制

写入接口（POST/PUT/DELETE）受 RBAC 权限校验保护，需要对应的权限标识。

## 健康检查

```
GET /health
```

无需认证。返回服务状态：

```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

## 接口模块

| 模块     | 路径              | 说明                 |
| -------- | ----------------- | -------------------- |
| 认证     | `/api/auth/*`     | 登录、注册、个人信息 |
| 用户管理 | `/api/users/*`    | 用户 CRUD            |
| 角色管理 | `/api/roles/*`    | 角色 CRUD            |
| 菜单管理 | `/api/menus/*`    | 菜单 CRUD、权限      |
| 系统设置 | `/api/settings/*` | 系统配置             |
| 操作日志 | `/api/logs/*`     | 日志查询             |
| 文件上传 | `/api/upload/*`   | 头像上传             |
| 数据导出 | `/api/export/*`   | 用户、角色、菜单导出 |

---

## 认证接口

### 用户登录

```
POST /api/auth/login
```

**请求参数**

| 参数     | 类型   | 必填 | 说明            |
| -------- | ------ | ---- | --------------- |
| username | string | 是   | 用户名          |
| password | string | 是   | 密码（至少8位） |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "username": "admin",
      "email": "admin@example.com",
      "nickname": "管理员"
    }
  }
}
```

### 用户注册

```
POST /api/auth/register
```

**请求参数**

| 参数     | 类型   | 必填 | 说明              |
| -------- | ------ | ---- | ----------------- |
| username | string | 是   | 用户名（至少3位） |
| email    | string | 是   | 邮箱              |
| password | string | 是   | 密码（至少8位）   |
| nickname | string | 否   | 昵称              |

### 刷新 Token

```
POST /api/auth/refresh
```

**请求参数**

| 参数         | 类型   | 必填 | 说明          |
| ------------ | ------ | ---- | ------------- |
| refreshToken | string | 是   | Refresh Token |

**响应示例**

```json
{
  "code": 200,
  "data": {
    "token": "new-access-token...",
    "user": { "id": "1", "username": "admin" }
  }
}
```

### 获取个人信息

```
GET /api/auth/profile
```

**需要认证**: 是

### 更新个人信息

```
PUT /api/auth/profile
```

**需要认证**: 是

**请求参数**

| 参数     | 类型   | 必填 | 说明   |
| -------- | ------ | ---- | ------ |
| nickname | string | 否   | 昵称   |
| phone    | string | 否   | 手机号 |
| avatar   | string | 否   | 头像   |

### 修改密码

```
PUT /api/auth/password
```

**需要认证**: 是

**请求参数**

| 参数        | 类型   | 必填 | 说明   |
| ----------- | ------ | ---- | ------ |
| oldPassword | string | 是   | 原密码 |
| newPassword | string | 是   | 新密码 |

### 退出登录

```
POST /api/auth/logout
```

---

## 用户管理接口

### 获取用户列表

```
GET /api/users
```

**需要认证**: 是

**查询参数**

| 参数     | 类型   | 必填 | 说明              |
| -------- | ------ | ---- | ----------------- |
| page     | number | 否   | 页码，默认 1      |
| pageSize | number | 否   | 每页数量，默认 10 |
| keyword  | string | 否   | 搜索关键词        |

**响应示例**

```json
{
  "code": 200,
  "data": {
    "list": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100
    }
  }
}
```

### 获取用户详情

```
GET /api/users/:id
```

### 创建用户

```
POST /api/users
```

**请求参数**

| 参数     | 类型     | 必填 | 说明       |
| -------- | -------- | ---- | ---------- |
| username | string   | 是   | 用户名     |
| email    | string   | 是   | 邮箱       |
| password | string   | 是   | 密码       |
| nickname | string   | 否   | 昵称       |
| phone    | string   | 否   | 手机号     |
| status   | number   | 否   | 状态 0/1   |
| roleIds  | string[] | 否   | 角色ID数组 |

### 更新用户

```
PUT /api/users/:id
```

### 删除用户

```
DELETE /api/users/:id
```

### 批量删除用户

```
POST /api/users/batch-delete
```

**请求参数**

```json
{
  "ids": ["id1", "id2", "id3"]
}
```

---

## 角色管理接口

### 获取角色列表（分页）

```
GET /api/roles
```

**查询参数**

| 参数     | 类型   | 必填 | 说明              |
| -------- | ------ | ---- | ----------------- |
| page     | number | 否   | 页码，默认 1      |
| pageSize | number | 否   | 每页数量，默认 10 |

### 获取所有角色

```
GET /api/roles/all
```

### 获取角色详情

```
GET /api/roles/:id
```

### 创建角色

```
POST /api/roles
```

**请求参数**

| 参数        | 类型     | 必填 | 说明         |
| ----------- | -------- | ---- | ------------ |
| name        | string   | 是   | 角色名称     |
| code        | string   | 是   | 角色编码     |
| description | string   | 否   | 描述         |
| status      | number   | 否   | 状态 0/1     |
| sort        | number   | 否   | 排序         |
| menuIds     | string[] | 否   | 菜单权限数组 |

### 更新角色

```
PUT /api/roles/:id
```

### 删除角色

```
DELETE /api/roles/:id
```

### 批量删除角色

```
POST /api/roles/batch-delete
```

---

## 菜单管理接口

### 获取菜单树

```
GET /api/menus
```

### 获取菜单列表

```
GET /api/menus/list
```

### 获取用户菜单

```
GET /api/menus/user
```

根据当前用户权限返回可访问的菜单。

### 获取用户权限标识

```
GET /api/menus/permissions
```

返回当前用户的权限标识列表。

### 获取菜单详情

```
GET /api/menus/:id
```

### 创建菜单

```
POST /api/menus
```

**请求参数**

| 参数       | 类型    | 必填 | 说明                    |
| ---------- | ------- | ---- | ----------------------- |
| parentId   | string  | 否   | 父级菜单ID              |
| name       | string  | 是   | 路由名称                |
| path       | string  | 是   | 路由路径                |
| component  | string  | 否   | 组件路径                |
| redirect   | string  | 否   | 重定向路径              |
| icon       | string  | 否   | 图标                    |
| title      | string  | 是   | 菜单标题                |
| permission | string  | 否   | 权限标识                |
| type       | number  | 是   | 类型：1目录 2菜单 3按钮 |
| visible    | number  | 否   | 是否显示 0/1            |
| status     | number  | 否   | 状态 0/1                |
| sort       | number  | 否   | 排序                    |
| keepAlive  | boolean | 否   | 是否缓存                |
| external   | boolean | 否   | 是否外链                |

### 更新菜单

```
PUT /api/menus/:id
```

### 删除菜单

```
DELETE /api/menus/:id
```

### 批量删除菜单

```
POST /api/menus/batch-delete
```

---

## 系统设置接口

### 获取所有设置

```
GET /api/settings
```

### 按分组获取设置

```
GET /api/settings/group/:group
```

返回指定分组的设置项列表。

### 批量更新设置

```
PUT /api/settings
```

**需要权限**: `system:setting:update`

**请求参数**

```json
{
  "settings": [
    { "key": "site_name", "value": "Admin AI" },
    { "key": "site_logo", "value": "/logo.png" }
  ]
}
```

---

## 操作日志接口

### 获取日志列表

```
GET /api/logs
```

**查询参数**

| 参数      | 类型   | 必填 | 说明                                        |
| --------- | ------ | ---- | ------------------------------------------- |
| page      | number | 否   | 页码，默认 1                                |
| pageSize  | number | 否   | 每页数量，默认 20                           |
| module    | string | 否   | 模块筛选                                    |
| username  | string | 否   | 用户名筛选                                  |
| startDate | string | 否   | 开始日期 (ISO 格式)                         |
| endDate   | string | 否   | 结束日期 (ISO 格式)                         |
| sortField | string | 否   | 排序字段 (createdAt/duration/module/action) |
| sortOrder | string | 否   | 排序方向 (asc/desc，默认 desc)              |

### 获取日志统计

```
GET /api/logs/stats
```

**需要权限**: `system:log:view`

**响应示例**

```json
{
  "code": 200,
  "data": {
    "total": 1234,
    "todayCount": 56
  }
}
```

---

## 文件上传接口

### 上传头像

```
POST /api/upload/avatar
```

**需要认证**: 是

**请求格式**: `multipart/form-data`

**参数**

| 参数 | 类型 | 必填 | 说明                         |
| ---- | ---- | ---- | ---------------------------- |
| file | File | 是   | 图片文件（JPG/PNG/GIF/WEBP） |

**限制**

- 文件大小：最大 2MB
- 文件类型：image/jpeg, image/png, image/gif, image/webp

**响应示例**

```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "/uploads/avatar_1234567890_abc123.png"
  }
}
```

---

## 数据导出接口

### 导出用户数据

```
GET /api/export/users
```

### 导出角色数据

```
GET /api/export/roles
```

### 导出菜单数据

```
GET /api/export/menus
```
