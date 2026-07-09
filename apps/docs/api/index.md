# API 参考

全部接口按模块列出：路径、方法、权限要求、参数与响应示例。参数约束与路由内的 zod schema 一一对应。

## 通用约定

### 基础路径与鉴权

- 路由统一前缀 `/api`；开发期 web 的 Vite dev server 将 `/api` 代理到 `http://localhost:3000`；
- 除**免登录白名单**（`GET /api/health`、`POST /api/auth/login`）外，均需携带 `Authorization: Bearer <token>`；
- 标注了**权限码**的接口还会比对 JWT 载荷中的 `permissions`（角色含 `super` 时短路放行）。

### 统一响应结构

```json
{ "code": 0, "data": {}, "message": "ok" }
```

`code === 0` 表示成功；失败时 `code` 缺省与 HTTP 状态码一致，HTTP 状态码保持语义：

| 状态 | 场景                  | 响应形态                                                         |
| ---- | --------------------- | ---------------------------------------------------------------- |
| 400  | 业务校验失败          | `{ "code": 400, "data": null, "message": "用户名已存在" }`       |
| 401  | 未登录 / token 失效   | `{ "code": 401, "data": null, "message": "未登录或登录已过期" }` |
| 403  | 无权限码 / 账号被禁用 | `{ "code": 403, "data": null, "message": "没有操作权限" }`       |
| 404  | 资源或接口不存在      | `{ "code": 404, "data": null, "message": "用户不存在" }`         |
| 422  | 参数校验失败（zod）   | 见下方                                                           |
| 500  | 未捕获异常            | `{ "code": 500, "data": null, "message": "服务器内部错误" }`     |

422 携带字段级明细：

```json
{
  "code": 422,
  "data": { "issues": [{ "field": "password", "message": "密码至少 6 位" }] },
  "message": "密码至少 6 位"
}
```

### 分页约定

请求 `page`（≥ 1，默认 1）/ `pageSize`（1-100，默认 10），响应 `data: { list, total }`。列表缺省按 `createdAt` 倒序。

> 以下「响应示例」除特别说明外，仅展示 `data` 字段内容。

## 健康检查

### GET /api/health

免登录。连通性与当前数据驱动检查。

```json
{ "status": "up", "driver": "prisma", "time": "2026-07-12T08:00:00.000Z" }
```

## 认证（auth）

### POST /api/auth/login

免登录。账号密码登录，签发 JWT（载荷含 `sub` / `username` / `roles` / `permissions`，有效期 `JWT_EXPIRES_IN`）。

| 参数     | 类型   | 必填 | 说明   |
| -------- | ------ | ---- | ------ |
| username | string | 是   | 登录名 |
| password | string | 是   | 密码   |

```json
{ "token": "eyJhbGciOiJIUzI1NiJ9..." }
```

