# 后端指南

面向 server 端二次开发：模块结构、新增接口、种子数据、数据库切换，以及需要知道的行为口径。

## 模块结构

一次请求的路径：`中间件链 → routes（zod 校验）→ services（业务逻辑）→ repositories（数据访问）`。

```
apps/server/src/
├── routes/         # 按资源拆分的路由：路径、权限码注解、zod schema 就近声明
├── middlewares/    # authGuard（JWT）、requirePermission（权限码）、errorHandler、
│                   # requestLogger（结构化日志 + 请求 id）、loginRateLimit（登录限流）
├── services/       # 跨实体业务逻辑：聚合装配、唯一性 / 占用 / 环校验、级联删除
├── repositories/   # 统一操作集：index.js 工厂 + prisma/ + mongo/ 两套实现
├── db/             # prisma client 装配（driver adapter）、DATABASE_URL 解析
├── utils/          # ok/fail 响应、AppError、JWT 签发校验、validate 封装、buildTree、logger
├── app.js          # 组装：requestLogger → CORS → onError → authGuard → 业务路由
└── index.js        # 入口：加载 .env、校验 JWT_SECRET、启动 @hono/node-server
```

分层约定：

- **routes** 只做「参数校验 + 权限注解 + 调 service + 包装响应」，不写业务逻辑；
- **services** 承担跨实体逻辑与完整性校验（「先校验后执行」，不依赖数据库事务与级联）；关联读取也在这层内存拼装（repository 不暴露 join）；
- **repositories** 是唯一接触数据库的层；`services` 不允许 import prisma client 或 mongodb 驱动。

## 统一响应与错误

- 成功：`ok(c, data, message)` → `{ code: 0, data, message }`；
- 业务失败：在 service / route 中 `throw new AppError(status, message)`，统一错误中间件转为 `{ code, data, message }` 且 HTTP 状态码保持语义（400 业务校验、401 未登录、403 无权限、404 不存在）；
- 参数失败：zod 校验不过统一返回 422，`data.issues` 携带字段级错误明细；
- 未捕获异常：日志输出后返回 500，不泄漏堆栈。

::: tip 接口 message 与国际化（扩展方向）
server 返回的 `message` 目前为中文硬编码，前端透传展示。这是有意的范围裁剪：如需接口层多语言，可在错误码上扩展（`AppError` 已支持自定义 `code`），由前端按 code 映射 i18n 文案，或 server 按 `Accept-Language` 返回对应语言——两条路线接口契约均不变。
:::

## 新增接口

以「新增 demo 资源的列表 + 创建接口」为例：

### 1. 路由与校验

```js
// src/routes/demos.js
import { Hono } from 'hono'
import { z } from 'zod'
import { requirePermission } from '../middlewares/permission.js'
import { createDemo, listDemos } from '../services/demos.js'
import { ok } from '../utils/response.js'
import { validate } from '../utils/validate.js'

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  name: z.string().optional(),
})

const createDemoSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(64),
})

export const demosRoutes = new Hono()

demosRoutes.get('/', requirePermission('demo:list'), validate('query', listQuerySchema), async (c) => {
  return ok(c, await listDemos(c.req.valid('query')))
})

demosRoutes.post('/', requirePermission('demo:add'), validate('json', createDemoSchema), async (c) => {
  return ok(c, await createDemo(c.req.valid('json')), '创建成功')
})
```

要点：权限中间件放在参数校验**之前**；查询参数用 `z.coerce` 做类型转换；可空字符串字段用 `z.preprocess(emptyToNull, ...)` 归一（表单按「完整提交」语义，空值即清空）。

### 2. 注册路由

`src/routes/index.js` 中挂载：

```js
app.route('/api/demos', demosRoutes)
```

`/api/*` 默认在 JWT 鉴权之内；如需免登录访问，把路径加进 `middlewares/auth.js` 的 `WHITELIST`（当前仅 `/api/health` 与 `/api/auth/login`）。

