import { createAxiosAdapter } from './adapters/axios.js'
import { createFetchAdapter } from './adapters/fetch.js'
import { RequestError } from './error.js'

export { RequestError }

const adapterFactories = {
  fetch: createFetchAdapter,
  axios: createAxiosAdapter,
}

/**
 * 适配器取值优先级：显式传入 > 环境变量（web：VITE_HTTP_ADAPTER；server：HTTP_ADAPTER）> 默认 fetch。
 * 开发/构建期决定，不做运行时动态切换（§2.2）。
 */
function resolveAdapterName(explicit) {
  if (explicit)
    return explicit
  let fromEnv
  try {
    fromEnv = import.meta.env?.VITE_HTTP_ADAPTER
  }
  catch {
    fromEnv = undefined
  }
  return fromEnv || globalThis.process?.env?.HTTP_ADAPTER || 'fetch'
}

/**
 * 创建统一请求实例（同构：浏览器 / Node 均可运行）。
 *
 * @param {object} [options]
 * @param {'fetch' | 'axios'} [options.adapter] 适配器，默认经环境变量解析，兜底 fetch
 * @param {string} [options.baseURL] 基础路径
 * @param {number} [options.timeout] 超时毫秒数
 * @param {object} [options.headers] 实例级默认请求头
 * @param {(config: object) => object | void} [options.onRequest] 请求钩子：可修改并返回配置
 * @param {(response: { data, status, headers, config }) => any} [options.onResponse]
 *   响应钩子：返回非 undefined 值时替换最终返回值；未提供钩子或返回 undefined 时返回 response.data
 * @param {(error: RequestError) => any} [options.onError] 错误钩子：返回非 undefined 值可吞掉错误作为返回值，否则继续抛出
 * @returns 统一实例：{ adapter, raw, request, get, post, put, patch, delete }
 */
export function createRequest(options = {}) {
  const { adapter, baseURL = '', timeout, headers, onRequest, onResponse, onError } = options

  const adapterName = resolveAdapterName(adapter)
  const createAdapter = adapterFactories[adapterName]
  if (!createAdapter)
    throw new Error(`[@admin-ai/request] 未知适配器：${adapterName}（可选 fetch | axios）`)

  const impl = createAdapter({ baseURL, timeout, headers })

  async function request(config = {}) {
    let cfg = { method: 'GET', ...config }
    if (onRequest)
      cfg = (await onRequest(cfg)) || cfg

    let response
    try {
      response = await impl.send(cfg)
      response.config = cfg
    }
    catch (err) {
      const error = RequestError.from(err, cfg)
      if (onError) {
        const recovered = await onError(error)
        if (recovered !== undefined)
          return recovered
      }
      throw error
    }

    if (onResponse) {
      const replaced = await onResponse(response)
      if (replaced !== undefined)
        return replaced
    }
    return response.data
  }

  return {
    adapter: adapterName,
    /** 原始适配器实例（ofetch / axios）：底层能力逃逸口，须集中标注、控制数量（§2.2） */
    raw: impl.raw,
    request,
    get: (url, config) => request({ ...config, url, method: 'GET' }),
    post: (url, data, config) => request({ ...config, url, data, method: 'POST' }),
    put: (url, data, config) => request({ ...config, url, data, method: 'PUT' }),
    patch: (url, data, config) => request({ ...config, url, data, method: 'PATCH' }),
    delete: (url, config) => request({ ...config, url, method: 'DELETE' }),
  }
}
