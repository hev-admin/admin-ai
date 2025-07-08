<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTabsStore } from '@/stores/tabs.js'
import ContextMenu from './ContextMenu.vue'
import TabItem from './TabItem.vue'

const router = useRouter()
const tabsStore = useTabsStore()

// 右键菜单状态
const menuVisible = ref(false)
const menuPosition = ref({ x: 0, y: 0 })
const currentTab = ref(null)

// 点击 tab 切换
function handleClick(tab) {
  if (tab.path !== tabsStore.activeTab) {
    tabsStore.setActiveTab(tab.path)
    router.push(tab.path)
  }
}

// 关闭 tab
function handleClose(tab) {
  const redirectPath = tabsStore.closeTab(tab.path)
  if (redirectPath) {
    router.push(redirectPath)
  }
}

// 右键菜单
function handleContextMenu(e, tab) {
  currentTab.value = tab
  menuPosition.value = { x: e.clientX, y: e.clientY }
  menuVisible.value = true
}

// 右键菜单选择
function handleMenuSelect(action) {
  if (!currentTab.value)
    return

  const path = currentTab.value.path

  switch (action) {
    case 'closeCurrent': {
      const redirectPath = tabsStore.closeTab(path)
      if (redirectPath)
        router.push(redirectPath)
      break
    }
    case 'closeLeft':
      tabsStore.closeLeftTabs(path)
      if (!tabsStore.tabs.some(t => t.path === tabsStore.activeTab))
        router.push(path)
      break
    case 'closeRight':
      tabsStore.closeRightTabs(path)
      if (!tabsStore.tabs.some(t => t.path === tabsStore.activeTab))
        router.push(path)
      break
    case 'closeOthers':
      tabsStore.closeOtherTabs(path)
      router.push(path)
      break
    case 'closeAll': {
      const redirectPath = tabsStore.closeAllTabs()
      router.push(redirectPath)
      break
    }
  }

  menuVisible.value = false
}

// 鼠标滚轮横向滚动
function handleWheel(e) {
  if (e.deltaY !== 0) {
    e.currentTarget.scrollLeft += e.deltaY
  }
}
</script>

<template>
  <div
    class="tabs-view"
    flex items-end h-9 bg-gray-100 dark:bg-gray-800 select-none
    overflow-x-auto
    @wheel.prevent="handleWheel"
  >
    <TabItem
      v-for="tab in tabsStore.tabs"
      :key="tab.path"
      :tab="tab"
      :active="tab.path === tabsStore.activeTab"
      @click="handleClick(tab)"
      @close="handleClose(tab)"
      @contextmenu.prevent="handleContextMenu($event, tab)"
    />
  </div>

  <!-- 右键菜单 -->
  <ContextMenu
    v-model:visible="menuVisible"
    :position="menuPosition"
    :tab="currentTab"
  >
    <template #default="{ close }">
      <div
        class="menu-item"
        :class="{ disabled: currentTab?.affix }"
        @click="!currentTab?.affix && (handleMenuSelect('closeCurrent'), close())"
      >
        关闭当前
      </div>
      <div
        class="menu-item"
        :class="{ disabled: !tabsStore.canCloseLeft(currentTab?.path) }"
        @click="tabsStore.canCloseLeft(currentTab?.path) && (handleMenuSelect('closeLeft'), close())"
      >
        关闭左侧
      </div>
      <div
        class="menu-item"
        :class="{ disabled: !tabsStore.canCloseRight(currentTab?.path) }"
        @click="tabsStore.canCloseRight(currentTab?.path) && (handleMenuSelect('closeRight'), close())"
      >
        关闭右侧
      </div>
      <div
        class="menu-item"
        :class="{ disabled: !tabsStore.canCloseOthers(currentTab?.path) }"
        @click="tabsStore.canCloseOthers(currentTab?.path) && (handleMenuSelect('closeOthers'), close())"
      >
        关闭其他
      </div>
      <div
        class="menu-item"
        :class="{ disabled: !tabsStore.canCloseAll() }"
        @click="tabsStore.canCloseAll() && (handleMenuSelect('closeAll'), close())"
      >
        关闭全部
      </div>
    </template>
  </ContextMenu>
</template>

<style scoped>
.tabs-view {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tabs-view::-webkit-scrollbar {
  display: none;
}

.menu-item {
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.menu-item:hover:not(.disabled) {
  background-color: var(--hover-bg, #f3f4f6);
}

.menu-item.disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

:deep(.dark) .menu-item:hover:not(.disabled) {
  --hover-bg: #374151;
}
</style>
