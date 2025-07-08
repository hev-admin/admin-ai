import { logService } from '../services/log.js'

const moduleMap = {
  '/api/users': '用户管理',
  '/api/roles': '角色管理',
  '/api/menus': '菜单管理',
  '/api/auth': '认证',
}

export function logMiddleware() {
  return async (c, next) => {
    const start = Date.now()
    const method = c.req.method
    const path = c.req.path

    // Skip GET requests and log routes
    if (method === 'GET' || path.includes('/logs')) {
      return next()
    }

    await next()

    const duration = Date.now() - start
    const user = c.get('user')
    const module = Object.entries(moduleMap).find(([k]) => path.startsWith(k))?.[1] || '其他'

    try {
      await logService.create({
        userId: user?.userId || null,
        username: user?.username || null,
        module,
        action: getAction(method),
        method,
        path,
        ip: c.req.header('x-forwarded-for') || 'unknown',
        userAgent: c.req.header('user-agent') || null,
        status: c.res.status < 400 ? 1 : 0,
        duration,
      })
    }
    catch (e) {
      console.error('Log error:', e)
    }
  }
}

function getAction(method) {
  const actions = {
    POST: '新增',
    PUT: '修改',
    DELETE: '删除',
  }
  return actions[method] || method
}
