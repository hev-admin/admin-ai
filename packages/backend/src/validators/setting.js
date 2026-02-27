import { z } from 'zod'

const settingItemSchema = z.object({
  key: z.string()
    .min(1, '设置键名不能为空')
    .max(100, '设置键名不能超过100个字符'),
  value: z.string()
    .max(1000, '设置值不能超过1000个字符'),
  group: z.string()
    .max(50, '分组名不能超过50个字符')
    .optional()
    .default('system'),
})

export const batchSetSettingSchema = z.object({
  settings: z.array(settingItemSchema)
    .min(1, '请提供至少一项设置'),
})
