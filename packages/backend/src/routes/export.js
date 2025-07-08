import { Hono } from 'hono'
import prisma from '../config/database.js'
import { authMiddleware } from '../middleware/auth.js'
import { error, success } from '../utils/response.js'

const exportRoute = new Hono()

exportRoute.use('*', authMiddleware())

// 导出用户数据
exportRoute.get('/users', async (c) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        phone: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return c.json(success(users))
  }
  catch (e) {
    return c.json(error(e.message), 500)
  }
})

// 导出角色数据
exportRoute.get('/roles', async (c) => {
  try {
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        status: true,
        sort: true,
      },
      orderBy: { sort: 'asc' },
    })
    return c.json(success(roles))
  }
  catch (e) {
    return c.json(error(e.message), 500)
  }
})

// 导出菜单数据
exportRoute.get('/menus', async (c) => {
  try {
    const menus = await prisma.menu.findMany({
      orderBy: { sort: 'asc' },
    })
    return c.json(success(menus))
  }
  catch (e) {
    return c.json(error(e.message), 500)
  }
})

export default exportRoute
