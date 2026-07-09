import process from 'node:process'
import { jwt } from 'hono/jwt'
import { JWT_ALG } from '../utils/jwt.js'

/** 无需登录即可访问的接口（REQUIREMENTS §6 中间件链） */
const WHITELIST = new Set(['/api/health', '/api/auth/login'])

/**
 * JWT 鉴权中间件：白名单直接放行，其余校验 Authorization: Bearer <token>；
 * 校验失败由 hono/jwt 抛出 401 HTTPException，经统一错误处理返回标准结构。
 * 载荷在下游经 c.get('jwtPayload') 读取。
 */
export function authGuard() {
  return async (c, next) => {
    if (WHITELIST.has(c.req.path))
      return next()
    const middleware = jwt({ secret: process.env.JWT_SECRET, alg: JWT_ALG })
    return middleware(c, next)
  }
}
