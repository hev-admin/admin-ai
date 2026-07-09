import axios from 'axios'
import { RequestError } from '../error.js'
import { headersToObject } from '../utils.js'
import { createNodeAgents } from './agents.node.js'

/**
 * axios 适配器（可选）：包装 axios 实例，对外行为与 fetch 适配器完全一致。
 * 适配器只负责「发请求 + 错误规范化」，钩子编排在 createRequest 核心层统一完成。
 */
export function createAxiosAdapter(defaults = {}) {
  const client = axios.create({
    baseURL: defaults.baseURL,
    timeout: defaults.timeout ?? 0,
    headers: defaults.headers,
    // 与 fetch 适配器（undici 不读代理环境变量）行为对齐：禁用 axios 的
    // http_proxy / https_proxy 自动探测，保证双适配器一致直连；
    // 确需代理的场景经 raw 实例逃逸配置（§2.2）
    proxy: false,
    ...createNodeAgents(),
  })

  return {
    name: 'axios',
    /** 原始 axios 实例：确需 axios 特有能力（上传进度等）的孤例从此逃逸（§2.2） */
    raw: client,
    async send(config) {
      try {
        const res = await client.request({
          url: config.url,
          method: config.method,
          params: config.params,
          data: config.data,
          headers: config.headers,
          timeout: config.timeout,
          signal: config.signal,
        })
        return { data: res.data, status: res.status, headers: headersToObject(res.headers) }
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
  if (axios.isCancel(err))
    return new RequestError('请求已取消', { code: 'ABORTED', config, cause: err })
  if (err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT')
    return new RequestError('请求超时', { code: 'TIMEOUT', config, cause: err })
  if (err?.response) {
    return new RequestError(`请求失败（${err.response.status}）`, {
      code: 'HTTP',
      status: err.response.status,
      data: err.response.data ?? null,
      config,
      cause: err,
    })
  }
  if (err?.request)
    return new RequestError('网络异常，请稍后重试', { code: 'NETWORK', config, cause: err })
  return new RequestError(err?.message || '请求失败', { code: 'UNKNOWN', config, cause: err })
}
