import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { authRateLimiter } from '../middleware/rateLimit.js'
import { authService } from '../services/auth.js'
import { tokenService } from '../services/token.js'
import { error, success } from '../utils/response.js'
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from '../validators/auth.js'

const auth = new Hono()

auth.post('/login', authRateLimiter(), zValidator('json', loginSchema), async (c) => {
  try {
    const { username, password } = c.req.valid('json')
    const result = await authService.login(username, password)
    return c.json(success(result))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

auth.post('/register', authRateLimiter(), zValidator('json', registerSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    const user = await authService.register(data)
    return c.json(success(user, '注册成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

auth.get('/profile', authMiddleware(), async (c) => {
  try {
    const { userId } = c.get('user')
    const user = await authService.getProfile(userId)
    return c.json(success(user))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

auth.post('/logout', (c) => {
  return c.json(success(null, '登出成功'))
})

// Refresh token endpoint
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token 不能为空'),
})

auth.post('/refresh', zValidator('json', refreshTokenSchema), async (c) => {
  try {
    const { refreshToken } = c.req.valid('json')
    const getUserById = async (id) => {
      return authService.getProfile(id)
    }
    const result = await tokenService.refreshAccessToken(refreshToken, getUserById)
    return c.json(success({
      token: result.accessToken,
      user: result.user,
    }))
  }
  catch (e) {
    return c.json(error(e.message), 401)
  }
})

// 更新个人信息
auth.put('/profile', authMiddleware(), zValidator('json', updateProfileSchema), async (c) => {
  try {
    const { userId } = c.get('user')
    const data = c.req.valid('json')
    const user = await authService.updateProfile(userId, data)
    return c.json(success(user, '更新成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

// 修改密码
auth.put('/password', authMiddleware(), zValidator('json', changePasswordSchema), async (c) => {
  try {
    const { userId } = c.get('user')
    const { oldPassword, newPassword } = c.req.valid('json')
    await authService.changePassword(userId, oldPassword, newPassword)
    return c.json(success(null, '密码修改成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

export default auth