错误：401 用户名或密码错误；403 账号已被禁用；429 登录尝试过于频繁——同一「IP + 用户名」窗口内失败达阈值（缺省 15 分钟 5 次，只计失败、成功登录清零，详见[后端指南](../guide/backend.md#登录限流)）。

### POST /api/auth/logout

需登录。无状态占位接口（不维护黑名单，真正失效依赖前端清除 token 与自然过期），返回 `data: null`。

### GET /api/auth/user

需登录。聚合返回当前用户资料、角色、菜单树与按钮权限码——前端动态路由与按钮显隐的数据源。

```json
{
  "user": {
    "id": "cmd0yylwq0003uxhk2gm35kkj",
    "username": "admin",
    "nickname": "管理员",
    "email": null,
    "avatar": null,
    "status": 1,
    "createdAt": "2026-07-10T06:50:00.000Z",
    "updatedAt": "2026-07-10T06:50:00.000Z"
  },
  "roles": ["admin"],
  "menus": [
    {
      "id": "cmd0yylwq0001uxhk8m1a2b3c",
      "parentId": null,
      "type": 2,
      "name": "menu.dashboard",
      "path": "/dashboard",
      "component": "dashboard/index",
      "icon": "i-carbon-dashboard",
      "permission": null,
      "sort": 1,
      "hidden": false,
      "keepAlive": true,
      "children": []
    }
  ],
  "permissions": ["sys:user:list", "sys:user:add"]
}
```

说明：`menus` 为目录 / 菜单节点组成的树（`type` 1 目录 / 2 菜单，按钮节点不出现在这里，其权限码进入 `permissions`）；`hidden` 节点保留，由前端渲染时判断；角色含 `super` 时返回全量菜单与全部权限码。错误：401 用户不存在或已被删除。

### PUT /api/auth/profile

需登录。修改本人资料（仅昵称 / 邮箱 / 头像；头像为 URL 字符串，本期不做文件上传）。

| 参数     | 类型           | 必填 | 说明                         |
| -------- | -------------- | ---- | ---------------------------- |
| nickname | string         | 是   | 1-32 字符                    |
| email    | string \| null | 是   | 邮箱格式；传空字符串即清空   |
| avatar   | string \| null | 是   | ≤ 255 字符；传空字符串即清空 |

响应为更新后的资料对象（同 `GET /api/auth/user` 的 `user` 字段）。

### PUT /api/auth/password

需登录。修改本人密码；成功后旧 JWT 至自然过期前仍有效（无状态口径），前端应强制重新登录。

| 参数        | 类型   | 必填 | 说明    |
| ----------- | ------ | ---- | ------- |
| oldPassword | string | 是   | 旧密码  |
| password    | string | 是   | 6-64 位 |

返回 `data: null`。错误：400 旧密码不正确。

## 用户管理（users）

用户对象出站统一脱敏（不含 `password`）；除 `GET /api/auth/user` 外均含 `roleIds`。

### GET /api/users

权限码 `sys:user:list`。分页查询，`username` 模糊匹配。

| 参数     | 类型           | 必填 | 说明                      |
| -------- | -------------- | ---- | ------------------------- |
| page     | number         | 否   | 默认 1                    |
| pageSize | number         | 否   | 默认 10，最大 100         |
| username | string         | 否   | 模糊匹配                  |
| status   | `'0'` \| `'1'` | 否   | 状态过滤（0 禁用 1 启用） |

```json
{
  "list": [
    {
      "id": "cmd0yylwq0003uxhk2gm35kkj",
      "username": "admin",
      "nickname": "管理员",
      "email": null,
      "avatar": null,
      "status": 1,
      "roleIds": ["cmd0yylwq0002uxhk5r7n9pqr"],
      "roles": [{ "id": "cmd0yylwq0002uxhk5r7n9pqr", "name": "管理员", "code": "admin" }],
      "createdAt": "2026-07-10T06:50:00.000Z",
      "updatedAt": "2026-07-10T06:50:00.000Z"
    }
  ],
  "total": 3
}
```

### POST /api/users

权限码 `sys:user:add`。新增用户。

| 参数     | 类型           | 必填 | 说明                                       |
| -------- | -------------- | ---- | ------------------------------------------ |
| username | string         | 是   | 2-32 字符，仅字母 / 数字 / 下划线 / 连字符 |
| password | string         | 是   | 6-64 位（初始密码）                        |
| nickname | string         | 是   | 1-32 字符                                  |
| email    | string \| null | 是   | 邮箱格式，可传空                           |
| avatar   | string \| null | 是   | ≤ 255 字符，可传空                         |
| status   | 0 \| 1         | 否   | 默认 1（启用）                             |
| roleIds  | string[]       | 否   | 默认 `[]`                                  |

响应为创建后的用户对象。错误：400 用户名已存在 / 存在无效的角色。

### PUT /api/users/:id

权限码 `sys:user:edit`。编辑用户（不含用户名与密码；密码走重置接口）。字段同新增但均可选（`nickname` / `status` / `roleIds` 可省略，`email` / `avatar` 需显式传值或空）。错误：404 用户不存在；400 存在无效的角色。

### DELETE /api/users/:id

权限码 `sys:user:delete`。删除单个用户。错误：400 不能删除当前登录账号；404 用户不存在。

### DELETE /api/users

权限码 `sys:user:delete`。批量删除，body `{ "ids": ["...", "..."] }`（至少 1 项）；自动过滤当前登录账号，全部被过滤时报 400。

```json
{ "removed": 2 }
```

### PATCH /api/users/:id/status

权限码 `sys:user:status`。启用 / 禁用，body `{ "status": 0 }`（0 禁用 / 1 启用）。响应为更新后的用户对象。错误：400 不能禁用当前登录账号；404 用户不存在。禁用后该账号无法再登录（已签发 token 至自然过期前仍有效）。

### PUT /api/users/:id/password

权限码 `sys:user:resetPwd`。重置为指定新密码，body `{ "password": "newpass123" }`（6-64 位），返回 `data: null`。

### PUT /api/users/:id/roles

权限码 `sys:user:assignRole`。整体重设用户角色，body `{ "roleIds": ["..."] }`。响应为更新后的用户对象。错误：400 存在无效的角色。

## 角色管理（roles）

### GET /api/roles

权限码 `sys:role:list`。分页查询，`name` / `code` 模糊匹配（参数同分页约定）。

```json
{
  "list": [
    {
      "id": "cmd0yylwq0002uxhk5r7n9pqr",
      "name": "管理员",
      "code": "admin",
      "remark": "全部菜单，无删除类按钮权限",
      "menuIds": ["cmd0yylwq0001uxhk8m1a2b3c"],
      "createdAt": "2026-07-10T06:50:00.000Z",
      "updatedAt": "2026-07-10T06:50:00.000Z"
    }
  ],
  "total": 3
}
```

### POST /api/roles

权限码 `sys:role:add`。新增角色。

| 参数    | 类型           | 必填 | 说明                                                              |
| ------- | -------------- | ---- | ----------------------------------------------------------------- |
| name    | string         | 是   | 1-32 字符                                                         |
| code    | string         | 是   | 2-32 字符，字母开头，仅字母 / 数字 / 下划线 / 冒号 / 连字符，唯一 |
| remark  | string \| null | 是   | ≤ 255 字符，可传空                                                |
| menuIds | string[]       | 否   | 默认 `[]`（菜单 + 按钮节点 id 集合）                              |

错误：400 角色标识已存在 / 存在无效的菜单节点。

### PUT /api/roles/:id

权限码 `sys:role:edit`。编辑角色，字段同新增但除 `remark` 外均可选。错误：400 内置超级管理员角色的标识不可修改（`super` 是权限短路的语义锚点）/ 角色标识已存在 / 存在无效的菜单节点；404 角色不存在。

### DELETE /api/roles/:id

权限码 `sys:role:delete`。删除前校验用户占用。错误：400 「角色已被 N 个用户占用，无法删除」（`super` 角色天然被 super 账号占用而不可删）；404 角色不存在。

### PUT /api/roles/:id/menus

权限码 `sys:role:assignPerm`。分配权限：整体重设角色勾选的菜单 id 集合（含按钮节点），body `{ "menuIds": ["..."] }`。响应为更新后的角色对象。

## 菜单管理（menus）

### GET /api/menus

权限码 `sys:menu:list`。返回**含按钮节点**的完整菜单树（管理端与角色分配权限用；前端路由树走 `GET /api/auth/user`）。节点字段见下方新增接口的参数表，另含 `children` 数组，同级按 `sort` 升序。

### POST /api/menus

权限码 `sys:menu:add`。新增节点（目录 / 菜单 / 按钮三类同表）。

| 参数       | 类型           | 必填 | 说明                                               |
| ---------- | -------------- | ---- | -------------------------------------------------- |
| parentId   | string \| null | 是   | 父节点 id，根节点传空                              |
| type       | 1 \| 2 \| 3    | 是   | 1 目录 / 2 菜单 / 3 按钮                           |
| name       | string         | 是   | 1-64 字符，**i18n key**（如 `menu.system.users`）  |
| path       | string \| null | 条件 | 路由路径；**目录 / 菜单必填**，按钮传空            |
| component  | string \| null | 否   | 组件路径（相对 `src/views/`，省略 `.vue`），菜单用 |
| icon       | string \| null | 否   | UnoCSS 图标类名（需同步 web 端 safelist）          |
| permission | string \| null | 条件 | 权限码；**按钮类型必填**（如 `sys:user:add`）      |
| sort       | number         | 否   | 同级排序，升序，默认 0                             |
| hidden     | boolean        | 否   | 侧边栏隐藏，默认 false                             |
| keepAlive  | boolean        | 否   | keep-alive 缓存，默认 false                        |

错误：400 父节点不存在；422 目录 / 菜单必须填写路由路径 / 按钮类型必须填写权限码。

### PUT /api/menus/:id

权限码 `sys:menu:edit`。编辑节点，body 同新增（完整提交语义，空值即清空）。错误：400 父节点不能是自身 / 父节点不存在 / 父节点不能是自身的子节点（防环）；404 菜单不存在。

### DELETE /api/menus/:id

权限码 `sys:menu:delete`。**级联删除全部子孙节点**（目录 → 菜单 → 按钮），角色与菜单的关联随之清理。

```json
{ "removed": 8 }
```

## 工作台（dashboard）

### GET /api/dashboard/stats

需登录，**不挂权限码**（普通用户也可见工作台）。返回种子假数据 + 请求时组装的相对日期；文案类字段均为 i18n key，由前端翻译。

```json
{
  "cards": [
    { "key": "visits", "value": 128932, "trend": 12.4 },
    { "key": "conversion", "value": 3.26, "unit": "%", "trend": 0.6 }
  ],
  "trend": {
    "dates": ["06-13", "06-14", "07-12"],
    "series": {
      "visits": [820, 932, 1750],
      "orders": [320, 302, 640]
    }
  },
  "pie": [
    { "key": "search", "value": 435 },
    { "key": "direct", "value": 310 }
  ],
  "activities": [
    { "key": "release", "time": "2026-07-12T07:30:00.000Z" }
  ]
}
```

说明：`cards` 固定 4 项（`trend` 为同比涨跌百分比，正涨负跌；`unit: '%'` 按百分数展示）；`trend.dates` 为近 30 天（`MM-DD`，末位今天），两条 `series` 与之等长对齐；`activities` 的 `time` 为 ISO 时间戳。
