import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { permissionMiddleware } from '../middleware/permission.js'
import { userService } from '../services/user.js'
import { error, paginate, success } from '../utils/response.js'
import { batchDeleteSchema, createUserSchema, listQuerySchema, updateUserSchema } from '../validators/user.js'

const user = new Hono()

user.use('*', authMiddleware())

user.get('/', zValidator('query', listQuerySchema), async (c) => {
  const { page, pageSize, keyword } = c.req.valid('query')
  const { list, total } = await userService.getList(page, pageSize, keyword)
  return c.json(paginate(list, page, pageSize, total))
})

user.get('/:id', async (c) => {
  const user = await userService.getById(c.req.param('id'))
  return user ? c.json(success(user)) : c.json(error('用户不存在'), 404)
})

user.post('/', permissionMiddleware('system:user:create'), zValidator('json', createUserSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    const user = await userService.create(data)
    return c.json(success(user, '创建成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

user.put('/:id', permissionMiddleware('system:user:update'), zValidator('json', updateUserSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    const user = await userService.update(c.req.param('id'), data)
    return c.json(success(user, '更新成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

user.delete('/:id', permissionMiddleware('system:user:delete'), async (c) => {
  try {
    await userService.delete(c.req.param('id'))
    return c.json(success(null, '删除成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

user.post('/batch-delete', permissionMiddleware('system:user:delete'), zValidator('json', batchDeleteSchema), async (c) => {
  try {
    const { ids } = c.req.valid('json')
    await userService.batchDelete(ids)
    return c.json(success(null, '批量删除成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

export default user
