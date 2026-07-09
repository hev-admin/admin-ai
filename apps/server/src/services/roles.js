import { SUPER_ROLE_CODE } from '../constants.js'
import { menuRepo, roleRepo, userRepo } from '../repositories/index.js'
import { AppError } from '../utils/errors.js'

async function getRoleOrThrow(id) {
  const role = await roleRepo.getById(id)
  if (!role)
    throw new AppError(404, '角色不存在')
  return role
}

async function assertMenusExist(menuIds) {
  if (!menuIds?.length)
    return
  const found = await menuRepo.findMany({ id: menuIds })
  if (found.length !== new Set(menuIds).size)
    throw new AppError(400, '存在无效的菜单节点')
}

export function listRoles({ page, pageSize, name, code }) {
  return roleRepo.findPage({ page, pageSize, where: { name, code } })
}

export async function createRole({ menuIds = [], ...data }) {
  if (await roleRepo.findByUnique('code', data.code))
    throw new AppError(400, '角色标识已存在')
  await assertMenusExist(menuIds)
  return roleRepo.create({ ...data, menuIds })
}

export async function updateRole(id, { menuIds, ...data }) {
  const role = await getRoleOrThrow(id)
  if (data.code !== undefined && data.code !== role.code) {
    // super 是权限短路的语义锚点（§4.5），改标识会导致超管失效，内置保护
    if (role.code === SUPER_ROLE_CODE)
      throw new AppError(400, '内置超级管理员角色的标识不可修改')
    if (await roleRepo.findByUnique('code', data.code))
      throw new AppError(400, '角色标识已存在')
  }
  if (menuIds !== undefined)
    await assertMenusExist(menuIds)
  return roleRepo.update(id, { ...data, menuIds })
}

/** 删除前校验用户占用（REQUIREMENTS §6 基础数据完整性；super 角色天然被 super 账号占用而不可删） */
export async function removeRole(id) {
  await getRoleOrThrow(id)
  const occupied = await userRepo.count({ roleIds: id })
  if (occupied > 0)
    throw new AppError(400, `角色已被 ${occupied} 个用户占用，无法删除`)
  await roleRepo.remove(id)
}

/** 分配权限：整体重设角色的菜单勾选集合（含按钮节点，§5.2） */
export async function assignRoleMenus(id, menuIds) {
  await getRoleOrThrow(id)
  await assertMenusExist(menuIds)
  return roleRepo.update(id, { menuIds })
}
