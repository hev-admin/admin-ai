import { defineStore } from 'pinia'
import { computed, nextTick, ref } from 'vue'

/** 首页（Dashboard）标签固定不可关闭（REQUIREMENTS §3） */
export const HOME_PATH = '/dashboard'

const HOME_TAB = { path: HOME_PATH, fullPath: HOME_PATH, name: 'Dashboard', title: 'menu.dashboard', affix: true, keepAlive: false }

/**
 * 多标签页（REQUIREMENTS §3 / §11 / #19）：以 path 为标签身份（query 变化更新回放地址
 * 不新开标签），title 存 i18n key（还原后随语言翻译）；tabs 与激活项持久化，
 * 刷新浏览器后还原；登出时由 user store 调用 reset 清空。
 */
export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref([])
  const activePath = ref('')
  // 「刷新」的瞬时态（不持久化）：临时摘除的组件名 + 每 path 的视图 key 计数（M3 决策点 5）
  const excludedNames = ref([])
  const viewKeys = ref({})

  /** KeepAlive include 名单：已打开且声明缓存的标签的路由 name（关闭标签即释放缓存） */
  const cachedNames = computed(() =>
    tabs.value
      .filter(tab => tab.keepAlive && tab.name && !excludedNames.value.includes(tab.name))
      .map(tab => tab.name),
  )

  function ensureHomeTab() {
    if (!tabs.value.some(tab => tab.path === HOME_PATH))
      tabs.value.unshift({ ...HOME_TAB })
  }

  /** 路由进入时登记标签；hideTab（异常页）与无名路由不进 */
  function addTab(route) {
    if (!route.name || route.meta?.hideTab)
      return
    ensureHomeTab()
    const existing = tabs.value.find(tab => tab.path === route.path)
    if (existing) {
      existing.fullPath = route.fullPath
      existing.name = route.name
      existing.title = route.meta?.title ?? existing.title
      existing.keepAlive = Boolean(route.meta?.keepAlive)
    }
    else {
      tabs.value.push({
        path: route.path,
        fullPath: route.fullPath,
        name: route.name,
        title: route.meta?.title ?? route.path,
        affix: route.path === HOME_PATH,
        keepAlive: Boolean(route.meta?.keepAlive),
      })
    }
    activePath.value = route.path
  }

  /** 关闭标签；若关闭的是激活标签，返回应跳转的相邻标签地址（右邻优先），否则返回 null */
  function removeTab(path) {
    const index = tabs.value.findIndex(tab => tab.path === path)
    if (index < 0 || tabs.value[index].affix)
      return null
    tabs.value.splice(index, 1)
    if (activePath.value !== path)
      return null
    const next = tabs.value[index] ?? tabs.value[index - 1]
    return next?.fullPath ?? HOME_PATH
  }

  function closeOthers(path) {
    tabs.value = tabs.value.filter(tab => tab.affix || tab.path === path)
  }

  /**
   * 关闭锚点标签某一侧的可关闭标签（固定标签保留）；若激活标签被关闭，
   * 返回锚点标签 fullPath 供跳转（约定同 removeTab），否则返回 null。
   */
  function closeAside(path, keep) {
    const anchorIndex = tabs.value.findIndex(tab => tab.path === path)
    if (anchorIndex < 0)
      return null
    const anchor = tabs.value[anchorIndex]
    const activeClosed = tabs.value.some((tab, index) =>
      tab.path === activePath.value && !tab.affix && !keep(index, anchorIndex))
    tabs.value = tabs.value.filter((tab, index) => tab.affix || keep(index, anchorIndex))
    return activeClosed ? anchor.fullPath : null
  }

  /** 关闭 path 左侧的可关闭标签 */
  function closeLeft(path) {
    return closeAside(path, (index, anchorIndex) => index >= anchorIndex)
  }

  /** 关闭 path 右侧的可关闭标签 */
  function closeRight(path) {
    return closeAside(path, (index, anchorIndex) => index <= anchorIndex)
  }

  /** 关闭全部（保留固定标签），返回回退地址 */
  function closeAll() {
    tabs.value = tabs.value.filter(tab => tab.affix)
    ensureHomeTab()
    return HOME_PATH
  }

  /**
   * 刷新页面（M3 决策点 5）：先摘除缓存名（旧实例随 key 变更销毁而非入缓存）、
   * key 自增强制重建，nextTick 恢复名单——恢复触发的 include 变更会让 KeepAlive
   * 重新收录新实例，无需二次访问。
   */
  async function refresh(path) {
    viewKeys.value = { ...viewKeys.value, [path]: (viewKeys.value[path] ?? 0) + 1 }
    const tab = tabs.value.find(item => item.path === path)
    if (!tab?.name || !tab.keepAlive)
      return
    excludedNames.value = [...excludedNames.value, tab.name]
    await nextTick()
    excludedNames.value = excludedNames.value.filter(name => name !== tab.name)
  }

  function viewKey(path) {
    return viewKeys.value[path] ?? 0
  }

  /** 登出清空（user store reset 调用），避免跨账号还原到无权限页面（M3 决策点 4） */
  function reset() {
    tabs.value = []
    activePath.value = ''
    excludedNames.value = []
    viewKeys.value = {}
  }

  return { tabs, activePath, excludedNames, viewKeys, cachedNames, addTab, removeTab, closeLeft, closeRight, closeOthers, closeAll, refresh, viewKey, reset }
}, {
  persist: { pick: ['tabs', 'activePath'] },
})
