import { menuRepo } from '../repositories/index.js'
import { AppError } from '../utils/errors.js'
import { buildTree } from '../utils/tree.js'

const MENU_ORDER = [{ field: 'sort', order: 'asc' }, { field: 'createdAt', order: 'asc' }]

async function getMenuOrThrow(id) {
  const menu = await menuRepo.getById(id)
  if (!menu)
    throw new AppError(404, '菜单不存在')
  return menu
}

/** 以 id 建子节点索引，供级联删除与环校验遍历 */
function buildChildrenMap(menus) {
  const childrenMap = new Map()
  for (const menu of menus) {
    if (!menu.parentId)
      continue
    if (!childrenMap.has(menu.parentId))
      childrenMap.set(menu.parentId, [])
    childrenMap.get(menu.parentId).push(menu)
  }
  return childrenMap
}

async function collectDescendantIds(id) {
  const childrenMap = buildChildrenMap(await menuRepo.findMany())
  const ids = []
  const stack = [id]
  while (stack.length) {
    const current = stack.pop()
    for (const child of childrenMap.get(current) ?? []) {
      ids.push(child.id)
      stack.push(child.id)
    }
  }
  return ids
}

/** 管理端树形查询：含按钮节点的完整树（getUserInfo 的路由树才过滤按钮） */
export async function getMenuTree() {
  const menus = await menuRepo.findMany({}, MENU_ORDER)
  return buildTree(menus)
}

export async function createMenu(data) {
  if (data.parentId && !(await menuRepo.getById(data.parentId)))
    throw new AppError(400, '父节点不存在')
  return menuRepo.create(data)
}

export async function updateMenu(id, data) {
  await getMenuOrThrow(id)
  if (data.parentId) {
    if (data.parentId === id)
      throw new AppError(400, '父节点不能是自身')
    if (!(await menuRepo.getById(data.parentId)))
      throw new AppError(400, '父节点不存在')
    // 移入自己的子树会让该分支从根上脱落（环），必须拒绝
    if ((await collectDescendantIds(id)).includes(data.parentId))
      throw new AppError(400, '父节点不能是自身的子节点')
  }
  return menuRepo.update(id, data)
}

/** 级联删除全部子孙节点（M2 规划决策点 4）；隐式多对多的角色关联随实体删除自动清理 */
export async function removeMenu(id) {
  await getMenuOrThrow(id)
  const ids = [id, ...await collectDescendantIds(id)]
  for (const menuId of ids)
    await menuRepo.remove(menuId)
  return { removed: ids.length }
}
