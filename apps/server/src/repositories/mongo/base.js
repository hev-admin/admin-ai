import { ObjectId } from 'mongodb'
import { getDb } from './db.js'

const DEFAULT_ORDER = [{ field: 'createdAt', order: 'desc' }]

/** 非法 id（无法转 ObjectId 的任意字符串）返回 null，调用方按「不存在」处理（M4 决策点 2） */
function toObjectId(value) {
  return ObjectId.isValid(value) ? new ObjectId(value) : null
}

/** 模糊匹配的用户输入转义正则元字符，防止注入无效表达式 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Mongo 版统一操作集工厂（契约见 repositories/index.js，官方 mongodb 驱动直连）。
 *
 * 与 Prisma 实现的对应关系：主键 `_id` ↔ 契约的字符串 `id` 在本层互转；多对多关联
 * 以 id 字符串数组直接存储（User.roleIds / Role.menuIds，§4.4）——数组字段的标量
 * 等值匹配天然是「包含」语义，无需关联声明即满足契约的关联 where 约定。
 *
 * @param {string} collectionName 集合名（users / roles / menus）
 * @param {object} [options]
 * @param {string[]} [options.fuzzyFields] 按包含匹配的字符串字段（声明与 prisma 实现一致，契约的一部分）
 * @param {Array<{ collection: string, field: string }>} [options.removeCleanups] 实体删除后
 *   从引用方集合的 id 数组中拔除该 id——对齐 Prisma 隐式多对多的自动清理（M2 决策点 4 / M4 决策点 3）
 */
export function createMongoRepo(collectionName, { fuzzyFields = [], removeCleanups = [] } = {}) {
  async function collection(name = collectionName) {
    return (await getDb()).collection(name)
  }

  /** mongo 文档 → 契约约定的普通对象（_id → 字符串 id） */
  function toPlain(doc) {
    if (!doc)
      return null
    const { _id, ...rest } = doc
    return { id: _id.toString(), ...rest }
  }

  /** 平铺 where → mongo 查询（值形态解释规则见契约）；非法 id 转为恒不匹配条件 */
  function buildWhere(where = {}) {
    const conditions = {}
    for (const [field, value] of Object.entries(where)) {
      if (value === undefined || value === null || value === '')
        continue
      if (field === 'id')
        conditions._id = Array.isArray(value) ? { $in: value.map(toObjectId).filter(Boolean) } : (toObjectId(value) ?? { $in: [] })
      else if (Array.isArray(value))
        conditions[field] = { $in: value }
      else if (fuzzyFields.includes(field) && typeof value === 'string')
        conditions[field] = { $regex: escapeRegExp(value), $options: 'i' }
      else
        conditions[field] = value
    }
    return conditions
  }

  /** orderBy → sort；末尾追加 _id 升序 tiebreaker：createdAt 同毫秒时保证分页与兄弟顺序稳定（M4 决策点 5） */
  function buildSort(orderBy) {
    const orders = Array.isArray(orderBy) ? orderBy : (orderBy ? [orderBy] : DEFAULT_ORDER)
    const sort = Object.fromEntries(orders.map(({ field, order = 'asc' }) => [field === 'id' ? '_id' : field, order === 'desc' ? -1 : 1]))
    sort._id ??= 1
    return sort
  }

  /** 写入数据整形：剔除 undefined（Prisma 的「不改动」语义，M4 决策点 7）与主键字段 */
  function toDbData(data) {
    const payload = {}
    for (const [field, value] of Object.entries(data)) {
      if (value === undefined || field === 'id' || field === '_id')
        continue
      payload[field] = value
    }
    return payload
  }

  return {
    async findPage({ page = 1, pageSize = 10, where = {}, orderBy } = {}) {
      const col = await collection()
      const filter = buildWhere(where)
      const [docs, total] = await Promise.all([
        col.find(filter).sort(buildSort(orderBy)).skip((page - 1) * pageSize).limit(pageSize).toArray(),
        col.countDocuments(filter),
      ])
      return { list: docs.map(toPlain), total }
    },

    async findMany(where = {}, orderBy) {
      const col = await collection()
      const docs = await col.find(buildWhere(where)).sort(buildSort(orderBy)).toArray()
      return docs.map(toPlain)
    },

    async getById(id) {
      const _id = toObjectId(id)
      if (!_id)
        return null
      return toPlain(await (await collection()).findOne({ _id }))
    },

    async findByUnique(field, value) {
      if (field === 'id')
        return this.getById(value)
      return toPlain(await (await collection()).findOne({ [field]: value }))
    },

    async create(data) {
      const now = new Date()
      const doc = { ...toDbData(data), createdAt: now, updatedAt: now }
      const { insertedId } = await (await collection()).insertOne(doc)
      return toPlain({ ...doc, _id: insertedId })
    },

    async update(id, data) {
      const _id = toObjectId(id)
      if (!_id)
        return null
      const updated = await (await collection()).findOneAndUpdate(
        { _id },
        { $set: { ...toDbData(data), updatedAt: new Date() } },
        { returnDocument: 'after' },
      )
      return toPlain(updated)
    },

    async remove(id) {
      const _id = toObjectId(id)
      if (!_id)
        return false
      const { deletedCount } = await (await collection()).deleteOne({ _id })
      if (!deletedCount)
        return false
      // 引用清理不 bump 引用方 updatedAt（Prisma 清 join 行同样不触发）
      for (const { collection: refName, field } of removeCleanups)
        await (await collection(refName)).updateMany({ [field]: id }, { $pull: { [field]: id } })
      return true
    },

    async count(where = {}) {
      return (await collection()).countDocuments(buildWhere(where))
    },
  }
}
