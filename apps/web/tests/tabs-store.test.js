import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { createPinia, setActivePinia } from 'pinia'
import { HOME_PATH, useTabsStore } from '../src/stores/tabs.js'

// tabs store 回归：closeLeft / closeRight（右侧快捷菜单新增能力）的边界——
// 固定标签保留、激活标签被关时返回锚点地址、锚点不存在时不动作。

function fakeRoute(path) {
  return { name: path, path, fullPath: path, meta: {} }
}

describe('tabs store closeLeft/closeRight', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function seedTabs(paths) {
    const store = useTabsStore()
    for (const path of paths)
      store.addTab(fakeRoute(path))
    return store
  }

  it('closeRight 关闭锚点右侧标签，激活标签保留时返回 null', () => {
    const store = seedTabs(['/a', '/b', '/c'])
    store.activePath = '/b'
    const next = store.closeRight('/b')
    assert.deepEqual(store.tabs.map(tab => tab.path), [HOME_PATH, '/a', '/b'])
    assert.equal(next, null)
  })

  it('closeLeft 关闭锚点左侧标签并保留固定标签，激活标签被关时返回锚点地址', () => {
    const store = seedTabs(['/a', '/b', '/c'])
    store.activePath = '/a'
    const next = store.closeLeft('/c')
    assert.deepEqual(store.tabs.map(tab => tab.path), [HOME_PATH, '/c'])
    assert.equal(next, '/c')
  })

  it('closeRight 关闭含激活标签的右侧区间时返回锚点地址', () => {
    const store = seedTabs(['/a', '/b', '/c'])
    // seedTabs 后激活为 /c，位于 /a 右侧
    const next = store.closeRight('/a')
    assert.deepEqual(store.tabs.map(tab => tab.path), [HOME_PATH, '/a'])
    assert.equal(next, '/a')
  })

  it('锚点不存在时不动作并返回 null', () => {
    const store = seedTabs(['/a', '/b'])
    const next = store.closeLeft('/missing')
    assert.equal(next, null)
    assert.deepEqual(store.tabs.map(tab => tab.path), [HOME_PATH, '/a', '/b'])
  })

  it('固定标签（首页）不会被 closeLeft 关闭', () => {
    const store = seedTabs(['/a'])
    store.activePath = '/a'
    const next = store.closeLeft('/a')
    assert.deepEqual(store.tabs.map(tab => tab.path), [HOME_PATH, '/a'])
    assert.equal(next, null)
  })
})
