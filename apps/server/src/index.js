import process from 'node:process'
import { serve } from '@hono/node-server'
import { createApp } from './app.js'
import 'dotenv/config'

if (!process.env.JWT_SECRET) {
  console.error('[server] 缺少 JWT_SECRET 环境变量：请复制 .env.example 为 .env 并修改')
  process.exit(1)
}

const app = createApp()
const port = Number(process.env.PORT || 3000)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[server] admin-ai API 已启动：http://localhost:${info.port}（DB_DRIVER=${process.env.DB_DRIVER || 'prisma'}）`)
})
