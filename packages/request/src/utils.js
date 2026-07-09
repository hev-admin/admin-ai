/** 将 fetch 的 Headers / axios 的 AxiosHeaders 统一为小写键的普通对象 */
export function headersToObject(headers) {
  if (!headers)
    return {}
  if (typeof headers.entries === 'function')
    return Object.fromEntries(headers.entries())
  if (typeof headers.toJSON === 'function')
    return headers.toJSON()
  return { ...headers }
}

/** 去除值为 undefined 的键：ofetch 按对象展开合并配置，显式 undefined 会覆盖实例默认值 */
export function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined))
}
