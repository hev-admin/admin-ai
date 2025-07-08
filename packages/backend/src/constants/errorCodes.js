/**
 * Standard error codes for the application
 * Format: MODULE_ACTION_ERROR (e.g., AUTH_LOGIN_FAILED)
 */
export const ErrorCodes = {
  // Generic errors (1xxx)
  UNKNOWN_ERROR: { code: 1000, message: '未知错误' },
  VALIDATION_ERROR: { code: 1001, message: '参数验证失败' },
  NOT_FOUND: { code: 1002, message: '资源不存在' },
  FORBIDDEN: { code: 1003, message: '无权限访问' },
  RATE_LIMITED: { code: 1004, message: '请求过于频繁' },

  // Authentication errors (2xxx)
  AUTH_UNAUTHORIZED: { code: 2000, message: '未授权访问' },
  AUTH_TOKEN_EXPIRED: { code: 2001, message: 'Token已过期' },
  AUTH_TOKEN_INVALID: { code: 2002, message: 'Token无效' },
  AUTH_LOGIN_FAILED: { code: 2003, message: '登录失败' },
  AUTH_USER_NOT_FOUND: { code: 2004, message: '用户不存在' },
  AUTH_PASSWORD_WRONG: { code: 2005, message: '密码错误' },
  AUTH_USER_DISABLED: { code: 2006, message: '用户已被禁用' },
  AUTH_ACCOUNT_LOCKED: { code: 2007, message: '账户已被锁定' },
  AUTH_REFRESH_FAILED: { code: 2008, message: 'Token刷新失败' },

  // User errors (3xxx)
  USER_EXISTS: { code: 3000, message: '用户已存在' },
  USER_EMAIL_EXISTS: { code: 3001, message: '邮箱已被使用' },
  USER_NOT_FOUND: { code: 3002, message: '用户不存在' },
  USER_PASSWORD_WEAK: { code: 3003, message: '密码强度不足' },
  USER_PASSWORD_SAME: { code: 3004, message: '新密码不能与原密码相同' },
  USER_OLD_PASSWORD_WRONG: { code: 3005, message: '原密码错误' },

  // Role errors (4xxx)
  ROLE_EXISTS: { code: 4000, message: '角色已存在' },
  ROLE_NOT_FOUND: { code: 4001, message: '角色不存在' },
  ROLE_IN_USE: { code: 4002, message: '角色正在使用中' },

  // Menu errors (5xxx)
  MENU_EXISTS: { code: 5000, message: '菜单已存在' },
  MENU_NOT_FOUND: { code: 5001, message: '菜单不存在' },
  MENU_HAS_CHILDREN: { code: 5002, message: '菜单存在子菜单' },

  // File errors (6xxx)
  FILE_TOO_LARGE: { code: 6000, message: '文件过大' },
  FILE_TYPE_NOT_ALLOWED: { code: 6001, message: '文件类型不允许' },
  FILE_UPLOAD_FAILED: { code: 6002, message: '文件上传失败' },

  // Database errors (7xxx)
  DB_ERROR: { code: 7000, message: '数据库错误' },
  DB_UNIQUE_VIOLATION: { code: 7001, message: '数据已存在' },
  DB_FOREIGN_KEY_VIOLATION: { code: 7002, message: '关联数据不存在' },
}

/**
 * Application error class with error code support
 */
export class AppError extends Error {
  constructor(errorCode, details = null) {
    const { code, message } = typeof errorCode === 'object'
      ? errorCode
      : ErrorCodes.UNKNOWN_ERROR

    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    }
  }
}

/**
 * Create an AppError from an error code
 */
export function createError(errorCode, details = null) {
  return new AppError(errorCode, details)
}

/**
 * Get error by code number
 */
export function getErrorByCode(code) {
  for (const key of Object.keys(ErrorCodes)) {
    if (ErrorCodes[key].code === code) {
      return ErrorCodes[key]
    }
  }
  return ErrorCodes.UNKNOWN_ERROR
}
