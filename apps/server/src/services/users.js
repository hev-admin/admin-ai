import bcrypt from 'bcryptjs'
import { USER_STATUS } from '../constants.js'
import { roleRepo, userRepo } from '../repositories/index.js'
import { AppError } from '../utils/errors.js'

/** 用户实体出站前统一脱敏（password 不返回给前端，REQUIREMENTS §4.4） */
function sanitize(user) {
  const { password: _password, ...safe } = user
  return safe
}

async function assertRolesExist(roleIds) {
  if (!roleIds?.length)
    return
  const found = await roleRepo.findMany({ id: roleIds })
  if (found.length !== new Set(roleIds).size)
    throw new AppError(400, '存在无效的角色')
}

async function getUserOrThrow(id) {
  const user = await userRepo.getById(id)
  if (!user)
    throw new AppError(404, '用户不存在')
  return user
}

/** 分页查询 + 角色明细内存拼装（§4.5 装配约定：关联读取不进 repository） */
export async function listUsers({ page, pageSize, username, status }) {
  const { list, total } = await userRepo.findPage({ page, pageSize, where: { username, status } })
  const roleIds = [...new Set(list.flatMap(user => user.roleIds))]
  const roles = roleIds.length ? await roleRepo.findMany({ id: roleIds }) : []
  const roleById = new Map(roles.map(role => [role.id, { id: role.id, name: role.name, code: role.code }]))
  return {
    list: list.map(user => ({
      ...sanitize(user),
      roles: user.roleIds.map(id => roleById.get(id)).filter(Boolean),
    })),
    total,
  }
}

export async function createUser({ password, roleIds = [], ...data }) {
  if (await userRepo.findByUnique('username', data.username))
    throw new AppError(400, '用户名已存在')
  await assertRolesExist(roleIds)
  const user = await userRepo.create({ ...data, password: bcrypt.hashSync(password, 10), roleIds })
  return sanitize(user)
}

export async function updateUser(id, { roleIds, ...data }) {
  await getUserOrThrow(id)
  if (roleIds !== undefined)
    await assertRolesExist(roleIds)
  const user = await userRepo.update(id, { ...data, roleIds })
  return sanitize(user)
}

export async function removeUser(id, currentUserId) {
  if (id === currentUserId)
    throw new AppError(400, '不能删除当前登录账号')
  await getUserOrThrow(id)
  await userRepo.remove(id)
}

/** 批量删除：静默过滤当前登录账号（M2 规划决策点 5），全部被过滤时报错 */
export async function removeUsers(ids, currentUserId) {
  const targets = [...new Set(ids)].filter(id => id !== currentUserId)
  if (!targets.length)
    throw new AppError(400, '不能删除当前登录账号')
  let removed = 0
  for (const id of targets) {
    if (await userRepo.remove(id))
      removed += 1
  }
  return { removed }
}

export async function setUserStatus(id, status, currentUserId) {
  if (id === currentUserId && status === USER_STATUS.disabled)
    throw new AppError(400, '不能禁用当前登录账号')
  await getUserOrThrow(id)
  const user = await userRepo.update(id, { status })
  return sanitize(user)
}

export async function resetUserPassword(id, password) {
  await getUserOrThrow(id)
  await userRepo.update(id, { password: bcrypt.hashSync(password, 10) })
}

export async function assignUserRoles(id, roleIds) {
  await getUserOrThrow(id)
  await assertRolesExist(roleIds)
  const user = await userRepo.update(id, { roleIds })
  return sanitize(user)
}
