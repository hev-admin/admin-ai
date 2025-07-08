import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { tabsConfig } from '@/config/tabs.js'

export const useTabsStore = defineStore('tabs', () => {
  // 从 localStorage 恢复状态
  const savedState = tabsConfig.persistence
    ? JSON.parse(localStorage.getItem(tabsConfig.storageKey) || 'null')
    : null

  // State
  const tabs = ref(savedState?.tabs || [...tabsConfig.affixTabs])
  const activeTab = ref(savedState?.activeTab || tabsConfig.affixTabs[0]?.path || '/')

  // 确保固定 tabs 始终存在
  tabsConfig.affixTabs.forEach((affixTab) => {
    if (!tabs.value.some(t => t.path === affixTab.path)) {
      tabs.value.unshift({ ...affixTab, affix: true })
    }
  })

  // 标记固定 tabs
  tabs.value = tabs.value.map((tab) => {
    const isAffix = tabsConfig.affixTabs.some(a => a.path === tab.path)
    return { ...tab, affix: isAffix }
  })

  // 持久化到 localStorage
  watch(
    () => ({ tabs: tabs.value, activeTab: activeTab.value }),
    (state) => {
      if (tabsConfig.persistence) {
        localStorage.setItem(tabsConfig.storageKey, JSON.stringify(state))
      }
    },
    { deep: true },
  )

  // Getters
  const cachedViews = computed(() =>
    tabs.value.filter(t => t.keepAlive !== false).map(t => t.name).filter(Boolean),
  )

  const activeIndex = computed(() =>
    tabs.value.findIndex(t => t.path === activeTab.value),
  )

  // Actions

  /**
   * 添加 tab
   * @param {object} route - 路由对象
   */
  function addTab(route) {
    const path = route.path

    // 已存在则仅切换
    const existingTab = tabs.value.find(t => t.path === path)
    if (existingTab) {
      activeTab.value = path
      return
    }

    // 检查最大数量限制
    if (tabsConfig.maxTabs > 0 && tabs.value.length >= tabsConfig.maxTabs) {
      // 移除最早的非固定 tab
      const removeIndex = tabs.value.findIndex(t => !t.affix)
      if (removeIndex > -1) {
        tabs.value.splice(removeIndex, 1)
      }
    }

    // 检查是否为固定 tab
    const isAffix = tabsConfig.affixTabs.some(a => a.path === path)

    // 添加新 tab
    tabs.value.push({
      path,
      name: route.name || '',
      title: route.meta?.title || route.name || '未命名',
      icon: route.meta?.icon || 'i-lucide-file',
      affix: isAffix,
      keepAlive: route.meta?.keepAlive !== false,
    })

    activeTab.value = path
  }

  /**
   * 关闭指定 tab
   * @param {string} path - tab 路径
   * @returns {string|null} - 需要跳转的路径
   */
  function closeTab(path) {
    const index = tabs.value.findIndex(t => t.path === path)
    if (index === -1)
      return null

    // 固定 tab 不可关闭
    if (tabs.value[index].affix)
      return null

    tabs.value.splice(index, 1)

    // 如果关闭的是当前 tab，跳转到相邻 tab
    if (path === activeTab.value) {
      const nextTab = tabs.value[index] || tabs.value[index - 1]
      activeTab.value = nextTab?.path || '/'
      return activeTab.value
    }

    return null
  }

  /**
   * 关闭左侧 tabs
   * @param {string} path - 当前 tab 路径
   */
  function closeLeftTabs(path) {
    const index = tabs.value.findIndex(t => t.path === path)
    if (index <= 0)
      return

    const closedPaths = []
    tabs.value = tabs.value.filter((t, i) => {
      if (i >= index || t.affix)
        return true
      closedPaths.push(t.path)
      return false
    })

    // 如果当前激活的 tab 被关闭了，切换到目标 tab
    if (closedPaths.includes(activeTab.value)) {
      activeTab.value = path
    }
  }

  /**
   * 关闭右侧 tabs
   * @param {string} path - 当前 tab 路径
   */
  function closeRightTabs(path) {
    const index = tabs.value.findIndex(t => t.path === path)
    if (index === -1 || index === tabs.value.length - 1)
      return

    const closedPaths = []
    tabs.value = tabs.value.filter((t, i) => {
      if (i <= index || t.affix)
        return true
      closedPaths.push(t.path)
      return false
    })

    // 如果当前激活的 tab 被关闭了，切换到目标 tab
    if (closedPaths.includes(activeTab.value)) {
      activeTab.value = path
    }
  }

  /**
   * 关闭其他 tabs
   * @param {string} path - 当前 tab 路径
   */
  function closeOtherTabs(path) {
    tabs.value = tabs.value.filter(t => t.path === path || t.affix)
    activeTab.value = path
  }

  /**
   * 关闭全部 tabs（保留固定 tab）
   * @returns {string} - 跳转路径
   */
  function closeAllTabs() {
    tabs.value = tabs.value.filter(t => t.affix)
    const firstTab = tabs.value[0]
    activeTab.value = firstTab?.path || '/'
    return activeTab.value
  }

  /**
   * 设置当前激活的 tab
   * @param {string} path - tab 路径
   */
  function setActiveTab(path) {
    if (tabs.value.some(t => t.path === path)) {
      activeTab.value = path
    }
  }

  /**
   * 检查是否可以关闭左侧
   * @param {string} path - tab 路径
   */
  function canCloseLeft(path) {
    const index = tabs.value.findIndex(t => t.path === path)
    if (index <= 0)
      return false
    // 检查左侧是否有非固定的 tab
    return tabs.value.slice(0, index).some(t => !t.affix)
  }

  /**
   * 检查是否可以关闭右侧
   * @param {string} path - tab 路径
   */
  function canCloseRight(path) {
    const index = tabs.value.findIndex(t => t.path === path)
    if (index === -1 || index === tabs.value.length - 1)
      return false
    // 检查右侧是否有非固定的 tab
    return tabs.value.slice(index + 1).some(t => !t.affix)
  }

  /**
   * 检查是否可以关闭其他
   * @param {string} path - tab 路径
   */
  function canCloseOthers(path) {
    return tabs.value.some(t => t.path !== path && !t.affix)
  }

  /**
   * 检查是否可以关闭全部
   */
  function canCloseAll() {
    return tabs.value.some(t => !t.affix)
  }

  return {
    // State
    tabs,
    activeTab,

    // Getters
    cachedViews,
    activeIndex,

    // Actions
    addTab,
    closeTab,
    closeLeftTabs,
    closeRightTabs,
    closeOtherTabs,
    closeAllTabs,
    setActiveTab,

    // Helpers
    canCloseLeft,
    canCloseRight,
    canCloseOthers,
    canCloseAll,
  }
})
