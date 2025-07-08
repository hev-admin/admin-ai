import prisma from '../config/database.js'

export const menuService = {
  async getTree() {
    const menus = await prisma.menu.findMany({
      orderBy: { sort: 'asc' },
    })
    return buildTree(menus)
  },

  async getList() {
    return prisma.menu.findMany({ orderBy: { sort: 'asc' } })
  },

  async getById(id) {
    return prisma.menu.findUnique({ where: { id } })
  },

  async create(data) {
    return prisma.menu.create({ data })
  },

  async update(id, data) {
    return prisma.menu.update({ where: { id }, data })
  },

  async delete(id) {
    return prisma.menu.delete({ where: { id } })
  },

  async batchDelete(ids) {
    return prisma.menu.deleteMany({ where: { id: { in: ids } } })
  },

  // 获取用户菜单（根据角色权限过滤）
  async getUserMenus(userId) {
    // 获取用户的所有角色
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { permissions: true } } },
    })

    // 收集所有菜单ID
    const menuIds = new Set()
    userRoles.forEach((ur) => {
      ur.role.permissions.forEach((p) => {
        menuIds.add(p.menuId)
      })
    })

    // 获取菜单详情
    const menus = await prisma.menu.findMany({
      where: {
        id: { in: Array.from(menuIds) },
        status: 1,
        visible: 1,
      },
      orderBy: { sort: 'asc' },
    })

    return buildTree(menus)
  },

  // 获取用户权限标识列表
  async getUserPermissions(userId) {
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

    return Array.from(permissions)
  },
}

function buildTree(menus, parentId = null) {
  return menus
    .filter(m => m.parentId === parentId)
    .map(m => ({ ...m, children: buildTree(menus, m.id) }))
}
