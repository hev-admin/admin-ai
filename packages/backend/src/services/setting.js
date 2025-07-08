import prisma from '../config/database.js'

export const settingService = {
  async getAll() {
    return prisma.setting.findMany()
  },

  async getByGroup(group) {
    return prisma.setting.findMany({ where: { group } })
  },

  async get(key) {
    return prisma.setting.findUnique({ where: { key } })
  },

  async set(key, value, group = 'system') {
    return prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value, group },
    })
  },

  async batchSet(settings) {
    const ops = settings.map(s =>
      prisma.setting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value, group: s.group || 'system' },
      }),
    )
    return prisma.$transaction(ops)
  },
}
