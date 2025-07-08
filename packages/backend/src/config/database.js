import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../generated/client/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 数据库文件绝对路径（src/config -> prisma/dev.db）
const dbPath = path.join(__dirname, '..', '..', 'prisma', 'dev.db')

// 创建 Prisma adapter（Prisma 7 使用 better-sqlite3）
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
})

// 使用 adapter 实例化 PrismaClient
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

export default prisma
