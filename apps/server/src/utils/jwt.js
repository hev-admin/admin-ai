import process from 'node:process'
import { sign, verify } from 'hono/jwt'

const UNITS = { s: 1, m: 60, h: 3600, d: 86400 }
const DEFAULT_EXPIRES_IN = 7 * 86400
/** 签名算法：与 middlewares/auth.js 的 jwt 中间件保持一致 */
export const JWT_ALG = 'HS256'

/** 解析 '7d' / '12h' / '30m' / '3600' 形式的时长为秒数 */
export function parseDuration(input, fallback = DEFAULT_EXPIRES_IN) {
  if (!input)
    return fallback
  const match = String(input).trim().match(/^(\d+)([smhd])?$/)
  if (!match)
    return fallback
  return Number(match[1]) * UNITS[match[2] || 's']
}

/** 签发 JWT：载荷含 sub / username / roles / permissions（REQUIREMENTS §4.5），过期时间取 JWT_EXPIRES_IN */
export function signToken(payload) {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + parseDuration(process.env.JWT_EXPIRES_IN)
  return sign({ ...payload, iat: now, exp }, process.env.JWT_SECRET, JWT_ALG)
}

export function verifyToken(token) {
  return verify(token, process.env.JWT_SECRET, JWT_ALG)
}
