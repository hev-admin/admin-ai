import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const serverRoot = path.resolve(import.meta.dirname, '../..')

/**
 * 将 .env 中的相对 SQLite 路径（file:./data/app.db）解析为相对 apps/server
 * 根目录的绝对路径：Prisma CLI 与运行时（better-sqlite3 按 CWD 解析相对路径）
 * 从任意目录执行时都指向同一份数据文件；顺带确保数据目录存在。
 */
export function resolveDatabaseUrl(url = process.env.DATABASE_URL) {
  if (!url)
    url = 'file:./data/app.db'
  if (!url.startsWith('file:'))
    return url
  const rawPath = url.slice('file:'.length)
  const absolute = path.isAbsolute(rawPath) ? rawPath : path.resolve(serverRoot, rawPath)
  fs.mkdirSync(path.dirname(absolute), { recursive: true })
  return `file:${absolute.replaceAll('\\', '/')}`
}
