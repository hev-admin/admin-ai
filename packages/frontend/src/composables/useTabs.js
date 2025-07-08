import { useRouter } from 'vue-router'
import { useTabsStore } from '@/stores/tabs.js'

/**
 * TabsView 相关操作的组合式函数
 */
export function useTabs() {
  const router = useRouter()
  const tabsStore = useTabsStore()

  /**
   * 关闭当前 tab
   */
  function closeCurrent() {
    const redirectPath = tabsStore.closeTab(tabsStore.activeTab)
    if (redirectPath) {
      router.push(redirectPath)
    }
  }

  /**
   * 关闭指定 tab
   * @param {string} path - tab 路径
   */
  function closeTab(path) {
    const redirectPath = tabsStore.closeTab(path)
    if (redirectPath) {
      router.push(redirectPath)
    }
  }

  /**
   * 关闭左侧 tabs
   * @param {string} path - 当前 tab 路径，默认为激活的 tab
   */
  function closeLeft(path = tabsStore.activeTab) {
    tabsStore.closeLeftTabs(path)
    // 确保路由与 activeTab 同步
    if (router.currentRoute.value.path !== tabsStore.activeTab) {
      router.push(tabsStore.activeTab)
    }
  }

  /**
   * 关闭右侧 tabs
   * @param {string} path - 当前 tab 路径，默认为激活的 tab
   */
  function closeRight(path = tabsStore.activeTab) {
    tabsStore.closeRightTabs(path)
    // 确保路由与 activeTab 同步
    if (router.currentRoute.value.path !== tabsStore.activeTab) {
      router.push(tabsStore.activeTab)
    }
  }

  /**
   * 关闭其他 tabs
   * @param {string} path - 当前 tab 路径，默认为激活的 tab
   */
  function closeOthers(path = tabsStore.activeTab) {
    tabsStore.closeOtherTabs(path)
    if (router.currentRoute.value.path !== path) {
      router.push(path)
    }
  }

  /**
   * 关闭所有 tabs（保留固定 tab）
   */
  function closeAll() {
    const redirectPath = tabsStore.closeAllTabs()
    router.push(redirectPath)
  }

  /**
   * 刷新当前页面
   */
  function refreshCurrent() {
    const { fullPath } = router.currentRoute.value
    router.replace({ path: `/redirect${fullPath}` })
  }

  /**
   * 跳转到指定 tab
   * @param {string} path - tab 路径
   */
  function goToTab(path) {
    tabsStore.setActiveTab(path)
    router.push(path)
  }

  return {
    // Store 状态
    tabs: tabsStore.tabs,
    activeTab: tabsStore.activeTab,
    cachedViews: tabsStore.cachedViews,

    // 操作方法
    closeCurrent,
    closeTab,
    closeLeft,
    closeRight,
    closeOthers,
    closeAll,
    refreshCurrent,
    goToTab,

    // 检查方法
    canCloseLeft: tabsStore.canCloseLeft,
    canCloseRight: tabsStore.canCloseRight,
    canCloseOthers: tabsStore.canCloseOthers,
    canCloseAll: tabsStore.canCloseAll,
  }
}
