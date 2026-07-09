import process from 'node:process'
import { after } from 'node:test'
import { cleanupSqliteTestDb, setupSqliteTestDb } from './helpers/db.js'
import { defineRepoContractSuite } from './helpers/repo-contract-suite.js'

// Prisma 实现的契约测试入口（M6 #36）。env 必须先于被测模块设置（db/prisma.js 在模块
// 加载时绑定 DATABASE_URL），故用顶层 await + 动态 import——不能写静态 import
// （perfectionist/sort-imports 会重排，无法保证求值顺序）。

process.env.LOG_LEVEL = 'error'
process.env.JWT_SECRET ||= 'test-secret'
setupSqliteTestDb('contract-prisma')

const { prisma } = await import('../src/db/prisma.js')
const repos = await import('../src/repositories/prisma/index.js')

async function reset() {
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()
  await prisma.menu.deleteMany()
}

defineRepoContractSuite({ getRepos: () => repos, reset })

after(async () => {
  await prisma.$disconnect()
  cleanupSqliteTestDb('contract-prisma')
})
