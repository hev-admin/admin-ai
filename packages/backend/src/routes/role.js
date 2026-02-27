import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { permissionMiddleware } from '../middleware/permission.js'
import { roleService } from '../services/role.js'
import { error, paginate, success } from '../utils/response.js'
import { batchDeleteRoleSchema, createRoleSchema, updateRoleSchema } from '../validators/role.js'

const role = new Hono()

role.use('*', authMiddleware())

role.get('/', async (c) => {
  const { page = 1, pageSize = 10 } = c.req.query()
  const { list, total } = await roleService.getList(
    Number(page),
    Number(pageSize),
  )
  return c.json(paginate(list, Number(page), Number(pageSize), total))
})

role.get('/all', async (c) => {
  const roles = await roleService.getAll()
  return c.json(success(roles))
})

role.get('/:id', async (c) => {
  const role = await roleService.getById(c.req.param('id'))
  return role ? c.json(success(role)) : c.json(error('角色不存在'), 404)
})

role.post('/', permissionMiddleware('system:role:create'), zValidator('json', createRoleSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    const role = await roleService.create(data)
    return c.json(success(role, '创建成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

role.put('/:id', permissionMiddleware('system:role:update'), zValidator('json', updateRoleSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    const role = await roleService.update(c.req.param('id'), data)
    return c.json(success(role, '更新成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

role.delete('/:id', permissionMiddleware('system:role:delete'), async (c) => {
  try {
    await roleService.delete(c.req.param('id'))
    return c.json(success(null, '删除成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

role.post('/batch-delete', permissionMiddleware('system:role:delete'), zValidator('json', batchDeleteRoleSchema), async (c) => {
  try {
    const { ids } = c.req.valid('json')
    await roleService.batchDelete(ids)
    return c.json(success(null, '批量删除成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

export default role
