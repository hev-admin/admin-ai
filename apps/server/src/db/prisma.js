import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../../generated/prisma/index.js'
import { resolveDatabaseUrl } from './url.js'
// dotenv 需先于本模块体求值：入口 index.js 的 'dotenv/config' 排在 app 模块图之后，
// 不在此加载则 DATABASE_URL 自定义值会被默认路径悄悄覆盖
import 'dotenv/config'

// Prisma 7 起所有数据库均须显式提供 driver adapter（REQUIREMENTS §6）
const adapter = new PrismaBetterSqlite3({ url: resolveDatabaseUrl() })

export const prisma = new PrismaClient({ adapter })
