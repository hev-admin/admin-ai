import { defineConfig } from 'prisma/config'
import { resolveDatabaseUrl } from './src/db/url.js'
import 'dotenv/config'

// Prisma 7 不再自动读取 .env，经顶部 dotenv/config 显式加载（REQUIREMENTS §6）
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    url: resolveDatabaseUrl(),
  },
})
