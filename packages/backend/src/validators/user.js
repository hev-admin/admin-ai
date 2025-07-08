import { z } from 'zod'

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

export const createUserSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3位')
    .max(50, '用户名不能超过50个字符')
    .regex(/^\w+$/, '用户名只能包含字母、数字和下划线'),
  email: z.string()
    .email('邮箱格式不正确')
    .max(100, '邮箱不能超过100个字符'),
  password: z.string()
    .min(8, '密码至少8位')
    .max(100, '密码不能超过100个字符')
    .regex(strongPasswordRegex, '密码必须包含大小写字母和数字'),
  nickname: z.string()
    .max(50, '昵称不能超过50个字符')
    .optional(),
  phone: z.string()
    .regex(/^\d{11}$/, '手机号格式不正确')
    .optional()
    .nullable(),
  avatar: z.string()
    .url('头像URL格式不正确')
    .optional()
    .nullable(),
  status: z.number()
    .int()
    .min(0)
    .max(1)
    .optional()
    .default(1),
  roleIds: z.array(z.string().uuid('角色ID格式不正确'))
    .optional(),
})

export const updateUserSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3位')
    .max(50, '用户名不能超过50个字符')
    .regex(/^\w+$/, '用户名只能包含字母、数字和下划线')
    .optional(),
  email: z.string()
    .email('邮箱格式不正确')
    .max(100, '邮箱不能超过100个字符')
    .optional(),
  nickname: z.string()
    .max(50, '昵称不能超过50个字符')
    .optional(),
  phone: z.string()
    .regex(/^\d{11}$/, '手机号格式不正确')
    .optional()
    .nullable(),
  avatar: z.string()
    .url('头像URL格式不正确')
    .optional()
    .nullable(),
  status: z.number()
    .int()
    .min(0)
    .max(1)
    .optional(),
  roleIds: z.array(z.string().uuid('角色ID格式不正确'))
    .optional(),
})

export const batchDeleteSchema = z.object({
  ids: z.array(z.string().uuid('用户ID格式不正确'))
    .min(1, '请选择要删除的用户'),
})

export const listQuerySchema = z.object({
  page: z.string()
    .optional()
    .transform(val => (val ? Number.parseInt(val, 10) : 1))
    .refine(val => val > 0, '页码必须大于0'),
  pageSize: z.string()
    .optional()
    .transform(val => (val ? Number.parseInt(val, 10) : 10))
    .refine(val => val > 0 && val <= 100, '每页数量必须在1-100之间'),
  keyword: z.string()
    .max(100, '搜索关键词不能超过100个字符')
    .optional()
    .default(''),
})
