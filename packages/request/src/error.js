/**
 * 统一规范化的请求错误：两套适配器（fetch / axios）抛出的错误结构完全一致，
 * 上层拦截与业务处理不感知适配器差异（REQUIREMENTS §2.2）。
 *
 * - status：HTTP 状态码，非 HTTP 错误（超时 / 网络异常）为 0
 * - data：服务端返回的响应体（如有）
 * - code：错误类别：HTTP | TIMEOUT | NETWORK | ABORTED | UNKNOWN
 * - cause：原始错误引用（FetchError / AxiosError…），便于逃逸排查
 * - config：发起请求时的统一配置对象
 */
export class RequestError extends Error {
  constructor(message, { status = 0, data = null, code = 'UNKNOWN', config = null, cause = null } = {}) {
    super(message)
    this.name = 'RequestError'
    this.status = status
    this.data = data
    this.code = code
    this.config = config
    this.cause = cause
  }

  get isTimeout() {
    return this.code === 'TIMEOUT'
  }

  /** 将未知异常包装为 RequestError；已是 RequestError 则原样返回（补齐 config） */
  static from(err, config = null) {
    if (err instanceof RequestError) {
      err.config = err.config || config
      return err
    }
    return new RequestError(err?.message || '请求失败', { config, cause: err })
  }
}
