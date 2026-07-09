import process from 'node:process'
import { after, describe } from 'node:test'
import { defineRepoContractSuite } from './helpers/repo-contract-suite.js'

// Mongo 实现的契约测试入口（M6 #36 决策点 3）：经 RUN_MONGO_TESTS=1 显式开启
// （需本机可连 MongoDB），未开启时整套 skip——无 Mongo 环境不阻塞关系库全量用例。
// 连接独立测试库（缺省 admin_ai_test），套件用例自建数据、before/after 自清理。

const enabled = process.env.RUN_MONGO_TESTS === '1'

if (!enabled) {
  describe('repository 契约（mongo）', { skip: '设 RUN_MONGO_TESTS=1 并启动本机 MongoDB 后运行' }, () => {})
}
else {
  process.env.LOG_LEVEL = 'error'
  process.env.MONGODB_DB ||= 'admin_ai_test'
  if (!process.env.MONGODB_DB.endsWith('_test'))
    process.env.MONGODB_DB = `${process.env.MONGODB_DB}_test`

  const { getDb, closeDb } = await import('../src/repositories/mongo/db.js')
  const repos = await import('../src/repositories/mongo/index.js')

  async function reset() {
    const db = await getDb()
    await Promise.all(['users', 'roles', 'menus'].map(name => db.collection(name).deleteMany({})))
  }

  defineRepoContractSuite({ getRepos: () => repos, reset })

  after(async () => {
    await reset()
    await closeDb()
  })
}
