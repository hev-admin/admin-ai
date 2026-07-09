import process from 'node:process'

// 结构化日志（M6 #37 决策点 5）：零依赖 JSON 行输出——模板所需仅「级别过滤 + 结构化
// 字段」，不引入 pino；接口形态（level + fields 对象）与主流方案对齐，后续需要采集
// 生态（多 transport、脱敏、采样）时平替为 pino 的改动收敛在本文件。

const LEVELS = { debug: 20, info: 30, warn: 40, error: 50 }

function threshold() {
  // 每次求值读取 env：测试文件在 import 前设 LOG_LEVEL=error 即可静音访问日志
  return LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info
}

function write(level, fields) {
  if (LEVELS[level] < threshold())
    return
  const line = JSON.stringify({ level, time: new Date().toISOString(), ...fields })
  // stderr 承载 warn/error，便于容器/进程管理器按流分级采集
  if (LEVELS[level] >= LEVELS.warn)
    console.error(line)
  else
    console.log(line)
}

/**
 * 用法：`logger.info({ msg: 'request', method, path, status })`。
 * fields 必含 `msg`，其余字段自由扩展；输出单行 JSON（level/time/msg/...）。
 */
export const logger = {
  debug: fields => write('debug', fields),
  info: fields => write('info', fields),
  warn: fields => write('warn', fields),
  error: fields => write('error', fields),
}
