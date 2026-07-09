import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { bootTestApp } from './helpers/app.js'

// 登录限流行为测试（M6 #38）：失败计满触发 429（正确密码也拒）、
// 分桶隔离（不同用户名互不影响）、成功登录清零计数。
// 缺省阈值 5 次/15 分钟；app.request() 场景 IP 为 'unknown'，分桶退化为按用户名——
// 正好隔离各用例（每用例独立用户名）。

let ctx

before(async () => {
  ctx = await bootTestApp('rate-limit')
})

after(async () => {
  await ctx.close()
})

function attempt(username, password) {
  return ctx.call('POST', '/api/auth/login', { body: { username, password } })
}

describe('登录限流', () => {
  it('连续失败达阈值后：正确密码也返回 429（统一错误结构）', async () => {
    // 造一个专用账号，避免污染种子账号的计数桶
    const token = await ctx.login('super')
    await ctx.call('POST', '/api/users', {
      token,
      body: { username: 'bruteforce_target', password: 'right-pass-9', nickname: '爆破目标' },
    })

    for (let i = 0; i < 5; i++) {
      const { status } = await attempt('bruteforce_target', `wrong-${i}`)
      assert.equal(status, 401, `第 ${i + 1} 次失败应为 401（未达阈值）`)
    }
    const blocked = await attempt('bruteforce_target', 'right-pass-9')
    assert.equal(blocked.status, 429)
    assert.equal(blocked.body.code, 429)
    assert.match(blocked.body.message, /频繁/)
  })

  it('分桶按用户名隔离：其它账号不受已封禁账号影响', async () => {
    // 上一用例已把 bruteforce_target 打满，种子账号应正常登录
    const { status } = await attempt('user', '123456')
    assert.equal(status, 200)
  })

  it('成功登录清零失败计数：未达阈值的失败不累积到下个周期', async () => {
    const token = await ctx.login('super')
    await ctx.call('POST', '/api/users', {
      token,
      body: { username: 'reset_counter', password: 'right-pass-9', nickname: '计数重置' },
    })

    // 4 次失败（未达 5）→ 成功登录 → 计数清零 → 再 4 次失败仍不应 429
    for (let i = 0; i < 4; i++)
      await attempt('reset_counter', 'nope')
    assert.equal((await attempt('reset_counter', 'right-pass-9')).status, 200)
    for (let i = 0; i < 4; i++) {
      const { status } = await attempt('reset_counter', 'nope')
      assert.equal(status, 401, '成功后计数应已清零，4 次失败不触发限流')
    }
  })

  it('422 参数校验失败不计入也不清零计数', async () => {
    const token = await ctx.login('super')
    await ctx.call('POST', '/api/users', {
      token,
      body: { username: 'malformed_probe', password: 'right-pass-9', nickname: '畸形请求' },
    })

    for (let i = 0; i < 4; i++)
      await attempt('malformed_probe', 'nope')
    // 缺 password 字段 → 422，不应把计数清零
    const malformed = await ctx.call('POST', '/api/auth/login', { body: { username: 'malformed_probe' } })
    assert.equal(malformed.status, 422)
    // 第 5 次失败 → 计满；随后正确密码 429
    await attempt('malformed_probe', 'nope')
    assert.equal((await attempt('malformed_probe', 'right-pass-9')).status, 429)
  })
})
