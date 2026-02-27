import { z } from 'zod'

export const createMenuSchema = z.object({
  parentId: z.string()
    .optional()
    .nullable(),
  name: z.string()
    .min(1, '菜单名称不能为空')
    .max(50, '菜单名称不能超过50个字符'),
  path: z.string()
    .max(200, '路径不能超过200个字符')
    .optional()
    .nullable(),
  component: z.string()
    .max(200, '组件路径不能超过200个字符')
    .optional()
    .nullable(),
  redirect: z.string()
    .max(200, '重定向路径不能超过200个字符')
    .optional()
    .nullable(),
  icon: z.string()
    .max(100, '图标名称不能超过100个字符')
    .optional()
    .nullable(),
  title: z.string()
    .max(50, '标题不能超过50个字符')
    .optional()
    .nullable(),
  permission: z.string()
    .max(100, '权限标识不能超过100个字符')
    .optional()
    .nullable(),
  type: z.number()
    .int()
    .min(0)
    .max(2)
    .optional()
    .default(0),
  visible: z.number()
    .int()
    .min(0)
    .max(1)
    .optional()
    .default(1),
  status: z.number()
    .int()
    .min(0)
    .max(1)
    .optional()
    .default(1),
  sort: z.number()
    .int()
    .min(0)
    .optional()
    .default(0),
  keepAlive: z.number()
    .int()
    .min(0)
    .max(1)
    .optional()
    .default(1),
  external: z.number()
    .int()
    .min(0)
    .max(1)
    .optional()
    .default(0),
})

export const updateMenuSchema = createMenuSchema.partial().omit({})

export const batchDeleteMenuSchema = z.object({
  ids: z.array(z.string())
    .min(1, '请选择要删除的菜单'),
})
