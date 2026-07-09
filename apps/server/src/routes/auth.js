import bcrypt from 'bcryptjs'
import { Hono } from 'hono'
import { z } from 'zod'
import { USER_STATUS } from '../constants.js'
import { loginRateLimit } from '../middlewares/rate-limit.js'
import { changePassword, findUserByUsername, getUserInfo, updateProfile } from '../services/auth.js'
import { AppError } from '../utils/errors.js'
import { signToken } from '../utils/jwt.js'
import { ok } from '../utils/response.js'
import { emptyToNull } from '../utils/schema.js'
import { validate } from '../utils/validate.js'

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
})

const profileSchema = z.object({
  nickname: z.string().min(1, '昵称不能为空').max(32),
  email: z.preprocess(emptyToNull, z.email('邮箱格式不正确').nullable()),
  avatar: z.preprocess(emptyToNull, z.string().max(255).nullable()),
})

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '请输入旧密码'),
  password: z.string().min(6, '密码至少 6 位').max(64),
})

export const authRoutes = new Hono()

// 限流先于参数校验（M6 #38：失败计数与 429 见 middlewares/rate-limit.js）
authRoutes.post('/login', loginRateLimit(), validate('json', loginSchema), async (c) => {
  const { username, password } = c.req.valid('json')

  const user = await findUserByUsername(username)
  if (!user || !bcrypt.compareSync(password, user.password))
    throw new AppError(401, '用户名或密码错误')
  if (user.status !== USER_STATUS.enabled)
    throw new AppError(403, '账号已被禁用，请联系管理员')

  const { roles, permissions } = await getUserInfo(user.id)
  const token = await signToken({ sub: user.id, username: user.username, roles, permissions })
  return ok(c, { token }, '登录成功')
})

// 无状态 JWT 不维护黑名单：真正失效依赖前端清除与 token 自然过期，本接口仅作占位与审计钩子（§4.1）
authRoutes.post('/logout', (c) => {
  return ok(c, null, '退出成功')
})

authRoutes.get('/user', async (c) => {
  const payload = c.get('jwtPayload')
  const info = await getUserInfo(payload.sub)
  if (!info)
    throw new AppError(401, '用户不存在或已被删除')
  return ok(c, info)
})

// 个人中心（REQUIREMENTS §5.3 / §7 / #24）：本人资料与密码，无需权限码
authRoutes.put('/profile', validate('json', profileSchema), async (c) => {
  const payload = c.get('jwtPayload')
  return ok(c, await updateProfile(payload.sub, c.req.valid('json')), '资料已更新')
})

authRoutes.put('/password', validate('json', changePasswordSchema), async (c) => {
  const payload = c.get('jwtPayload')
  const { oldPassword, password } = c.req.valid('json')
  await changePassword(payload.sub, oldPassword, password)
  return ok(c, null, '密码已修改')
})
