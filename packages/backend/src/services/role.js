import prisma from '../config/database.js'

export const roleService = {
  async getList(page = 1, pageSize = 10) {
    const [list, total] = await Promise.all([
      prisma.role.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { sort: 'asc' },
      }),
      prisma.role.count(),
    ])
    return { list, total }
  },

  async getAll() {
    return prisma.role.findMany({
      where: { status: 1 },
      orderBy: { sort: 'asc' },
    })
  },

  async getById(id) {
    return prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { menu: true } } },
    })
  },

  async create(data) {
    const { menuIds, ...rest } = data
    return prisma.role.create({
      data: {
        ...rest,
        permissions: menuIds?.length
          ? { create: menuIds.map(menuId => ({ menuId })) }
          : undefined,
      },
    })
  },

  async update(id, data) {
    const { menuIds, ...rest } = data
    if (menuIds) {
      await prisma.rolePermission.deleteMany({ where: { roleId: id } })
      await prisma.rolePermission.createMany({
        data: menuIds.map(menuId => ({ roleId: id, menuId })),
      })
    }
    return prisma.role.update({ where: { id }, data: rest })
  },

  async delete(id) {
    return prisma.role.delete({ where: { id } })
  },

  async batchDelete(ids) {
    return prisma.role.deleteMany({ where: { id: { in: ids } } })
  },
}
