/** 业务异常：路由 / service 中抛出，由统一错误处理中间件转为标准响应 */
export class AppError extends Error {
  constructor(status, message, code) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code ?? status
  }
}
