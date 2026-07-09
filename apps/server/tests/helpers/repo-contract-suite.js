import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

// repository 契约测试套件（M6 #36 决策点 3）：一套用例、两套实现共跑。
// 锁死 repositories/index.js JSDoc 声明的契约——where 值形态解释、关联 id 数组语义、
// 分页/排序、create/update/remove 生命周期与「不存在」返回约定。任一实现漂移即被捕获。

/** 相邻创建间隔，规避同毫秒 createdAt 下缺省排序的跨库 tiebreaker 差异（决策点 4） */
function sleep(ms = 6) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * @param {object} ctx
 * @param {() => { userRepo, roleRepo, menuRepo }} ctx.getRepos 返回被测实现的仓储集
 * @param {() => Promise<void>} ctx.reset 清空三集合/表（用例间隔离）
 */
export function defineRepoContractSuite({ getRepos, reset }) {
  describe('repository 契约', () => {
    it('create 返回完整实体：字符串 id、时间戳、字段回显', async () => {
      const { userRepo } = getRepos()
      await reset()
      const user = await userRepo.create({ username: 'alice', password: 'h', nickname: 'Alice', status: 1, roleIds: [] })
      assert.equal(typeof user.id, 'string')
      assert.ok(user.id.length > 0)
      assert.equal(user.username, 'alice')
      assert.ok(user.createdAt instanceof Date)
      assert.ok(user.updatedAt instanceof Date)
      assert.deepEqual(user.roleIds, [])
    })

    it('getById / findByUnique：命中返回实体，未命中或非法 id 返回 null', async () => {
      const { userRepo } = getRepos()
      await reset()
      const created = await userRepo.create({ username: 'bob', password: 'h', nickname: 'Bob', status: 1, roleIds: [] })
      assert.equal((await userRepo.getById(created.id)).username, 'bob')
      assert.equal((await userRepo.findByUnique('username', 'bob')).id, created.id)
      assert.equal(await userRepo.getById('nonexistent-id-xxxxxxxxxxxx'), null)
      assert.equal(await userRepo.findByUnique('username', 'nope'), null)
    })

    it('findPage：分页 total 与 list 长度、缺省 createdAt desc 排序', async () => {
      const { userRepo } = getRepos()
      await reset()
      for (const name of ['u1', 'u2', 'u3']) {
        await userRepo.create({ username: name, password: 'h', nickname: name, status: 1, roleIds: [] })
        await sleep()
      }
      const page1 = await userRepo.findPage({ page: 1, pageSize: 2 })
      assert.equal(page1.total, 3)
      assert.equal(page1.list.length, 2)
      // 缺省排序 createdAt desc：最后创建的 u3 在首位
      assert.equal(page1.list[0].username, 'u3')
      const page2 = await userRepo.findPage({ page: 2, pageSize: 2 })
      assert.equal(page2.list.length, 1)
      assert.equal(page2.list[0].username, 'u1')
    })

    it('where：空值忽略、数组 in、模糊包含、等值', async () => {
      const { userRepo } = getRepos()
      await reset()
      await userRepo.create({ username: 'search_alpha', password: 'h', nickname: 'Alpha', status: 1, roleIds: [] })
      await userRepo.create({ username: 'search_beta', password: 'h', nickname: 'Beta', status: 0, roleIds: [] })
      await userRepo.create({ username: 'other_gamma', password: 'h', nickname: 'Gamma', status: 1, roleIds: [] })

      // 空值忽略：where 全空 → 返回全部
      assert.equal((await userRepo.findPage({ where: { username: '', status: undefined } })).total, 3)
      // 模糊包含（username 声明于 fuzzyFields）
      const fuzzy = await userRepo.findMany({ username: 'search_' })
      assert.equal(fuzzy.length, 2)
      // 等值匹配（status 非 fuzzy）
      const enabled = await userRepo.findMany({ status: 1 })
      assert.equal(enabled.length, 2)
      // 数组 → in
      const names = (await userRepo.findMany({ username: ['search_alpha', 'other_gamma'] })).map(u => u.username).sort()
      // username 是 fuzzyField 但数组值走 in 分支（数组优先于模糊）
      assert.deepEqual(names, ['other_gamma', 'search_alpha'])
    })

    it('update：回写并合并，未提供字段不动；目标不存在返回 null', async () => {
      const { userRepo } = getRepos()
      await reset()
      const user = await userRepo.create({ username: 'carol', password: 'h', nickname: 'Carol', email: 'c@x.dev', status: 1, roleIds: [] })
      const updated = await userRepo.update(user.id, { nickname: 'Carol2' })
      assert.equal(updated.nickname, 'Carol2')
      assert.equal(updated.email, 'c@x.dev') // 未传字段保持
      assert.equal(updated.username, 'carol')
      assert.equal(await userRepo.update('nonexistent-id-xxxxxxxxxxxx', { nickname: 'x' }), null)
    })

    it('remove：命中返回 true 并真正删除；未命中返回 false', async () => {
      const { userRepo } = getRepos()
      await reset()
      const user = await userRepo.create({ username: 'dave', password: 'h', nickname: 'Dave', status: 1, roleIds: [] })
      assert.equal(await userRepo.remove(user.id), true)
      assert.equal(await userRepo.getById(user.id), null)
      assert.equal(await userRepo.remove(user.id), false)
      assert.equal(await userRepo.remove('nonexistent-id-xxxxxxxxxxxx'), false)
    })

    it('count：按 where 计数', async () => {
      const { userRepo } = getRepos()
      await reset()
      await userRepo.create({ username: 'e1', password: 'h', nickname: 'E1', status: 1, roleIds: [] })
      await userRepo.create({ username: 'e2', password: 'h', nickname: 'E2', status: 0, roleIds: [] })
      assert.equal(await userRepo.count(), 2)
      assert.equal(await userRepo.count({ status: 1 }), 1)
    })

    it('多对多关联：id 数组暴露、data 携带即整体重设、关联包含 where', async () => {
      const { userRepo, roleRepo } = getRepos()
      await reset()
      const roleA = await roleRepo.create({ name: '角色A', code: 'role_a', menuIds: [] })
      const roleB = await roleRepo.create({ name: '角色B', code: 'role_b', menuIds: [] })

      // 创建即带关联
      const user = await userRepo.create({ username: 'frank', password: 'h', nickname: 'Frank', status: 1, roleIds: [roleA.id] })
      assert.deepEqual(user.roleIds, [roleA.id])

      // update 携带数组 → 整体重设（非追加）
      const reassigned = await userRepo.update(user.id, { roleIds: [roleB.id] })
      assert.deepEqual(reassigned.roleIds, [roleB.id])

      // 关联包含 where：roleIds 标量值 → 「拥有该角色」匹配
      const withRoleB = await userRepo.findMany({ roleIds: roleB.id })
      assert.equal(withRoleB.length, 1)
      assert.equal(withRoleB[0].id, user.id)
      const withRoleA = await userRepo.findMany({ roleIds: roleA.id })
      assert.equal(withRoleA.length, 0)
    })

    it('关联清理：删除被引用实体后，引用方数组自动移除该 id', async () => {
      const { userRepo, roleRepo } = getRepos()
      await reset()
      const role = await roleRepo.create({ name: '临时角色', code: 'role_tmp', menuIds: [] })
      const user = await userRepo.create({ username: 'grace', password: 'h', nickname: 'Grace', status: 1, roleIds: [role.id] })
      await roleRepo.remove(role.id)
      // 隐式多对多（prisma 自动清 join 行）/ removeCleanups（mongo $pull）→ 两实现同口径
      const after = await userRepo.getById(user.id)
      assert.deepEqual(after.roleIds, [])
    })
  })
}
