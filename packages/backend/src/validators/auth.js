import { z } from 'zod'

// Password strength regex: at least 8 chars, 1 uppercase, 1 lowercase, 1 number
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

export const loginSchema = z.object({
  username: z.string()
    .min(1, '用户名不能为空')
    .max(50, '用户名不能超过50个字符'),
  password: z.string()
    .min(6, '密码至少6位')
    .max(100, '密码不能超过100个字符'),
})

export const registerSchema = z.object({
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
})

export const updateProfileSchema = z.object({
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
})

export const changePasswordSchema = z.object({
  oldPassword: z.string()
    .min(6, '原密码至少6位'),
  newPassword: z.string()
    .min(8, '新密码至少8位')
    .max(100, '密码不能超过100个字符')
    .regex(strongPasswordRegex, '新密码必须包含大小写字母和数字'),
})
