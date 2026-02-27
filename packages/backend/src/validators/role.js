import { z } from 'zod'

export const createRoleSchema = z.object({
  name: z.string()
    .min(1, '角色名称不能为空')
    .max(50, '角色名称不能超过50个字符'),
  code: z.string()
    .min(1, '角色编码不能为空')
    .max(50, '角色编码不能超过50个字符')
    .regex(/^[a-z]\w*$/i, '角色编码以字母开头，只能包含字母、数字和下划线'),
  description: z.string()
    .max(200, '描述不能超过200个字符')
    .optional()
    .nullable(),
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
  menuIds: z.array(z.string())
    .optional(),
})

export const updateRoleSchema = z.object({
  name: z.string()
    .min(1, '角色名称不能为空')
    .max(50, '角色名称不能超过50个字符')
    .optional(),
  code: z.string()
    .min(1, '角色编码不能为空')
    .max(50, '角色编码不能超过50个字符')
    .regex(/^[a-z]\w*$/i, '角色编码以字母开头，只能包含字母、数字和下划线')
    .optional(),
  description: z.string()
    .max(200, '描述不能超过200个字符')
    .optional()
    .nullable(),
  status: z.number()
    .int()
    .min(0)
    .max(1)
    .optional(),
  sort: z.number()
    .int()
    .min(0)
    .optional(),
  menuIds: z.array(z.string())
    .optional(),
})

export const batchDeleteRoleSchema = z.object({
  ids: z.array(z.string())
    .min(1, '请选择要删除的角色'),
})
