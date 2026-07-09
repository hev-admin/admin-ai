import bcrypt from 'bcryptjs'
import { MENU_TYPE, SUPER_ROLE_CODE } from '../constants.js'
import { menuRepo, roleRepo, userRepo } from '../repositories/index.js'
import { AppError } from '../utils/errors.js'
import { buildTree } from '../utils/tree.js'

const MENU_ORDER = [{ field: 'sort', order: 'asc' }, { field: 'createdAt', order: 'asc' }]

export function findUserByUsername(username) {
  return userRepo.findByUnique('username', username)
}

/**
 * 用户信息聚合（REQUIREMENTS §4.5）：多次 repository 调用 + 内存拼装，不依赖数据库 join——
 * roles 取角色 code；menuTree 取目录/菜单节点去重组树（hidden 节点保留，前端渲染时再判断）；
 * permissions 取按钮节点权限码去重；超级管理员短路为全部菜单 + 全部按钮码。
 */
export async function getUserInfo(userId) {
  const user = await userRepo.getById(userId)
  if (!user)
    return null

  const roles = await roleRepo.findMany({ id: user.roleIds })
  const menus = await findMenusByRoles(roles)
  const menuTree = buildTree(menus.filter(menu => menu.type !== MENU_TYPE.button))
  const permissions = [...new Set(
    menus
      .filter(menu => menu.type === MENU_TYPE.button && menu.permission)
      .map(menu => menu.permission),
  )]

  const { password: _password, roleIds: _roleIds, ...profile } = user
  return {
    user: profile,
    roles: roles.map(role => role.code),
    menus: menuTree,
    permissions,
  }
}

async function findMenusByRoles(roles) {
  if (roles.some(role => role.code === SUPER_ROLE_CODE))
    return menuRepo.findMany({}, MENU_ORDER)

  const menuIds = [...new Set(roles.flatMap(role => role.menuIds))]
  if (!menuIds.length)
    return []
  return menuRepo.findMany({ id: menuIds }, MENU_ORDER)
}

/** 个人资料修改（REQUIREMENTS §5.3 / #24）：仅昵称/邮箱/头像，返回脱敏后的资料 */
export async function updateProfile(userId, data) {
  const user = await userRepo.update(userId, data)
  if (!user)
    throw new AppError(404, '用户不存在')
  const { password: _password, roleIds: _roleIds, ...profile } = user
  return profile
}

/**
 * 修改密码（§5.3 / #24）：旧密码校验通过后更新哈希。无状态 JWT 的旧 token
 * 至自然过期前仍有效（M3 决策点 7），前端在成功后强制重登。
 */
export async function changePassword(userId, oldPassword, password) {
  const user = await userRepo.getById(userId)
  if (!user)
    throw new AppError(404, '用户不存在')
  if (!bcrypt.compareSync(oldPassword, user.password))
    throw new AppError(400, '旧密码不正确')
  await userRepo.update(userId, { password: bcrypt.hashSync(password, 10) })
}
