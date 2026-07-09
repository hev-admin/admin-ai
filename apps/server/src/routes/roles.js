import { Hono } from 'hono'
import { z } from 'zod'
import { requirePermission } from '../middlewares/permission.js'
import { assignRoleMenus, createRole, listRoles, removeRole, updateRole } from '../services/roles.js'
import { ok } from '../utils/response.js'
import { emptyToNull } from '../utils/schema.js'
import { validate } from '../utils/validate.js'

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  name: z.string().optional(),
  code: z.string().optional(),
})

const codeSchema = z.string()
  .min(2, '角色标识至少 2 个字符')
  .max(32)
  .regex(/^[a-z][\w:-]*$/i, '角色标识须以字母开头，仅支持字母、数字、下划线、冒号与连字符')

const createRoleSchema = z.object({
  name: z.string().min(1, '角色名称不能为空').max(32),
  code: codeSchema,
  remark: z.preprocess(emptyToNull, z.string().max(255).nullable()),
  menuIds: z.array(z.string()).default([]),
})

const updateRoleSchema = z.object({
  name: z.string().min(1, '角色名称不能为空').max(32).optional(),
  code: codeSchema.optional(),
  remark: z.preprocess(emptyToNull, z.string().max(255).nullable()),
  menuIds: z.array(z.string()).optional(),
})

const menusSchema = z.object({ menuIds: z.array(z.string()) })

export const rolesRoutes = new Hono()

rolesRoutes.get('/', requirePermission('sys:role:list'), validate('query', listQuerySchema), async (c) => {
  return ok(c, await listRoles(c.req.valid('query')))
})

rolesRoutes.post('/', requirePermission('sys:role:add'), validate('json', createRoleSchema), async (c) => {
  return ok(c, await createRole(c.req.valid('json')), '创建成功')
})

rolesRoutes.put('/:id', requirePermission('sys:role:edit'), validate('json', updateRoleSchema), async (c) => {
  return ok(c, await updateRole(c.req.param('id'), c.req.valid('json')), '保存成功')
})

rolesRoutes.delete('/:id', requirePermission('sys:role:delete'), async (c) => {
  await removeRole(c.req.param('id'))
  return ok(c, null, '删除成功')
})

// 分配权限：菜单树勾选集合整体重设（§5.2）
rolesRoutes.put('/:id/menus', requirePermission('sys:role:assignPerm'), validate('json', menusSchema), async (c) => {
  return ok(c, await assignRoleMenus(c.req.param('id'), c.req.valid('json').menuIds), '权限已更新')
})
