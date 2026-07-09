import process from 'node:process'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authGuard } from './middlewares/auth.js'
import { errorHandler, notFoundHandler } from './middlewares/error.js'
import { requestLogger } from './middlewares/logger.js'
import { registerRoutes } from './routes/index.js'

/**
 * 组装 Hono 应用。中间件链：结构化请求日志（含请求 id）→ CORS → 统一错误处理 →
 * JWT 鉴权 → 业务路由（REQUIREMENTS §6，M6 #37 起日志为自研结构化实现）；
 * 独立成工厂便于用 app.request() 做无服务测试（tests/ 已落地）。
 */
export function createApp() {
  const app = new Hono()

  app.use(requestLogger())
  app.use('/api/*', cors())
  app.onError(errorHandler)
  app.notFound(notFoundHandler)
  app.use('/api/*', authGuard())

  registerRoutes(app)
  mountWebStatic(app)
  return app
}

/**
 * web 静态托管与 SPA fallback（M7 #42）：经 WEB_DIST 指向 web 构建产物时启用，
 * 供单镜像部署形态同源托管页面与 API；未设置时完全不挂载，dev 行为零变化。
 * fallback 排除 /api 前缀，保住未知接口路径的 JSON 404 语义。
 */
function mountWebStatic(app) {
  const root = process.env.WEB_DIST
  if (!root)
    return

  const assets = serveStatic({ root })
  const indexHtml = serveStatic({ root, path: 'index.html' })
  app.use('*', assets)
  app.get('*', (c, next) => {
    const path = c.req.path
    if (path === '/api' || path.startsWith('/api/'))
      return notFoundHandler(c)
    return indexHtml(c, next)
  })
}
