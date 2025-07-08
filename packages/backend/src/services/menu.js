import prisma from '../config/database.js'
import { cache, cacheKeys, cacheTTL } from '../utils/cache.js'

export const menuService = {
  async getTree() {
    return cache.getOrSet(
      cacheKeys.menuTree(),
      async () => {
        const menus = await prisma.menu.findMany({
          select: {
            id: true,
            parentId: true,
            name: true,
            path: true,
            component: true,
            redirect: true,
            icon: true,
            title: true,
            permission: true,
            type: true,
            visible: true,
            status: true,
            sort: true,
            keepAlive: true,
            external: true,
          },
          orderBy: { sort: 'asc' },
        })
        return buildTree(menus)
      },
      cacheTTL.MEDIUM,
    )
  },

  async getList() {
    return prisma.menu.findMany({
      select: {
        id: true,
        parentId: true,
        name: true,
        path: true,
        component: true,
        redirect: true,
        icon: true,
        title: true,
        permission: true,
        type: true,
        visible: true,
        status: true,
        sort: true,
        keepAlive: true,
        external: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { sort: 'asc' },
    })
  },

  async getById(id) {
    return prisma.menu.findUnique({ where: { id } })
  },

  async create(data) {
    const menu = await prisma.menu.create({ data })
    // Invalidate cache
    cache.deletePattern('menu:*')
    cache.deletePattern('user:*:menus')
    return menu
  },

  async update(id, data) {
    const menu = await prisma.menu.update({ where: { id }, data })
    // Invalidate cache
    cache.deletePattern('menu:*')
    cache.deletePattern('user:*:menus')
    cache.deletePattern('user:*:permissions')
    return menu
  },

  async delete(id) {
    const menu = await prisma.menu.delete({ where: { id } })
    // Invalidate cache
    cache.deletePattern('menu:*')
    cache.deletePattern('user:*:menus')
    cache.deletePattern('user:*:permissions')
    return menu
  },

  async batchDelete(ids) {
    const result = await prisma.menu.deleteMany({ where: { id: { in: ids } } })
    // Invalidate cache
    cache.deletePattern('menu:*')
    cache.deletePattern('user:*:menus')
    cache.deletePattern('user:*:permissions')
    return result
  },

  // 获取用户菜单（根据角色权限过滤）
  async getUserMenus(userId) {
    return cache.getOrSet(
      cacheKeys.userMenus(userId),
      async () => {
        // 获取用户的所有角色和菜单ID，使用单个优化查询
        const userRoles = await prisma.userRole.findMany({
          where: { userId },
          select: {
            role: {
              select: {
                permissions: {
                  select: { menuId: true },
                },
              },
            },
          },
        })

        // 收集所有菜单ID
        const menuIds = new Set()
        userRoles.forEach((ur) => {
          ur.role.permissions.forEach((p) => {
            menuIds.add(p.menuId)
          })
        })

        if (menuIds.size === 0) {
          return []
        }

        // 获取菜单详情
        const menus = await prisma.menu.findMany({
          where: {
            id: { in: Array.from(menuIds) },
            status: 1,
            visible: 1,
          },
          select: {
            id: true,
            parentId: true,
            name: true,
            path: true,
            component: true,
            redirect: true,
            icon: true,
            title: true,
            permission: true,
            type: true,
            visible: true,
            status: true,
            sort: true,
            keepAlive: true,
            external: true,
          },
          orderBy: { sort: 'asc' },
        })

        return buildTree(menus)
      },
      cacheTTL.MEDIUM,
    )
  },

  // 获取用户权限标识列表
  async getUserPermissions(userId) {
    return cache.getOrSet(
      cacheKeys.userPermissions(userId),
      async () => {
        const userRoles = await prisma.userRole.findMany({
          where: { userId },
          select: {
            role: {
              select: {
                permissions: {
                  select: {
                    menu: {
                      select: { permission: true },
                    },
                  },
                },
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
      cacheTTL.MEDIUM,
    )
  },

  // Invalidate user-specific cache (call when user roles change)
  invalidateUserCache(userId) {
    cache.delete(cacheKeys.userMenus(userId))
    cache.delete(cacheKeys.userPermissions(userId))
  },
}

function buildTree(menus, parentId = null) {
  return menus
    .filter(m => m.parentId === parentId)
    .map(m => ({ ...m, children: buildTree(menus, m.id) }))
}
