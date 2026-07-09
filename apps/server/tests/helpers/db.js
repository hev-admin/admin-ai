import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import Database from 'better-sqlite3'

// 测试库装置（M6 #36）：不依赖 prisma CLI 与网络——用 better-sqlite3 直接执行已提交的
// migration.sql 建表（REVIEW.md 2026-07-10 结论 3：migrations 必入库，此处即受益点）。

const serverRoot = path.resolve(import.meta.dirname, '../..')
const migrationsDir = path.join(serverRoot, 'prisma', 'migrations')

/** 已提交的迁移 SQL（按目录名排序，与 prisma migrate deploy 的应用顺序一致） */
function migrationSqlFiles() {
  return readdirSync(migrationsDir)
    .filter(name => existsSync(path.join(migrationsDir, name, 'migration.sql')))
    .sort()
    .map(name => path.join(migrationsDir, name, 'migration.sql'))
}

/**
 * 构建全新测试 SQLite 库：删除同名旧文件后执行迁移 SQL 建表，返回绝对路径，
 * 并设置 `DATABASE_URL`——后续动态 import 的 `db/prisma.js` 据此绑定该库。
 * 文件落在 `data/`（已 gitignore），名字带 `test-` 前缀便于识别与清理。
 *
 * @param {string} name 测试库标识（每个测试文件用独立名，进程隔离下互不干扰）
 */
export function setupSqliteTestDb(name) {
  const dbPath = path.join(serverRoot, 'data', `test-${name}.db`)
  for (const suffix of ['', '-journal', '-wal', '-shm'])
    rmSync(`${dbPath}${suffix}`, { force: true })

  const db = new Database(dbPath)
  try {
    for (const sqlFile of migrationSqlFiles())
      db.exec(readFileSync(sqlFile, 'utf-8'))
  }
  finally {
    db.close()
  }

  process.env.DATABASE_URL = `file:${dbPath.replaceAll('\\', '/')}`
  return dbPath
}

/** 删除测试库文件（含 WAL/journal 边车），测试收尾调用 */
export function cleanupSqliteTestDb(name) {
  const dbPath = path.join(serverRoot, 'data', `test-${name}.db`)
  for (const suffix of ['', '-journal', '-wal', '-shm'])
    rmSync(`${dbPath}${suffix}`, { force: true })
}
