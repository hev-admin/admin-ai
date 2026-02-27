import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { permissionMiddleware } from '../middleware/permission.js'
import { menuService } from '../services/menu.js'
import { error, success } from '../utils/response.js'
import { batchDeleteMenuSchema, createMenuSchema, updateMenuSchema } from '../validators/menu.js'

const menu = new Hono()

menu.use('*', authMiddleware())

// 获取用户菜单（根据权限过滤）
menu.get('/user', async (c) => {
  const { userId } = c.get('user')
  const menus = await menuService.getUserMenus(userId)
  return c.json(success(menus))
})

// 获取用户权限标识
menu.get('/permissions', async (c) => {
  const { userId } = c.get('user')
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

menu.post('/', permissionMiddleware('system:menu:create'), zValidator('json', createMenuSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    const menu = await menuService.create(data)
    return c.json(success(menu, '创建成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

menu.put('/:id', permissionMiddleware('system:menu:update'), zValidator('json', updateMenuSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    const menu = await menuService.update(c.req.param('id'), data)
    return c.json(success(menu, '更新成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

menu.delete('/:id', permissionMiddleware('system:menu:delete'), async (c) => {
  try {
    await menuService.delete(c.req.param('id'))
    return c.json(success(null, '删除成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

menu.post('/batch-delete', permissionMiddleware('system:menu:delete'), zValidator('json', batchDeleteMenuSchema), async (c) => {
  try {
    const { ids } = c.req.valid('json')
    await menuService.batchDelete(ids)
    return c.json(success(null, '批量删除成功'))
  }
  catch (e) {
    return c.json(error(e.message), 400)
  }
})

export default menu
