import { Hono } from 'hono'
import { z } from 'zod'
import { USER_STATUS } from '../constants.js'
import { requirePermission } from '../middlewares/permission.js'
import {
  assignUserRoles,
  createUser,
  listUsers,
  removeUser,
  removeUsers,
  resetUserPassword,
  setUserStatus,
  updateUser,
} from '../services/users.js'
import { ok } from '../utils/response.js'
import { emptyToNull } from '../utils/schema.js'
import { validate } from '../utils/validate.js'

// 接口路径与权限码按 REQUIREMENTS §7 / seed 菜单树约定；权限校验先于参数校验

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  username: z.string().optional(),
  status: z.enum(['0', '1']).transform(Number).optional(),
})

const statusEnum = z.union([z.literal(USER_STATUS.disabled), z.literal(USER_STATUS.enabled)])

const createUserSchema = z.object({
  username: z.string().min(2, '用户名至少 2 个字符').max(32).regex(/^[\w-]+$/, '用户名仅支持字母、数字、下划线与连字符'),
  password: z.string().min(6, '密码至少 6 位').max(64),
  nickname: z.string().min(1, '昵称不能为空').max(32),
  email: z.preprocess(emptyToNull, z.email('邮箱格式不正确').nullable()),
  avatar: z.preprocess(emptyToNull, z.string().max(255).nullable()),
  status: statusEnum.default(USER_STATUS.enabled),
  roleIds: z.array(z.string()).default([]),
})

const updateUserSchema = z.object({
  nickname: z.string().min(1, '昵称不能为空').max(32).optional(),
  email: z.preprocess(emptyToNull, z.email('邮箱格式不正确').nullable()),
  avatar: z.preprocess(emptyToNull, z.string().max(255).nullable()),
  status: statusEnum.optional(),
  roleIds: z.array(z.string()).optional(),
})

const idsSchema = z.object({ ids: z.array(z.string()).min(1, '请选择要删除的记录') })
const statusSchema = z.object({ status: statusEnum })
const passwordSchema = z.object({ password: z.string().min(6, '密码至少 6 位').max(64) })
const rolesSchema = z.object({ roleIds: z.array(z.string()) })

export const usersRoutes = new Hono()

usersRoutes.get('/', requirePermission('sys:user:list'), validate('query', listQuerySchema), async (c) => {
  return ok(c, await listUsers(c.req.valid('query')))
})

usersRoutes.post('/', requirePermission('sys:user:add'), validate('json', createUserSchema), async (c) => {
  return ok(c, await createUser(c.req.valid('json')), '创建成功')
})

// 批量删除（body { ids }）：路径与单条删除同资源，按 §7 约定
usersRoutes.delete('/', requirePermission('sys:user:delete'), validate('json', idsSchema), async (c) => {
  const data = await removeUsers(c.req.valid('json').ids, c.get('jwtPayload').sub)
  return ok(c, data, '删除成功')
})

usersRoutes.put('/:id', requirePermission('sys:user:edit'), validate('json', updateUserSchema), async (c) => {
  return ok(c, await updateUser(c.req.param('id'), c.req.valid('json')), '保存成功')
})

usersRoutes.delete('/:id', requirePermission('sys:user:delete'), async (c) => {
  await removeUser(c.req.param('id'), c.get('jwtPayload').sub)
  return ok(c, null, '删除成功')
})

usersRoutes.patch('/:id/status', requirePermission('sys:user:status'), validate('json', statusSchema), async (c) => {
  const user = await setUserStatus(c.req.param('id'), c.req.valid('json').status, c.get('jwtPayload').sub)
  return ok(c, user, user.status === USER_STATUS.enabled ? '已启用' : '已禁用')
})

usersRoutes.put('/:id/password', requirePermission('sys:user:resetPwd'), validate('json', passwordSchema), async (c) => {
  await resetUserPassword(c.req.param('id'), c.req.valid('json').password)
  return ok(c, null, '密码已重置')
})

usersRoutes.put('/:id/roles', requirePermission('sys:user:assignRole'), validate('json', rolesSchema), async (c) => {
  return ok(c, await assignUserRoles(c.req.param('id'), c.req.valid('json').roleIds), '角色已更新')
})
