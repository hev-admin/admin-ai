import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { roleService } from '../services/role.js'
import { error, paginate, success } from '../utils/response.js'

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

role.post('/', async (c) => {
  try {
    const data = await c.req.json()
    const role = await roleService.create(data)
    return c.json(success(role, '创建成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

role.put('/:id', async (c) => {
  try {
    const data = await c.req.json()
    const role = await roleService.update(c.req.param('id'), data)
    return c.json(success(role, '更新成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

role.delete('/:id', async (c) => {
  try {
    await roleService.delete(c.req.param('id'))
    return c.json(success(null, '删除成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

role.post('/batch-delete', async (c) => {
  try {
    const { ids } = await c.req.json()
    if (!ids || !ids.length) {
      return c.json(error('请选择要删除的角色'), 400)
    }
    await roleService.batchDelete(ids)
    return c.json(success(null, '批量删除成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

export default role
