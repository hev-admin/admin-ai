import { HTTPException } from 'hono/http-exception'
import { AppError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'
import { fail } from '../utils/response.js'

/** 统一错误处理：AppError / HTTPException（含 JWT 401）/ 未知异常 → { code, data, message } */
export function errorHandler(err, c) {
  if (err instanceof AppError)
    return fail(c, err.message, { status: err.status, code: err.code })

  if (err instanceof HTTPException) {
    const message = err.status === 401 ? '未登录或登录已过期' : err.message || '请求异常'
    return fail(c, message, { status: err.status })
  }

  // 未捕获异常：结构化输出堆栈并携带请求 id（与访问日志对账），不向客户端泄漏细节
  logger.error({ msg: 'unhandled error', requestId: c.get('requestId'), stack: err?.stack || String(err) })
  return fail(c, '服务器内部错误', { status: 500 })
}

export function notFoundHandler(c) {
  return fail(c, '接口不存在', { status: 404 })
}
