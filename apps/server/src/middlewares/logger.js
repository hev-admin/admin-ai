import { randomUUID } from 'node:crypto'
import { logger } from '../utils/logger.js'

/**
 * 请求日志中间件（M6 #37，替换 hono/logger）：
 * - 请求 id：透传上游 `x-request-id`（网关/反代注入场景），否则生成 UUID；
 *   经 `c.get('requestId')` 供下游（错误处理等）关联，响应头回写便于排障对账；
 * - 每请求一行结构化 JSON（method/path/status/durationMs/requestId）。
 *
 * 无 try/catch：下游异常在 Hono compose 最内层即被 onError 转为响应，不会以异常
 * 形态穿透到上游中间件——next() 返回后 c.res 已是最终响应（含错误响应）。
 */
export function requestLogger() {
  return async (c, next) => {
    const requestId = c.req.header('x-request-id') || randomUUID()
    c.set('requestId', requestId)
    c.header('x-request-id', requestId)

    const start = performance.now()
    await next()

    const status = c.res?.status ?? 0
    logger[status >= 500 ? 'error' : 'info']({
      msg: 'request',
      requestId,
      method: c.req.method,
      path: c.req.path,
      status,
      durationMs: Math.round((performance.now() - start) * 10) / 10,
    })
  }
}
