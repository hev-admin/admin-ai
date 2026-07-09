import assert from 'node:assert/strict'
import process from 'node:process'
import { after, before, describe, it } from 'node:test'
import { bootTestApp } from './helpers/app.js'

// 结构化日志与请求 id 行为测试（M6 #37）：请求 id 生成/透传/回写、
// LOG_LEVEL 过滤与 JSON 行结构（劫持 console 捕获输出断言）。

let ctx

before(async () => {
  ctx = await bootTestApp('logging')
})

after(async () => {
  await ctx.close()
})

describe('请求 id', () => {
  it('响应头回写 x-request-id（未提供时自动生成 UUID）', async () => {
    const { headers } = await ctx.call('GET', '/api/health')
    const requestId = headers.get('x-request-id')
    assert.ok(requestId)
    assert.match(requestId, /^[0-9a-f-]{36}$/)
  })

  it('上游已带 x-request-id 时透传（网关注入场景）', async () => {
    const { headers } = await ctx.call('GET', '/api/health', { headers: { 'x-request-id': 'gw-trace-001' } })
    assert.equal(headers.get('x-request-id'), 'gw-trace-001')
  })

  it('错误响应同样携带请求 id（401 路径）', async () => {
    const { status, headers } = await ctx.call('GET', '/api/users')
    assert.equal(status, 401)
    assert.ok(headers.get('x-request-id'))
  })
})

describe('结构化输出与级别过滤', () => {
  /** 劫持 console 捕获日志行，执行完恢复 */
  async function captureLogs(fn) {
    const lines = []
    const original = { log: console.log, error: console.error }
    console.log = line => lines.push(line)
    console.error = line => lines.push(line)
    try {
      await fn()
    }
    finally {
      console.log = original.log
      console.error = original.error
    }
    return lines
  }

  it('LOG_LEVEL=info 时每请求输出一行 JSON（含约定字段）', async () => {
    process.env.LOG_LEVEL = 'info'
    const lines = await captureLogs(() => ctx.call('GET', '/api/health', { headers: { 'x-request-id': 'log-assert-1' } }))
    process.env.LOG_LEVEL = 'error'
    const parsed = lines.map(l => JSON.parse(l)).filter(e => e.requestId === 'log-assert-1')
    assert.equal(parsed.length, 1)
    const entry = parsed[0]
    assert.equal(entry.msg, 'request')
    assert.equal(entry.method, 'GET')
    assert.equal(entry.path, '/api/health')
    assert.equal(entry.status, 200)
    assert.equal(typeof entry.durationMs, 'number')
    assert.ok(entry.time)
  })

  it('LOG_LEVEL=error 时访问日志静音（测试环境即此口径）', async () => {
    const lines = await captureLogs(() => ctx.call('GET', '/api/health'))
    assert.equal(lines.length, 0)
  })
})
