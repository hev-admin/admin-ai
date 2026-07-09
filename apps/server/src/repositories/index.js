import process from 'node:process'
import 'dotenv/config'

/**
 * repository 统一操作集（REQUIREMENTS §6）：业务代码只依赖本模块导出的
 * userRepo / roleRepo / menuRepo，不感知底层实现（prisma | mongo，经 DB_DRIVER 启动时装配）。
 *
 * ## 方法签名约定（两套实现完全一致）
 *
 * - `findPage({ page = 1, pageSize = 10, where = {}, orderBy })` → `{ list, total }`
 * - `findMany(where = {}, orderBy)` → `list`（全量查询：树形数据、按 id 集合取实体等 service 内部装配用）
 * - `getById(id)` / `findByUnique(field, value)` → 实体对象或 `null`（field 须为唯一键）
 * - `create(data)` / `update(id, data)` → 写入后的完整实体；update 目标不存在返回 `null`
 * - `remove(id)` → `boolean`（目标不存在返回 false）
 * - `count(where = {})` → 数字
 *
 * ## where 平铺条件约定
 *
 * `where` 为「字段 → 值」的平铺对象，不暴露 SQL / Mongo 特有算子，按值形态解释：
 *
 * - `undefined / null / ''` → 忽略该条件（搜索表单空值直传）
 * - 数组 → in 匹配（如 `{ id: [...ids] }`）
 * - 声明于 `fuzzyFields` 的字段且值为字符串 → 包含匹配（SQLite 下对 ASCII 不区分大小写，跨库差异见文档）
 * - 声明于 `relations` 的关联 id 字段（如 userRepo 的 `roleIds`）且值为标量 → 「关联包含该 id」匹配
 * - 其余 → 等值匹配
 *
 * `orderBy` 为 `{ field, order: 'asc' | 'desc' }` 或其数组，缺省 `createdAt desc`。
 *
 * ## 跨实现一致性约定
 *
 * - 主键统一字符串 `id`（关系库 cuid；Mongo 侧 ObjectId ↔ 字符串在 repository 内互转）；
 * - `createdAt` / `updatedAt` 由数据层统一维护；
 * - 返回普通对象；多对多关联以 id 数组暴露（User.roleIds / Role.menuIds），
 *   create / update 的 data 直接携带 id 数组即可整体重设关联；
 * - 关联读取（用户的角色明细等）不进 repository，由 service 层多次调用 + 内存拼装（§4.5）；
 * - 不承诺跨实体事务：完整性逻辑在 service 层按「先校验后执行」保证。
 */

const DRIVERS = {
  prisma: () => import('./prisma/index.js'),
  mongo: () => import('./mongo/index.js'), // M4 #26 落地，提前启用会在首次数据访问时抛「模块不存在」
}

const REPO_METHODS = ['findPage', 'findMany', 'getById', 'findByUnique', 'create', 'update', 'remove', 'count']

const driver = process.env.DB_DRIVER || 'prisma'
if (!DRIVERS[driver])
  throw new Error(`[repositories] 未知 DB_DRIVER：${driver}（可选 prisma | mongo）`)

// 惰性装配：首次数据访问时才加载所选实现的模块图（未启用的驱动完全不加载），
// 同时规避入口处顶层 await
let implPromise = null
function loadImpl() {
  implPromise ??= DRIVERS[driver]()
  return implPromise
}

function delegateRepo(repoName) {
  return Object.fromEntries(REPO_METHODS.map(method => [
    method,
    async (...args) => {
      const impl = await loadImpl()
      return impl[repoName][method](...args)
    },
  ]))
}

export const userRepo = delegateRepo('userRepo')
export const roleRepo = delegateRepo('roleRepo')
export const menuRepo = delegateRepo('menuRepo')
