import { createRequest, RequestError } from '@admin-ai/request'
import { useFeedback } from '@/composables/useFeedback'
import { translate } from '@/locales'
import { clearToken, getToken } from './auth'

// 业务请求实例（REQUIREMENTS §2.2 / §7）：基于统一请求包装配业务语义拦截器。
// 适配器经 VITE_HTTP_ADAPTER 切换（fetch | axios，默认 fetch），开发/构建期决定。
// 约定：config.silent = true 时不弹全局错误提示，由调用方自行处理。

/** 401 时清空登录态并整页跳登录（携带 redirect 回跳参数，§4.1）；登录接口本身除外 */
function handleUnauthorized(error) {
  clearToken()
  const isLoginRequest = String(error.config?.url || '').includes('/auth/login')
  if (!isLoginRequest && !window.location.pathname.startsWith('/login')) {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search)
    window.location.href = `/login?redirect=${redirect}`
  }
}

const request = createRequest({
  adapter: import.meta.env.VITE_HTTP_ADAPTER,
  baseURL: '/api',
  timeout: 15000,

  onRequest(config) {
    const token = getToken()
    if (token)
      config.headers = { ...config.headers, Authorization: `Bearer ${token}` }
    return config
  },

  // 统一解包 { code, data, message }：code === 0 返回 data，否则按业务错误抛出
  onResponse(response) {
    const body = response.data
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code !== 0) {
        if (!response.config?.silent)
          useFeedback().message.error(body.message || translate('common.requestFailed'))
        throw new RequestError(body.message || translate('common.requestFailed'), {
          status: response.status,
          data: body,
          code: 'HTTP',
          config: response.config,
        })
      }
      return body.data
    }
    return body
  },

  onError(error) {
    if (error.status === 401)
      handleUnauthorized(error)
    if (!error.config?.silent) {
      const message = error.data?.message
        || (error.status === 403 ? translate('common.noPermission') : '')
        || error.message
      useFeedback().message.error(message)
    }
  },
})

export default request
