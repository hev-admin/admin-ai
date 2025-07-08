import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { authService } from '../services/auth.js'
import { error, success } from '../utils/response.js'

const auth = new Hono()

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(6, '密码至少6位'),
})

const registerSchema = z.object({
  username: z.string().min(3, '用户名至少3位'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位'),
  nickname: z.string().optional(),
})

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { username, password } = c.req.valid('json')
    const result = await authService.login(username, password)
    return c.json(success(result))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

auth.post('/register', zValidator('json', registerSchema), async (c) => {
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

// 更新个人信息
auth.put('/profile', authMiddleware(), async (c) => {
  try {
    const { userId } = c.get('user')
    const data = await c.req.json()
    const user = await authService.updateProfile(userId, data)
    return c.json(success(user, '更新成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

// 修改密码
auth.put('/password', authMiddleware(), async (c) => {
  try {
    const { userId } = c.get('user')
    const { oldPassword, newPassword } = await c.req.json()
    await authService.changePassword(userId, oldPassword, newPassword)
    return c.json(success(null, '密码修改成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

export default auth
