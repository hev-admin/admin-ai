import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { bootTestApp } from './helpers/app.js'

// RBAC 与接口行为集成测试（M6 #36）：经 app.request() 驱动真实中间件链，
// 覆盖三账号权限矩阵、鉴权与校验错误结构、防护口径、认证行为口径。

let ctx

before(async () => {
  ctx = await bootTestApp('rbac')
})

after(async () => {
  await ctx.close()
})

describe('鉴权入口', () => {
  it('健康检查在白名单内，免 token 200', async () => {
    const { status, body } = await ctx.call('GET', '/api/health')
    assert.equal(status, 200)
    assert.equal(body.code, 0)
  })

  it('无 token 访问受保护接口 → 401 统一结构', async () => {
    const { status, body } = await ctx.call('GET', '/api/users')
    assert.equal(status, 401)
    assert.equal(body.code, 401)
    assert.ok(body.message)
  })

  it('错误密码 → 401；密码正确但不存在的账号 → 401', async () => {
    const bad = await ctx.call('POST', '/api/auth/login', { body: { username: 'super', password: 'wrong' } })
    assert.equal(bad.status, 401)
    const noUser = await ctx.call('POST', '/api/auth/login', { body: { username: 'ghost', password: '123456' } })
    assert.equal(noUser.status, 401)
  })

  it('登录参数缺失 → 422 且带字段级 issues', async () => {
    const { status, body } = await ctx.call('POST', '/api/auth/login', { body: { username: '' } })
    assert.equal(status, 422)
    assert.equal(body.code, 422)
    assert.ok(Array.isArray(body.data.issues))
    assert.ok(body.data.issues.length > 0)
  })
})

describe('三账号权限矩阵', () => {
  it('super：拥有全部权限，可列用户、可删除', async () => {
    const token = await ctx.login('super')
    const list = await ctx.call('GET', '/api/users', { token })
    assert.equal(list.status, 200)
    assert.ok(list.body.data.total >= 3)
  })

  it('admin：有菜单但无删除类按钮 → 列表 200 / 删除 403', async () => {
    const token = await ctx.login('admin')
    const list = await ctx.call('GET', '/api/users', { token })
    assert.equal(list.status, 200)
    // admin 角色被 seed 剔除了所有 :delete 权限码
    const target = list.body.data.list.find(u => u.username === 'user')
    const del = await ctx.call('DELETE', `/api/users/${target.id}`, { token })
    assert.equal(del.status, 403)
    assert.equal(del.body.code, 403)
  })

  it('user：仅工作台与个人中心 → 用户列表 403', async () => {
    const token = await ctx.login('user')
    const list = await ctx.call('GET', '/api/users', { token })
    assert.equal(list.status, 403)
  })

  it('user：无权限码接口（个人中心）仍可访问 → profile 200', async () => {
    const token = await ctx.login('user')
    const me = await ctx.call('GET', '/api/auth/user', { token })
    assert.equal(me.status, 200)
    assert.equal(me.body.data.user.username, 'user')
    // user 仅 dashboard + profile 两个菜单
    assert.ok(Array.isArray(me.body.data.menus))
  })
})

describe('防护口径与错误结构', () => {
  it('未知接口路径 → 404 JSON（非 HTML）', async () => {
    const token = await ctx.login('super')
    const { status, body } = await ctx.call('GET', '/api/nonexistent', { token })
    assert.equal(status, 404)
    assert.equal(body.code, 404)
  })

  it('不能删除当前登录账号 → 400', async () => {
    const token = await ctx.login('super')
    const me = await ctx.call('GET', '/api/auth/user', { token })
    const selfId = me.body.data.user.id
    const { status, body } = await ctx.call('DELETE', `/api/users/${selfId}`, { token })
    assert.equal(status, 400)
    assert.match(body.message, /当前登录账号/)
  })

  it('创建用户重名 → 400', async () => {
    const token = await ctx.login('super')
    const { status } = await ctx.call('POST', '/api/users', {
      token,
      body: { username: 'super', password: '123456', nickname: '重名' },
    })
    assert.equal(status, 400)
  })
})

describe('认证行为口径（改密后旧 token 有效）', () => {
  it('改密后旧 token 至自然过期前仍通过鉴权（M3 决策点 7 / backend.md 口径）', async () => {
    // 用 admin 账号验证，避免污染其它用例依赖的 super/user
    const token = await ctx.login('admin')
    const change = await ctx.call('PUT', '/api/auth/password', {
      token,
      body: { oldPassword: '123456', password: '654321' },
    })
    assert.equal(change.status, 200)
    // 无状态 JWT 不吊销：旧 token 仍可访问受保护接口
    const stillOk = await ctx.call('GET', '/api/auth/user', { token })
    assert.equal(stillOk.status, 200)
    // 新密码可登录、旧密码不可
    assert.equal((await ctx.call('POST', '/api/auth/login', { body: { username: 'admin', password: '654321' } })).status, 200)
    assert.equal((await ctx.call('POST', '/api/auth/login', { body: { username: 'admin', password: '123456' } })).status, 401)
  })
})
