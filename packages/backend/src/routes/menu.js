import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { menuService } from '../services/menu.js'
import { error, success } from '../utils/response.js'

const menu = new Hono()

menu.use('*', authMiddleware())

// 获取用户菜单（根据权限过滤）
menu.get('/user', async (c) => {
  const userId = c.get('userId')
  const menus = await menuService.getUserMenus(userId)
  return c.json(success(menus))
})

// 获取用户权限标识
menu.get('/permissions', async (c) => {
  const userId = c.get('userId')
  const permissions = await menuService.getUserPermissions(userId)
  return c.json(success(permissions))
})

menu.get('/', async (c) => {
  const tree = await menuService.getTree()
  return c.json(success(tree))
})

menu.get('/list', async (c) => {
  const list = await menuService.getList()
  return c.json(success(list))
})

menu.get('/:id', async (c) => {
  const menu = await menuService.getById(c.req.param('id'))
  return menu ? c.json(success(menu)) : c.json(error('菜单不存在'), 404)
})

menu.post('/', async (c) => {
  try {
    const data = await c.req.json()
    const menu = await menuService.create(data)
    return c.json(success(menu, '创建成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

menu.put('/:id', async (c) => {
  try {
    const data = await c.req.json()
    const menu = await menuService.update(c.req.param('id'), data)
    return c.json(success(menu, '更新成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

menu.delete('/:id', async (c) => {
  try {
    await menuService.delete(c.req.param('id'))
    return c.json(success(null, '删除成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

menu.post('/batch-delete', async (c) => {
  try {
    const { ids } = await c.req.json()
    if (!ids || !ids.length) {
      return c.json(error('请选择要删除的菜单'), 400)
    }
    await menuService.batchDelete(ids)
    return c.json(success(null, '批量删除成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

export default menu
