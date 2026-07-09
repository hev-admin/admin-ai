import assert from 'node:assert/strict'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { after, before, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { bootTestApp } from './helpers/app.js'

// web 静态托管与 SPA fallback 测试（M7 #42）：WEB_DIST 未设置时行为零变化、
// 设置后静态文件 / index 回退 / 深层路由回退命中，且未知 /api 路径保持 JSON 404。

const serverDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(serverDir, 'data', 'test-webdist')

const INDEX_HTML = '<!DOCTYPE html><html><body>admin-ai spa shell</body></html>'
const APP_JS = 'console.log(\'admin-ai\')'

let ctx
let plainApp
let staticApp
let token

before(async () => {
  // 临时 dist 装置（data/ 已被 gitignore 覆盖）
  mkdirSync(join(distDir, 'assets'), { recursive: true })
  writeFileSync(join(distDir, 'index.html'), INDEX_HTML)
  writeFileSync(join(distDir, 'assets', 'app.js'), APP_JS)

  // 基线实例：WEB_DIST 未设置（防本地 .env 干扰，显式清除）
  delete process.env.WEB_DIST
  ctx = await bootTestApp('web-static')
  plainApp = ctx.app
  token = await ctx.login('super')

  // 启用实例：createApp() 每次调用读取 env，同进程对照（同库同密钥，token 通用）
  process.env.WEB_DIST = distDir
  const { createApp } = await import('../src/app.js')
  staticApp = createApp()
})

after(async () => {
  delete process.env.WEB_DIST
  rmSync(distDir, { recursive: true, force: true })
  await ctx.close()
})

/** 对指定 app 实例发起请求，返回 { status, type, text } */
async function req(app, path, init = {}) {
  const res = await app.request(path, init)
  return { status: res.status, type: res.headers.get('content-type') || '', text: await res.text() }
}

describe('WEB_DIST 未设置（dev 基线）', () => {
  it('未知非 /api 路径返回 JSON 404（不启用任何静态托管）', async () => {
    const { status, type, text } = await req(plainApp, '/system/users')
    assert.equal(status, 404)
    assert.match(type, /application\/json/)
    assert.equal(JSON.parse(text).code, 404)
  })
})

describe('WEB_DIST 已设置（单镜像形态）', () => {
  it('根路径返回 index.html', async () => {
    const { status, type, text } = await req(staticApp, '/')
    assert.equal(status, 200)
    assert.match(type, /text\/html/)
    assert.equal(text, INDEX_HTML)
  })

  it('静态资源按路径命中', async () => {
    const { status, type, text } = await req(staticApp, '/assets/app.js')
    assert.equal(status, 200)
    assert.match(type, /javascript/)
    assert.equal(text, APP_JS)
  })

  it('深层路由回退 index.html（SPA history 刷新场景）', async () => {
    const { status, type, text } = await req(staticApp, '/system/users')
    assert.equal(status, 200)
    assert.match(type, /text\/html/)
    assert.equal(text, INDEX_HTML)
  })

  it('未知 /api 路径保持 JSON 404，不被 fallback 吞掉', async () => {
    const { status, type, text } = await req(staticApp, '/api/not-exist', {
      headers: { Authorization: `Bearer ${token}` },
    })
    assert.equal(status, 404)
    assert.match(type, /application\/json/)
    assert.equal(JSON.parse(text).code, 404)
  })

  it('/api 前缀判定精确（/apifoo 属页面路径，回退 index.html）', async () => {
    const { status, text } = await req(staticApp, '/apifoo')
    assert.equal(status, 200)
    assert.equal(text, INDEX_HTML)
  })

  it('业务接口不受静态托管影响（登录链路可用）', async () => {
    const { status } = await req(staticApp, '/api/health')
    assert.equal(status, 200)
  })
})
