import prisma from '../config/database.js'

export const logService = {
  async create(data) {
    return prisma.operationLog.create({ data })
  },

  async getList(page = 1, pageSize = 20, filters = {}, sort = {}) {
    const where = {}
    if (filters.module)
      where.module = filters.module
    if (filters.username)
      where.username = { contains: filters.username }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate)
        where.createdAt.gte = new Date(filters.startDate)
      if (filters.endDate)
        where.createdAt.lte = new Date(filters.endDate)
    }

    const allowedSortFields = ['createdAt', 'duration', 'module', 'action']
    const sortField = allowedSortFields.includes(sort.field) ? sort.field : 'createdAt'
    const sortOrder = sort.order === 'asc' ? 'asc' : 'desc'

    const [list, total] = await Promise.all([
      prisma.operationLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortField]: sortOrder },
      }),
      prisma.operationLog.count({ where }),
    ])

    return { list, total }
  },

  async getStats() {
    const [total, todayCount] = await Promise.all([
      prisma.operationLog.count(),
      prisma.operationLog.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ])

    return { total, todayCount }
  },
}
