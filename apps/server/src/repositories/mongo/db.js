import process from 'node:process'
import { MongoClient } from 'mongodb'
// dotenv 需先于配置读取求值（与 db/prisma.js 同因：入口的 'dotenv/config' 排在 app 模块图之后）
import 'dotenv/config'

/** 连接配置统一出口（运行时与 seed/mongo.js 共用），缺省值对齐 .env.example */
export function mongoConfig() {
  return {
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB || 'admin_ai',
  }
}

let dbPromise = null
let client = null

/**
 * 惰性单例连接：首次数据访问时才建立（对齐仓储工厂的惰性装配，规避顶层 await）。
 * ignoreUndefined：undefined 字段不序列化为 null（Prisma 的 undefined 语义是「不改动」，
 * 写入侧另有显式剔除，此处为双保险，M4 决策点 7）。
 */
export function getDb() {
  dbPromise ??= (async () => {
    const { url, dbName } = mongoConfig()
    client = new MongoClient(url, { ignoreUndefined: true })
    await client.connect()
    return client.db(dbName)
  })()
  return dbPromise
}

/** 关闭连接并复位单例（测试收尾 / 优雅停机用；未连接时为空操作） */
export async function closeDb() {
  if (client) {
    await client.close()
    client = null
    dbPromise = null
  }
}
