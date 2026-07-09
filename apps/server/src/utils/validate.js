import { zValidator } from '@hono/zod-validator'

/**
 * zod 校验封装：校验失败统一返回 422 + 字段错误明细（REQUIREMENTS §6），
 * 路由内经 c.req.valid(target) 取已校验数据。
 */
export function validate(target, schema) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const issues = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
      return c.json(
        { code: 422, data: { issues }, message: issues[0]?.message || '参数校验失败' },
        422,
      )
    }
  })
}
