import process from 'node:process'
import { getConnInfo } from '@hono/node-server/conninfo'
import { AppError } from '../utils/errors.js'
import { parseDuration } from '../utils/jwt.js'

/**
 * 登录限流中间件（M6 #38，评估报告 P2「登录防护」）：进程内存滑动窗口，
 * 按「客户端 IP|用户名」分桶、**只计失败**（401/403 视为一次尝试），成功登录即清桶；
 * 窗口内失败达到阈值后，后续尝试（含密码正确的）一律 429，直至窗口滑出。
 *
 * 单实例语义（与模板 SQLite 单实例部署形态对齐，REQUIREMENTS §6）：多实例部署时
 * 计数不共享，需将存储外置（Redis 等）——接口形态不变，替换本文件实现即可。
 *
 * 配置（.env，可缺省）：LOGIN_RATE_MAX（默认 5 次）、LOGIN_RATE_WINDOW（默认 15m，
 * 支持 s/m/h/d 单位，语义同 JWT_EXPIRES_IN）。
 */
export function loginRateLimit() {
  const max = Number(process.env.LOGIN_RATE_MAX) > 0 ? Number(process.env.LOGIN_RATE_MAX) : 5
  const windowMs = parseDuration(process.env.LOGIN_RATE_WINDOW, 15 * 60) * 1000

  /** key → 窗口内失败时间戳数组（惰性剪枝：命中时丢弃已滑出窗口的记录） */
  const buckets = new Map()

  function prune(key, now) {
    const stamps = buckets.get(key)
    if (!stamps)
      return []
    const alive = stamps.filter(t => now - t < windowMs)
    if (alive.length)
      buckets.set(key, alive)
    else
      buckets.delete(key)
    return alive
  }

  /** 全量清扫防泄漏：桶数超阈值时清理全部过期桶（正常流量下几乎不触发） */
  function sweep(now) {
    if (buckets.size < 10_000)
      return
    for (const key of buckets.keys())
      prune(key, now)
  }

  function clientIp(c) {
    // 反代场景取 x-forwarded-for 首段；直连经 @hono/node-server 取 socket 地址；
    // app.request() 无服务测试两者皆无 → 'unknown'（分桶退化为按用户名）
    const forwarded = c.req.header('x-forwarded-for')
    if (forwarded)
      return forwarded.split(',')[0].trim()
    try {
      return getConnInfo(c).remote?.address || 'unknown'
    }
    catch {
      return 'unknown'
    }
  }

  return async (c, next) => {
    // hono 缓存请求体，此处读取不影响下游 zod 校验再次解析
    const body = await c.req.json().catch(() => ({}))
    const username = typeof body?.username === 'string' ? body.username : ''
    const key = `${clientIp(c)}|${username}`
    const now = Date.now()

    sweep(now)
    if (prune(key, now).length >= max)
      throw new AppError(429, '登录尝试过于频繁，请稍后再试')

    await next()

    // 结果判定看响应状态：下游抛出的 AppError 在 Hono compose 的最内层就被 onError
    // 转为响应（不会以异常形态穿透到上游中间件），此处 catch 不可行。
    // 200 → 登录成功清空计数；401/403 → 凭证类失败计一次；422 参数问题与 5xx 不计。
    const status = c.res?.status
    if (status === 200) {
      buckets.delete(key)
    }
    else if (status === 401 || status === 403) {
      const stamps = buckets.get(key) ?? []
      stamps.push(now)
      buckets.set(key, stamps)
    }
  }
}
