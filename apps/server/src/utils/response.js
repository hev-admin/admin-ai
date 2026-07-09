/** 统一响应结构：{ code, data, message }，code === 0 表示成功（REQUIREMENTS §7） */
export function ok(c, data = null, message = 'ok') {
  return c.json({ code: 0, data, message })
}

/** 失败响应：HTTP 状态码保持语义，业务 code 缺省与状态码一致 */
export function fail(c, message = '请求失败', { status = 400, code, data = null } = {}) {
  return c.json({ code: code ?? status, data, message }, status)
}
