import { SUPER_ROLE_CODE } from '../constants.js'
import { AppError } from '../utils/errors.js'

/**
 * 权限码校验中间件（REQUIREMENTS §4.2 前后端双重校验）：从 JWT 载荷比对权限码，
 * 不查库（取舍见 §4.5：改权限后需重新登录生效）。super 角色短路放行，
 * 与 getUserInfo 的 super 短路语义对齐——新增权限码后 super 无需重登。
 *
 * 用法：`route.post('/', requirePermission('sys:user:add'), ...)`
 */
export function requirePermission(permission) {
  return async (c, next) => {
    const payload = c.get('jwtPayload')
    const roles = payload?.roles || []
    const permissions = payload?.permissions || []
    if (!roles.includes(SUPER_ROLE_CODE) && !permissions.includes(permission))
      throw new AppError(403, '没有操作权限')
    await next()
  }
}
