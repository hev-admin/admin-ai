import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'prisma/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 数据库文件绝对路径（配置文件在 packages/backend/，数据库在 prisma/dev.db）
const dbPath = path.join(__dirname, 'prisma', 'dev.db')

export default defineConfig({
  // Schema 文件位置
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),

  // 数据源配置
  datasource: {
    url: `file:${dbPath}`,
  },

  // 迁移配置
  migrations: {
    schema: path.join(__dirname, 'prisma', 'schema.prisma'),
    seed: 'node prisma/seed.js',
  },
})
