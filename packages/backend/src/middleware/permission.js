import prisma from '../config/database.js'

export function permissionMiddleware(requiredPermission) {
  return async (c, next) => {
    const userId = c.get('userId')

    if (!userId) {
      return c.json({ code: 401, message: '未登录' }, 401)
    }

    // 获取用户权限
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: { include: { menu: true } },
          },
        },
      },
    })

    const permissions = new Set()
    userRoles.forEach((ur) => {
      ur.role.permissions.forEach((p) => {
        if (p.menu.permission) {
          permissions.add(p.menu.permission)
        }
      })
    })

    // 检查权限
    const hasPermission = Array.isArray(requiredPermission)
      ? requiredPermission.some(p => permissions.has(p))
      : permissions.has(requiredPermission)

    if (!hasPermission) {
      return c.json({ code: 403, message: '没有操作权限' }, 403)
    }

    await next()
  }
}
