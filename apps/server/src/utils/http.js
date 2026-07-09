import process from 'node:process'
import { createRequest } from '@admin-ai/request'

/**
 * server 出站请求统一实例（REQUIREMENTS §2.2 / §6）：调用第三方接口一律经此实例，
 * 不散用裸 fetch / axios；适配器经 HTTP_ADAPTER 环境变量切换，默认 fetch。
 */
export const http = createRequest({
  adapter: process.env.HTTP_ADAPTER,
  timeout: 15000,
})
