import process from 'node:process'
import bcrypt from 'bcryptjs'
import { MongoClient } from 'mongodb'
import { mongoConfig } from '../src/repositories/mongo/db.js'
import { flattenMenus, menuTree, roleSeeds, SEED_PASSWORD, userSeeds } from './data.js'
import 'dotenv/config'

// Mongo 种子脚本（REQUIREMENTS §6 / #25）：无迁移概念，集合、唯一索引与数据统一在此维护；
// 与 prisma/seed.js 消费同一份 seed/data.js 定义。执行：pnpm --filter @admin-ai/server db:seed:mongo

/**
 * 补齐 Prisma schema 的默认值与可空字段（schema.prisma 为字段语义单一数据源）：
 * Mongo 文档缺键在 JSON 序列化时直接丢字段，两套驱动的返回形态会分叉，入库时统一补齐。
 */
function normalizeMenu(menu) {
  return {
    parentId: null,
    path: null,
    component: null,
    icon: null,
    permission: null,
    sort: 0,
    hidden: false,
    keepAlive: false,
    ...menu,
  }
}

const { url, dbName } = mongoConfig()
const client = new MongoClient(url)

async function main() {
  const db = client.db(dbName)
  const users = db.collection('users')
  const roles = db.collection('roles')
  const menus = db.collection('menus')

  // 幂等：清空旧数据后重新播种（引用 id 数组随实体重建，无需单独清理）
  await users.deleteMany({})
  await roles.deleteMany({})
  await menus.deleteMany({})

  // 唯一索引（createIndex 幂等，重复执行安全）；唯一冲突以 service 先查后写为主，索引兜底
  await users.createIndex({ username: 1 }, { unique: true })
  await roles.createIndex({ code: 1 }, { unique: true })

  // 1. 菜单树：平铺后先父后子入库，记录 key → id 映射（parentId 存字符串 id，§4.4）
  const menuIdByKey = new Map()
  const menuSeeds = flattenMenus(menuTree)
  for (const menu of menuSeeds) {
    const { key, parentKey, ...data } = menu
    const now = new Date()
    const { insertedId } = await menus.insertOne({
      ...normalizeMenu(data),
      parentId: parentKey ? menuIdByKey.get(parentKey) : null,
      createdAt: now,
      updatedAt: now,
    })
    menuIdByKey.set(key, insertedId.toString())
  }

  // 2. 角色：menuKeys → 菜单 id 字符串数组（多对多以引用 id 数组表达，§4.4）
  const roleIdByCode = new Map()
  for (const role of roleSeeds) {
    const { menuKeys, ...data } = role
    const now = new Date()
    const { insertedId } = await roles.insertOne({
      ...data,
      remark: data.remark ?? null,
      menuIds: menuKeys.map(key => menuIdByKey.get(key)),
      createdAt: now,
      updatedAt: now,
    })
    roleIdByCode.set(role.code, insertedId.toString())
  }

  // 3. 用户：哈希密码并关联角色
  const passwordHash = bcrypt.hashSync(SEED_PASSWORD, 10)
  for (const user of userSeeds) {
    const { roleCodes, ...data } = user
    const now = new Date()
    await users.insertOne({
      ...data,
      password: passwordHash,
      roleIds: roleCodes.map(code => roleIdByCode.get(code)),
      createdAt: now,
      updatedAt: now,
    })
  }

  console.log(`[seed:mongo] 播种完成（${dbName}）：菜单 ${menuSeeds.length} 条、角色 ${roleSeeds.length} 个、用户 ${userSeeds.length} 个（密码统一为 ${SEED_PASSWORD}）`)
}

main()
  .catch((err) => {
    console.error('[seed:mongo] 播种失败：', err)
    process.exitCode = 1
  })
  .finally(() => client.close())
