import bcrypt from 'bcryptjs'
import prisma from '../config/database.js'

export const userService = {
  async getList(page = 1, pageSize = 10, keyword = '') {
    const where = keyword
      ? {
          OR: [
            { username: { contains: keyword } },
            { email: { contains: keyword } },
            { nickname: { contains: keyword } },
          ],
        }
      : {}

    const [list, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          username: true,
          email: true,
          nickname: true,
          avatar: true,
          phone: true,
          status: true,
          createdAt: true,
          roles: { include: { role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ])

    return { list, total }
  },

  async getById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    })
  },

  async create(data) {
    const { roleIds, password, ...rest } = data
    const hashedPassword = await bcrypt.hash(password, 12)

    return prisma.user.create({
      data: {
        ...rest,
        password: hashedPassword,
        roles: roleIds?.length
          ? { create: roleIds.map(roleId => ({ roleId })) }
          : undefined,
      },
    })
  },

  async update(id, data) {
    const { roleIds, ...rest } = data

    if (roleIds) {
      await prisma.userRole.deleteMany({ where: { userId: id } })
      await prisma.userRole.createMany({
        data: roleIds.map(roleId => ({ userId: id, roleId })),
      })
    }

    return prisma.user.update({ where: { id }, data: rest })
  },

  async delete(id) {
    return prisma.user.delete({ where: { id } })
  },

  async batchDelete(ids) {
    return prisma.user.deleteMany({ where: { id: { in: ids } } })
  },
}
