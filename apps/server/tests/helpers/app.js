import process from 'node:process'
import { cleanupSqliteTestDb, setupSqliteTestDb } from './db.js'

// 集成测试装置（M6 #36）：建库 + 播种 + 组装 app，返回 app.request() 驱动与登录辅助。
// createApp() 工厂注释明言「便于后续用 app.request() 做无服务测试」——此处即兑现。

/**
 * 启动一个绑定独立测试库、已播种三账号的 app 实例。
 * env 先于被测模块设置，故内部全用动态 import（决策点 6：不能依赖静态 import 顺序）。
 *
 * @param {string} name 测试库标识（每文件独立）
 */
export async function bootTestApp(name) {
  process.env.LOG_LEVEL = 'error'
  process.env.JWT_SECRET = 'integration-test-secret'
  process.env.DB_DRIVER = 'prisma'
  // 固定限流参数：测试断言基于缺省阈值，本地 .env 的自定义值不应影响用例
  process.env.LOGIN_RATE_MAX = '5'
  process.env.LOGIN_RATE_WINDOW = '15m'
  setupSqliteTestDb(name)

  const { prisma } = await import('../../src/db/prisma.js')
  const { seedDatabase } = await import('../../prisma/seed.js')
  await seedDatabase(prisma, { silent: true })

  const { createApp } = await import('../../src/app.js')
  const app = createApp()

  /** 发起 JSON 请求：自动挂 Authorization 与 Content-Type，返回 { status, body } */
  async function call(method, path, { token, body, headers = {} } = {}) {
    const init = { method, headers: { ...headers } }
    if (token)
      init.headers.Authorization = `Bearer ${token}`
    if (body !== undefined) {
      init.headers['Content-Type'] = 'application/json'
      init.body = JSON.stringify(body)
    }
    const res = await app.request(path, init)
    const text = await res.text()
    let parsed = null
    try {
      parsed = text ? JSON.parse(text) : null
    }
    catch {
      parsed = text
    }
    return { status: res.status, headers: res.headers, body: parsed }
  }

  /** 用种子账号登录，返回 token（失败抛出，便于测试快速定位） */
  async function login(username, password = '123456') {
    const { status, body } = await call('POST', '/api/auth/login', { body: { username, password } })
    if (status !== 200)
      throw new Error(`登录失败 ${username}: ${status} ${JSON.stringify(body)}`)
    return body.data.token
  }

  async function close() {
    await prisma.$disconnect()
    cleanupSqliteTestDb(name)
  }

  return { app, call, login, prisma, close }
}