### 3. 服务层与数据层

service 消费 repository 统一操作集；新实体需要在两套实现各登记一个仓储（见下节）。权限码 `demo:list` / `demo:add` 要作为「按钮」节点登记进菜单树并分配给角色（见[前端指南](./frontend.md#新增页面与菜单)），否则除 super 外无人能通过校验。

::: warning 权限变更的生效时机
`requirePermission` 从 JWT 载荷比对权限码、不查库——改角色权限后需**重新登录**取得新 token 才对 server 生效（super 短路放行不受影响）。如需即时生效，把中间件改为按用户 id 实时查库，接口契约不变。
:::

## repository 统一操作集

业务代码只依赖 `repositories/index.js` 导出的仓储对象，按 `DB_DRIVER` 惰性装配实现（未启用的驱动模块图完全不加载）。

### 方法契约（两套实现完全一致）

| 方法                                           | 返回              | 说明                                   |
| ---------------------------------------------- | ----------------- | -------------------------------------- |
| `findPage({ page, pageSize, where, orderBy })` | `{ list, total }` | 分页 + 条件 + 排序                     |
| `findMany(where, orderBy)`                     | `list`            | 全量查询（树形数据、按 id 集合取实体） |
| `getById(id)` / `findByUnique(field, value)`   | 实体或 `null`     | field 须为唯一键                       |
| `create(data)` / `update(id, data)`            | 写入后的完整实体  | update 目标不存在返回 `null`           |
| `remove(id)`                                   | `boolean`         | 目标不存在返回 `false`                 |
| `count(where)`                                 | 数字              | —                                      |

`where` 为「字段 → 值」的平铺对象，不暴露 SQL / Mongo 算子，按值形态解释：`undefined / null / ''` 忽略（搜索表单空值直传）；数组 → in 匹配；声明于 `fuzzyFields` 的字符串字段 → 包含匹配；关联 id 字段标量值 → 「关联包含该 id」；其余等值。`orderBy` 为 `{ field, order }` 或其数组，缺省 `createdAt desc`。

跨实现一致性：主键统一字符串 `id`（关系库 cuid；Mongo 侧 ObjectId ↔ 字符串在仓储内互转，非法 id 一律按「不存在」处理不抛 500）；`createdAt / updatedAt` 由数据层维护；返回普通对象；多对多关联以 id 数组暴露（`User.roleIds` / `Role.menuIds`），create / update 直接携带 id 数组即可整体重设关联。

### 新增实体的登记步骤

1. `prisma/schema.prisma` 加模型（不使用 `@db.*` 原生类型注解，保证跨库可移植）→ `pnpm --filter @admin-ai/server db:migrate` 生成迁移；
2. `repositories/prisma/index.js` 用操作集工厂登记（声明 `fuzzyFields`、多对多 `relations`）；
3. `repositories/mongo/index.js` 同步登记（声明一致的 `fuzzyFields`；有引用关系时配置 `removeCleanups`，删除实体时从引用方数组 `$pull`，对齐 Prisma 隐式多对多的自动清理）；
4. `seed/data.js` 按需补种子（**Mongo 文档缺键会在 JSON 序列化时丢字段**，可空 / 默认值字段要在 seed 时补齐，保证两库返回形态一致）。

## 种子数据与重置

种子单一定义在 `seed/data.js`（账号、角色、含按钮权限码的菜单树、Dashboard 假数据），两套驱动消费同一份定义：

| 命令                                           | 作用                                                     |
| ---------------------------------------------- | -------------------------------------------------------- |
| `pnpm --filter @admin-ai/server db:migrate`    | 关系库：应用迁移（新建库时自动播种）                     |
| `pnpm --filter @admin-ai/server db:seed`       | 关系库：手动播种（幂等，清空后重播）                     |
| `pnpm --filter @admin-ai/server db:reset`      | 关系库：删库重建 + 重新播种                              |
| `pnpm --filter @admin-ai/server db:seed:mongo` | Mongo：建集合、唯一索引（username / code）并播种（幂等） |

Prisma 7 的种子命令声明在 `prisma.config.js` 的 `migrations.seed`（v7 起不再读取 package.json 的 `prisma.seed` 字段，也不自动加载 `.env`——配置文件顶部显式 `import 'dotenv/config'`）。

## 数据库切换

### 关系库之间：SQLite → PostgreSQL / MySQL

Prisma 的 `provider` 不支持环境变量动态化、迁移 SQL 绑定方言不可跨库复用，因此这是**文档化流程**而非配置开关：

1. **改 provider**：`prisma/schema.prisma` 的 `datasource db.provider` 改为 `postgresql` / `mysql`；
2. **换 driver adapter**：安装并在 `src/db/prisma.js` 替换（Prisma 7 起所有数据库都必须显式提供 adapter）——PostgreSQL 用 `@prisma/adapter-pg`，MySQL / MariaDB 用 `@prisma/adapter-mariadb`；SQLite 专用的 `resolveDatabaseUrl` 文件路径解析逻辑一并移除；
3. **更新连接串**：`.env` 的 `DATABASE_URL` 改为目标库连接串；
4. **重建迁移历史**：删除 `prisma/migrations/` 目录（含 `migration_lock.toml`，它锁定 provider）后执行 `pnpm --filter @admin-ai/server db:migrate` 生成首个目标方言迁移——已提交的迁移 SQL 绑定旧方言，**不可跨库复用**；团队协作时新迁移历史需随切换一次性提交，其他成员拉取后 `db:reset` 重建本地库；
5. **回归**：`db:seed` 播种后跑通三账号登录与系统管理 CRUD。

schema 层面可移植性由「不使用 `@db.*` 原生类型注解」约定保证，模型定义无需改动。

### 启用 MongoDB：`DB_DRIVER=mongo`

MongoDB 不经 ORM（Prisma 7 暂不支持），由官方 `mongodb` 驱动实现同一套 repository 契约：

1. 确保 MongoDB 运行，`.env` 配置 `MONGODB_URL` / `MONGODB_DB`；
2. `pnpm --filter @admin-ai/server db:seed:mongo` 播种（Mongo 无迁移概念，集合与唯一索引由种子脚本幂等维护）；
3. `.env` 改 `DB_DRIVER=mongo`，重启 server——routes / services 零改动，前端无感。

实现口径：多对多关联存**字符串 id 数组**（`roleIds` / `menuIds`）；唯一性以 service 层「先查后写」为主、唯一索引兜底；删除实体时仓储内 `$pull` 清理引用方数组（对齐关系库隐式多对多的自动清理）；排序在末尾追加 `_id` 升序 tiebreaker 保证分页稳定。

### 跨库行为差异（已对齐的口径）

模糊搜索（`fuzzyFields` 的包含匹配）在两类库上的大小写行为：

- **SQLite**：`LIKE` 对 **ASCII 字母**默认不区分大小写（Prisma + SQLite 的 `contains` 不支持 `mode: 'insensitive'`，接受默认行为）；
- **MongoDB**：仓储实现用 `$regex` + `i` 标志（用户输入已转义正则元字符），不区分大小写且**扩展到 Unicode**。

即：ASCII 场景两库行为一致；非 ASCII 字符（如带变音符的字母）仅 Mongo 侧大小写不敏感。切换到 PostgreSQL / MySQL 时留意各自的 collation 行为。

## 认证行为口径

- **JWT 载荷**：`sub`（用户 id）、`username`、`roles`（角色 code 数组）、`permissions`（权限码数组）、`iat` / `exp`；有效期 `JWT_EXPIRES_IN`（支持 `s / m / h / d` 单位）；
- **登出是无状态占位**：`POST /api/auth/logout` 不维护黑名单，真正失效依赖前端清除 token 与自然过期；
- **修改密码后旧 token 仍有效**：server 无状态、不吊销已签发 JWT——旧 token 至自然过期前仍可通过鉴权（与权限变更需重登同一口径）。前端在改密成功后强制登出重登；若业务要求改密即全端失效，需自行引入 token 版本号或黑名单机制；
- **禁用用户**：登录时校验 `status`，已禁用返回 403；已在登录期的用户同样受「旧 token 有效」口径影响，直到 token 过期。

## 结构化日志

`hono/logger` 已替换为自研零依赖实现（M6 #37）：`utils/logger.js`（JSON 行输出 + `LOG_LEVEL` 级别过滤）+ `middlewares/logger.js`（请求日志）。

- **每请求一行 JSON**：`{ level, time, msg: 'request', requestId, method, path, status, durationMs }`，`status ≥ 500` 记为 error 级并走 stderr；
- **请求 id**：上游带 `x-request-id`（网关/反代注入）则透传，否则生成 UUID；响应头回写同名字段，业务内经 `c.get('requestId')` 取用；未捕获异常的 500 日志携带同一 requestId 与堆栈，便于对账；
- **级别**：`LOG_LEVEL=debug|info|warn|error`（默认 `info`）；
- **业务内打日志**：`import { logger } from '../utils/logger.js'`，`logger.info({ msg: '...', ...fields })`——需要采集生态（多 transport、脱敏、采样）时平替 pino，改动收敛在 `utils/logger.js`。

## 登录限流

`POST /api/auth/login` 挂载内存滑动窗口限流（M6 #38，`middlewares/rate-limit.js`）：

- **分桶**：`客户端 IP | 用户名`（反代场景取 `x-forwarded-for` 首段）；**只计失败**（401 密码错误 / 403 账号禁用），成功登录即清零该桶；422 参数校验失败不计也不清零；
- **阈值**：窗口内失败达 `LOGIN_RATE_MAX`（默认 5）后一律 429（含密码正确的尝试），直至窗口（`LOGIN_RATE_WINDOW`，默认 `15m`）滑出；
- **单实例语义**：计数在进程内存中，与模板的 SQLite 单实例部署形态对齐；多实例部署时需将存储外置（Redis 等），替换 `rate-limit.js` 内部实现即可、接口不变。

## 测试

测试基于 Node 内置 `node:test`（零依赖、直跑源码，M6 #36），`pnpm test`（根目录，含 web 侧语言包测试）或 `pnpm --filter @admin-ai/server test` 运行：

| 套件                                                 | 覆盖                                            | 说明                                                                                                       |
| ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `tests/repo-contract.prisma.test.js`                 | repository 契约 × Prisma 实现                   | 必跑；测试库为独立 SQLite 文件，用已提交的 migration.sql 离线建表                                          |
| `tests/repo-contract.mongo.test.js`                  | repository 契约 × Mongo 实现                    | `RUN_MONGO_TESTS=1` + 本机 MongoDB 时运行（连 `*_test` 库），否则整套 skip；CI 内经 mongo 服务容器全量运行 |
| `tests/rbac.test.js`                                 | 三账号 × 接口权限矩阵、错误结构、防护与认证口径 | 经 `app.request()` 驱动真实中间件链，无需起服务                                                            |
| `tests/rate-limit.test.js` / `tests/logging.test.js` | 登录限流 429 行为、请求 id 与日志结构           | —                                                                                                          |

约定：测试文件先设 env（`DATABASE_URL` 指向 `data/test-*.db` 等）再**动态 import** 被测模块（模块级单例在加载时绑定连接，且 lint 会重排静态 import，顺序不可依赖）；`node --test` 每文件独立子进程，天然隔离单例状态。**新增实体时**：在两套仓储登记后，向契约套件（`tests/helpers/repo-contract-suite.js`）补该实体的关键行为用例，双实现即同时被回归。
