import process from 'node:process'
import { Hono } from 'hono'
import { ok } from '../utils/response.js'

export const healthRoutes = new Hono()

healthRoutes.get('/', (c) => {
  return ok(c, {
    status: 'up',
    driver: process.env.DB_DRIVER || 'prisma',
    time: new Date().toISOString(),
  })
})
