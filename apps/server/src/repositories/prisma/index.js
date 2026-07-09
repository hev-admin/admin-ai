import { createPrismaRepo } from './base.js'

// Prisma 实现（关系库：SQLite / PostgreSQL / MySQL，REQUIREMENTS §6）。
// fuzzyFields / relations 声明是契约的一部分，M4 Mongo 实现需保持一致。

export const userRepo = createPrismaRepo('user', {
  fuzzyFields: ['username', 'nickname', 'email'],
  relations: { roleIds: 'roles' },
})

export const roleRepo = createPrismaRepo('role', {
  fuzzyFields: ['name', 'code'],
  relations: { menuIds: 'menus' },
})

export const menuRepo = createPrismaRepo('menu', {
  fuzzyFields: ['name'],
})
