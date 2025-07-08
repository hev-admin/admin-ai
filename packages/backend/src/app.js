import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { logMiddleware } from './middleware/log.js'
import { globalRateLimiter } from './middleware/rateLimit.js'
import routes from './routes/index.js'

const app = new Hono()

app.use('*', logger())
app.use('*', cors())
app.use('/api/*', globalRateLimiter())
app.use('/api/*', logMiddleware())

// Serve static files from public directory
app.use('/uploads/*', serveStatic({ root: './public' }))

// API routes with versioning
app.route('/api/v1', routes)

// Legacy API support (maps to v1)
app.route('/api', routes)

app.onError((err, c) => {
  // eslint-disable-next-line no-console
  console.error(err)
  return c.json({
    code: err.status || 500,
    message: err.message || 'Internal Server Error',
    data: null,
  }, err.status || 500)
})

app.notFound((c) => {
  return c.json({ code: 404, message: 'Not Found', data: null }, 404)
})

export default app
