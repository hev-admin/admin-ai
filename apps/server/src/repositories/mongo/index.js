import { createMongoRepo } from './base.js'

// Mongo 实现（官方 mongodb 驱动直连，REQUIREMENTS §6）。
// fuzzyFields 声明与 prisma 实现保持一致（契约的一部分）；关联以 id 字符串数组
// 存储（User.roleIds / Role.menuIds，§4.4），标量匹配即包含语义、data 直传即整体重设，
// 无需额外关联声明；removeCleanups 对齐 Prisma 隐式多对多随实体删除的自动清理。

export const userRepo = createMongoRepo('users', {
  fuzzyFields: ['username', 'nickname', 'email'],
})

export const roleRepo = createMongoRepo('roles', {
  fuzzyFields: ['name', 'code'],
  removeCleanups: [{ collection: 'users', field: 'roleIds' }],
})

export const menuRepo = createMongoRepo('menus', {
  fuzzyFields: ['name'],
  removeCleanups: [{ collection: 'roles', field: 'menuIds' }],
})
