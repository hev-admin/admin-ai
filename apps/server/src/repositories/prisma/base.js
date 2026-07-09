import { prisma } from '../../db/prisma.js'

const DEFAULT_ORDER = [{ field: 'createdAt', order: 'desc' }]

/**
 * Prisma 版统一操作集工厂（契约见 repositories/index.js）。
 *
 * @param {string} modelName prisma client 上的模型属性名（user / role / menu）
 * @param {object} [options]
 * @param {string[]} [options.fuzzyFields] 按包含匹配的字符串字段
 * @param {Record<string, string>} [options.relations] 关联 id 字段 → prisma 关联名（如 { roleIds: 'roles' }），
 *   读取时映射为 id 数组、写入时整体重设关联、where 中标量值按「关联包含该 id」匹配
 */
export function createPrismaRepo(modelName, { fuzzyFields = [], relations = {} } = {}) {
  const model = prisma[modelName]
  const relationEntries = Object.entries(relations)

  const include = relationEntries.length
    ? Object.fromEntries(relationEntries.map(([, relation]) => [relation, { select: { id: true } }]))
    : undefined

  /** prisma 行 → 契约约定的普通对象（关联映射为 id 数组） */
  function toPlain(row) {
    if (!row)
      return null
    const entity = { ...row }
    for (const [idsField, relation] of relationEntries) {
      entity[idsField] = (row[relation] ?? []).map(item => item.id)
      delete entity[relation]
    }
    return entity
  }

  /** 平铺 where → prisma where（值形态解释规则见契约） */
  function buildWhere(where = {}) {
    const conditions = {}
    for (const [field, value] of Object.entries(where)) {
      if (value === undefined || value === null || value === '')
        continue
      if (relations[field])
        conditions[relations[field]] = { some: { id: value } }
      else if (Array.isArray(value))
        conditions[field] = { in: value }
      else if (fuzzyFields.includes(field) && typeof value === 'string')
        conditions[field] = { contains: value }
      else
        conditions[field] = value
    }
    return conditions
  }

  function buildOrderBy(orderBy) {
    const orders = Array.isArray(orderBy) ? orderBy : (orderBy ? [orderBy] : DEFAULT_ORDER)
    return orders.map(({ field, order = 'asc' }) => ({ [field]: order }))
  }

  /** data 中的关联 id 数组 → prisma 关联写法（create 用 connect、update 用 set 整体重设） */
  function buildData(data, mode) {
    const payload = { ...data }
    for (const [idsField, relation] of relationEntries) {
      const ids = payload[idsField]
      delete payload[idsField]
      if (ids !== undefined)
        payload[relation] = { [mode === 'create' ? 'connect' : 'set']: ids.map(id => ({ id })) }
    }
    return payload
  }

  return {
    async findPage({ page = 1, pageSize = 10, where = {}, orderBy } = {}) {
      const filter = buildWhere(where)
      const [rows, total] = await Promise.all([
        model.findMany({
          where: filter,
          orderBy: buildOrderBy(orderBy),
          skip: (page - 1) * pageSize,
          take: pageSize,
          include,
        }),
        model.count({ where: filter }),
      ])
      return { list: rows.map(toPlain), total }
    },

    async findMany(where = {}, orderBy) {
      const rows = await model.findMany({ where: buildWhere(where), orderBy: buildOrderBy(orderBy), include })
      return rows.map(toPlain)
    },

    async getById(id) {
      return toPlain(await model.findUnique({ where: { id }, include }))
    },

    async findByUnique(field, value) {
      return toPlain(await model.findUnique({ where: { [field]: value }, include }))
    },

    async create(data) {
      return toPlain(await model.create({ data: buildData(data, 'create'), include }))
    },

    async update(id, data) {
      try {
        return toPlain(await model.update({ where: { id }, data: buildData(data, 'update'), include }))
      }
      catch (err) {
        if (err?.code === 'P2025')
          return null
        throw err
      }
    },

    async remove(id) {
      try {
        await model.delete({ where: { id } })
        return true
      }
      catch (err) {
        if (err?.code === 'P2025')
          return false
        throw err
      }
    },

    async count(where = {}) {
      return model.count({ where: buildWhere(where) })
    },
  }
}
