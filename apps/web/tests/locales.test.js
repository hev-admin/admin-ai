import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import enUS from '../src/locales/en-US/index.js'
import zhCN from '../src/locales/zh-CN/index.js'

// 语言包一致性测试（M6 #36）：把 frontend.md「新语言键集用一次性脚本比对」的
// 既有惯例升级为常驻回归。新增语言包对齐 zh-CN 键集即可复用本套断言。

describe('语言包一致性', () => {
  it('zh-CN 与 en-US 键集完全一致', () => {
    const zhKeys = Object.keys(zhCN).sort()
    const enKeys = Object.keys(enUS).sort()
    const missingInEn = zhKeys.filter(k => !(k in enUS))
    const missingInZh = enKeys.filter(k => !(k in zhCN))
    assert.deepEqual(missingInEn, [], `en-US 缺失键：${missingInEn.join(', ')}`)
    assert.deepEqual(missingInZh, [], `zh-CN 缺失键：${missingInZh.join(', ')}`)
  })

  it('所有值为平铺字符串（messageResolver 按整串 key 查找，不支持嵌套对象）', () => {
    for (const [locale, messages] of [['zh-CN', zhCN], ['en-US', enUS]]) {
      for (const [key, value] of Object.entries(messages)) {
        assert.equal(typeof value, 'string', `${locale} 的 ${key} 非字符串（疑似嵌套对象，须平铺）`)
      }
    }
  })

  it('键集非空（防止 import 解析失败静默通过）', () => {
    assert.ok(Object.keys(zhCN).length > 0)
  })
})
