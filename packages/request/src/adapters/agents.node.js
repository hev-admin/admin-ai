import http from 'node:http'
import https from 'node:https'

/**
 * Node 侧为 axios 显式提供 keep-alive Agent：axios 默认走全局 agent 时会发送
 * `Connection: close` 却又复用刚释放的 socket，连发请求会命中「服务端已按约定
 * 关闭连接」的竞态（Windows 下表现为 ECONNRESET）。显式 keep-alive 使请求头与
 * 连接池行为一致，同时与 fetch 适配器（undici 连接池）的行为对齐。
 *
 * 浏览器构建经 package.json 的 browser 字段替换为 agents.browser.js，
 * 不会引入 node:http / node:https。
 */
export function createNodeAgents() {
  return {
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
  }
}
