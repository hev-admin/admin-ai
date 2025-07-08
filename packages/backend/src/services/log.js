import prisma from '../config/database.js'

export const logService = {
  async create(data) {
    return prisma.operationLog.create({ data })
  },

  async getList(page = 1, pageSize = 20, filters = {}) {
    const where = {}
    if (filters.module)
      where.module = filters.module
    if (filters.username)
      where.username = { contains: filters.username }

    const [list, total] = await Promise.all([
      prisma.operationLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.operationLog.count({ where }),
    ])

    return { list, total }
  },
}
