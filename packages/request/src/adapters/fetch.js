import { ofetch } from 'ofetch'
import { RequestError } from '../error.js'
import { compact, headersToObject } from '../utils.js'

/**
 * fetch 适配器（默认）：基于 ofetch 二次封装（底层即原生 fetch，浏览器 / Node ≥ 22 同构可用）。
 * 适配器只负责「发请求 + 错误规范化」，钩子编排在 createRequest 核心层统一完成。
 */
export function createFetchAdapter(defaults = {}) {
  const client = ofetch.create({
    baseURL: defaults.baseURL,
    timeout: defaults.timeout,
    headers: defaults.headers,
    retry: 0,
  })

  return {
    name: 'fetch',
    /** 原始 ofetch 实例：确需 fetch 特有能力（流式消费等）的孤例从此逃逸（§2.2） */
    raw: client,
    async send(config) {
      try {
        const res = await client.raw(config.url, compact({
          method: config.method,
          query: config.params,
          body: config.data,
          headers: config.headers,
          timeout: config.timeout,
          signal: config.signal,
          retry: 0,
        }))
        return { data: res._data, status: res.status, headers: headersToObject(res.headers) }
      }
      catch (err) {
        throw normalizeError(err, config)
      }
    },
  }
}

function normalizeError(err, config) {
  if (err instanceof RequestError)
    return err
  const causeName = err?.cause?.name || err?.name
  if (causeName === 'TimeoutError')
    return new RequestError('请求超时', { code: 'TIMEOUT', config, cause: err })
  if (causeName === 'AbortError')
    return new RequestError('请求已取消', { code: 'ABORTED', config, cause: err })
  if (err?.response) {
    return new RequestError(`请求失败（${err.response.status}）`, {
      code: 'HTTP',
      status: err.response.status,
      data: err.data ?? err.response._data ?? null,
      config,
      cause: err,
    })
  }
  return new RequestError('网络异常，请稍后重试', { code: 'NETWORK', config, cause: err })
}
