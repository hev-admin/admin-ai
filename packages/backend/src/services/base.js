import prisma from '../config/database.js'

/**
 * Base CRUD service factory
 * Creates a service with common CRUD operations for a given Prisma model
 *
 * @param {string} modelName - The name of the Prisma model
 * @param {object} options - Configuration options
 * @param {object} options.defaultSelect - Fields to select by default
 * @param {object} options.defaultInclude - Relations to include by default
 * @param {object} options.defaultOrderBy - Default ordering
 * @param {Array<string>} options.searchFields - Fields to search in for keyword filtering
 */
export function createBaseService(modelName, options = {}) {
  const model = prisma[modelName]

  if (!model) {
    throw new Error(`Model "${modelName}" not found in Prisma client`)
  }

  const {
    defaultSelect = undefined,
    defaultInclude = undefined,
    defaultOrderBy = { createdAt: 'desc' },
    searchFields = [],
  } = options

  return {
    /**
     * Get paginated list with optional keyword search
     */
    async getList(page = 1, pageSize = 10, keyword = '', additionalWhere = {}) {
      const skip = (page - 1) * pageSize

      const where = { ...additionalWhere }

      // Add keyword search if provided and searchFields are defined
      if (keyword && searchFields.length > 0) {
        where.OR = searchFields.map(field => ({
          [field]: { contains: keyword },
        }))
      }

      const [list, total] = await Promise.all([
        model.findMany({
          where,
          skip,
          take: pageSize,
          select: defaultSelect,
          include: defaultSelect ? undefined : defaultInclude,
          orderBy: defaultOrderBy,
        }),
        model.count({ where }),
      ])

      return { list, total }
    },

    /**
     * Get all records (no pagination)
     */
    async getAll(where = {}) {
      return model.findMany({
        where,
        select: defaultSelect,
        include: defaultSelect ? undefined : defaultInclude,
        orderBy: defaultOrderBy,
      })
    },

    /**
     * Get single record by ID
     */
    async getById(id) {
      return model.findUnique({
        where: { id },
        select: defaultSelect,
        include: defaultSelect ? undefined : defaultInclude,
      })
    },

    /**
     * Get single record by condition
     */
    async getOne(where) {
      return model.findFirst({
        where,
        select: defaultSelect,
        include: defaultSelect ? undefined : defaultInclude,
      })
    },

    /**
     * Create a new record
     */
    async create(data) {
      return model.create({
        data,
        select: defaultSelect,
        include: defaultSelect ? undefined : defaultInclude,
      })
    },

    /**
     * Update a record by ID
     */
    async update(id, data) {
      return model.update({
        where: { id },
        data,
        select: defaultSelect,
        include: defaultSelect ? undefined : defaultInclude,
      })
    },

    /**
     * Update records by condition
     */
    async updateMany(where, data) {
      return model.updateMany({ where, data })
    },

    /**
     * Delete a record by ID
     */
    async delete(id) {
      return model.delete({ where: { id } })
    },

    /**
     * Delete multiple records by IDs
     */
    async batchDelete(ids) {
      return model.deleteMany({
        where: { id: { in: ids } },
      })
    },

    /**
     * Delete records by condition
     */
    async deleteMany(where) {
      return model.deleteMany({ where })
    },

    /**
     * Check if record exists
     */
    async exists(where) {
      const count = await model.count({ where })
      return count > 0
    },

    /**
     * Count records
     */
    async count(where = {}) {
      return model.count({ where })
    },

    /**
     * Execute a transaction
     */
    async transaction(fn) {
      return prisma.$transaction(fn)
    },

    /**
     * Get raw Prisma model for custom operations
     */
    get model() {
      return model
    },
  }
}
