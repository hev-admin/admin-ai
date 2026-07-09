import { Hono } from 'hono'
import { z } from 'zod'
import { MENU_TYPE } from '../constants.js'
import { requirePermission } from '../middlewares/permission.js'
import { createMenu, getMenuTree, removeMenu, updateMenu } from '../services/menus.js'
import { ok } from '../utils/response.js'
import { emptyToNull } from '../utils/schema.js'
import { validate } from '../utils/validate.js'

// 创建与更新共用一套 schema：菜单表单按完整提交语义处理（空值即清空）
const menuBodySchema = z.object({
  parentId: z.preprocess(emptyToNull, z.string().nullable()),
  type: z.union([z.literal(MENU_TYPE.dir), z.literal(MENU_TYPE.menu), z.literal(MENU_TYPE.button)]),
  name: z.string().min(1, '名称不能为空').max(64),
  path: z.preprocess(emptyToNull, z.string().max(128).nullable()),
  component: z.preprocess(emptyToNull, z.string().max(128).nullable()),
  icon: z.preprocess(emptyToNull, z.string().max(64).nullable()),
  permission: z.preprocess(emptyToNull, z.string().max(64).nullable()),
  sort: z.number().int().default(0),
  hidden: z.boolean().default(false),
  keepAlive: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.type !== MENU_TYPE.button && !data.path)
    ctx.addIssue({ code: 'custom', path: ['path'], message: '目录 / 菜单必须填写路由路径' })
  if (data.type === MENU_TYPE.button && !data.permission)
    ctx.addIssue({ code: 'custom', path: ['permission'], message: '按钮类型必须填写权限码' })
})

export const menusRoutes = new Hono()

// 树形查询：含按钮节点的完整树，供菜单管理与角色分配权限使用
menusRoutes.get('/', requirePermission('sys:menu:list'), async (c) => {
  return ok(c, await getMenuTree())
})

menusRoutes.post('/', requirePermission('sys:menu:add'), validate('json', menuBodySchema), async (c) => {
  return ok(c, await createMenu(c.req.valid('json')), '创建成功')
})

menusRoutes.put('/:id', requirePermission('sys:menu:edit'), validate('json', menuBodySchema), async (c) => {
  return ok(c, await updateMenu(c.req.param('id'), c.req.valid('json')), '保存成功')
})

menusRoutes.delete('/:id', requirePermission('sys:menu:delete'), async (c) => {
  return ok(c, await removeMenu(c.req.param('id')), '删除成功')
})
