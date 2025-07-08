import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { userService } from '../services/user.js'
import { error, paginate, success } from '../utils/response.js'

const user = new Hono()

user.use('*', authMiddleware())

user.get('/', async (c) => {
  const { page = 1, pageSize = 10, keyword = '' } = c.req.query()
  const { list, total } = await userService.getList(
    Number(page),
    Number(pageSize),
    keyword,
  )
  return c.json(paginate(list, Number(page), Number(pageSize), total))
})

user.get('/:id', async (c) => {
  const user = await userService.getById(c.req.param('id'))
  return user ? c.json(success(user)) : c.json(error('用户不存在'), 404)
})

user.post('/', async (c) => {
  try {
    const data = await c.req.json()
    const user = await userService.create(data)
    return c.json(success(user, '创建成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

user.put('/:id', async (c) => {
  try {
    const data = await c.req.json()
    const user = await userService.update(c.req.param('id'), data)
    return c.json(success(user, '更新成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

user.delete('/:id', async (c) => {
  try {
    await userService.delete(c.req.param('id'))
    return c.json(success(null, '删除成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

user.post('/batch-delete', async (c) => {
  try {
    const { ids } = await c.req.json()
    if (!ids || !ids.length) {
      return c.json(error('请选择要删除的用户'), 400)
    }
    await userService.batchDelete(ids)
    return c.json(success(null, '批量删除成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

export default user
