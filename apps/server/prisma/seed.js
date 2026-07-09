import process from 'node:process'
import { pathToFileURL } from 'node:url'
import bcrypt from 'bcryptjs'
import { flattenMenus, menuTree, roleSeeds, SEED_PASSWORD, userSeeds } from '../seed/data.js'
import { prisma } from '../src/db/prisma.js'
import 'dotenv/config'

/**
 * 播种主体（幂等：清空旧数据后重播，隐式多对多关联随实体删除自动清理）。
 * 抽为可导入函数，供 CLI 脚本（本文件末尾）与集成测试进程内复用同一份逻辑，
 * 接受 prisma client 参数以便测试绑定独立测试库（REVIEW.md 2026-07-13 / M6 #36）。
 *
 * @param {import('../generated/prisma/index.js').PrismaClient} client
 * @param {object} [options]
 * @param {boolean} [options.silent] 静默模式（测试内不打印，避免刷屏）
 */
export async function seedDatabase(client, { silent = false } = {}) {
  await client.user.deleteMany()
  await client.role.deleteMany()
  await client.menu.deleteMany()

  // 1. 菜单树：平铺后先父后子入库，记录 key → id 映射
  const menuIdByKey = new Map()
  const menus = flattenMenus(menuTree)
  for (const menu of menus) {
    const { key, parentKey, ...data } = menu
    const created = await client.menu.create({
      data: { ...data, parentId: parentKey ? menuIdByKey.get(parentKey) : null },
    })
    menuIdByKey.set(key, created.id)
  }

  // 2. 角色：按 menuKeys 关联菜单
  for (const role of roleSeeds) {
    const { menuKeys, ...data } = role
    await client.role.create({
      data: { ...data, menus: { connect: menuKeys.map(key => ({ id: menuIdByKey.get(key) })) } },
    })
  }

  // 3. 用户：哈希密码并关联角色
  const passwordHash = bcrypt.hashSync(SEED_PASSWORD, 10)
  for (const user of userSeeds) {
    const { roleCodes, ...data } = user
    await client.user.create({
      data: { ...data, password: passwordHash, roles: { connect: roleCodes.map(code => ({ code })) } },
    })
  }

  if (!silent)
    console.log(`[seed] 播种完成：菜单 ${menus.length} 条、角色 ${roleSeeds.length} 个、用户 ${userSeeds.length} 个（密码统一为 ${SEED_PASSWORD}）`)

  return { menus: menus.length, roles: roleSeeds.length, users: userSeeds.length }
}

// 作为 Prisma 种子入口直接执行时（prisma.config.js 的 migrations.seed）播种默认库单例；
// 被 import（集成测试）时不自动执行，由调用方显式 seedDatabase(testClient)。
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedDatabase(prisma)
    .catch((err) => {
      console.error('[seed] 播种失败：', err)
      process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
}
