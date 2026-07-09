const TOKEN_KEY = 'admin-ai:token'

/**
 * token 存取（REQUIREMENTS §4.1）：「记住我」存 localStorage（跨会话保留），
 * 否则存 sessionStorage（关闭标签即失效）；不改变服务端签发的过期时间。
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token, remember = false) {
  clearToken()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}
