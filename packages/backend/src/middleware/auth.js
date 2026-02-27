import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

export function authMiddleware() {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ code: 401, message: '未授权访问', data: null }, 401)
    }

    const token = authHeader.substring(7)

    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      c.set('user', decoded)
      await next()
    }
    catch {
      return c.json({ code: 401, message: 'Token 无效或已过期', data: null }, 401)
    }
  }
}
