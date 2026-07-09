<script setup>
import { computed, nextTick, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'
import { useTabsStore } from '@/stores/tabs'

// 多标签页（REQUIREMENTS §3 / #19）：Chrome 风格标签（顶部圆角 + 激活标签底部外凹角，
// 与内容区融合）、点击切换、关闭按钮、右键菜单（刷新 / 关闭当前 / 关闭其他 / 关闭全部）、
// 右侧固定快捷操作下拉（作用于激活标签，含关闭左侧 / 右侧）；标签登记由本组件 watch 路由完成。

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const tabsStore = useTabsStore()

watch(() => route.fullPath, () => tabsStore.addTab(route), { immediate: true })

function handleClick(tab) {
  if (tab.path !== route.path)
    router.push(tab.fullPath)
}

function handleClose(tab) {
  const next = tabsStore.removeTab(tab.path)
  if (next)
    router.push(next)
}

// ---- 右键菜单 ----
const ctx = reactive({ show: false, x: 0, y: 0, tab: null })

function openContextMenu(event, tab) {
  ctx.show = false
  nextTick(() => {
    ctx.tab = tab
    ctx.x = event.clientX
    ctx.y = event.clientY
    ctx.show = true
  })
}

const ctxOptions = computed(() => [
  // 刷新只对激活标签开放（M3 决策点 5）
  { key: 'refresh', label: t('tabs.refresh'), disabled: ctx.tab?.path !== tabsStore.activePath, icon: () => h(AppIcon, { icon: 'i-carbon-renew' }) },
  { key: 'closeCurrent', label: t('tabs.closeCurrent'), disabled: Boolean(ctx.tab?.affix), icon: () => h(AppIcon, { icon: 'i-carbon-close' }) },
  { key: 'closeOthers', label: t('tabs.closeOthers'), icon: () => h(AppIcon, { icon: 'i-carbon-subtract' }) },
  { key: 'closeAll', label: t('tabs.closeAll'), icon: () => h(AppIcon, { icon: 'i-carbon-close-outline' }) },
])

function handleCtxSelect(key) {
  ctx.show = false
  const tab = ctx.tab
  if (!tab)
    return
  if (key === 'refresh') {
    tabsStore.refresh(tab.path)
  }
  else if (key === 'closeCurrent') {
    handleClose(tab)
  }
  else if (key === 'closeOthers') {
    tabsStore.closeOthers(tab.path)
    if (route.path !== tab.path)
      router.push(tab.fullPath)
  }
  else if (key === 'closeAll') {
    const next = tabsStore.closeAll()
    if (route.path !== next)
      router.push(next)
  }
}

// ---- 右侧快捷操作（作用于当前激活标签） ----
const activeTab = computed(() => tabsStore.tabs.find(tab => tab.path === tabsStore.activePath))

const quickOptions = computed(() => {
  const index = tabsStore.tabs.findIndex(tab => tab.path === tabsStore.activePath)
  const hasLeft = index > -1 && tabsStore.tabs.slice(0, index).some(tab => !tab.affix)
  const hasRight = index > -1 && tabsStore.tabs.slice(index + 1).some(tab => !tab.affix)
  const hasOthers = tabsStore.tabs.some((tab, i) => i !== index && !tab.affix)
  return [
    { key: 'refresh', label: t('tabs.refresh'), disabled: !activeTab.value, icon: () => h(AppIcon, { icon: 'i-carbon-renew' }) },
    { key: 'closeCurrent', label: t('tabs.closeCurrent'), disabled: !activeTab.value || Boolean(activeTab.value.affix), icon: () => h(AppIcon, { icon: 'i-carbon-close' }) },
    { key: 'closeLeft', label: t('tabs.closeLeft'), disabled: !hasLeft, icon: () => h(AppIcon, { icon: 'i-carbon-arrow-left' }) },
    { key: 'closeRight', label: t('tabs.closeRight'), disabled: !hasRight, icon: () => h(AppIcon, { icon: 'i-carbon-arrow-right' }) },
    { key: 'closeOthers', label: t('tabs.closeOthers'), disabled: !hasOthers, icon: () => h(AppIcon, { icon: 'i-carbon-subtract' }) },
    { key: 'closeAll', label: t('tabs.closeAll'), icon: () => h(AppIcon, { icon: 'i-carbon-close-outline' }) },
  ]
})

function handleQuickSelect(key) {
  const tab = activeTab.value
  if (!tab)
    return
  if (key === 'refresh') {
    tabsStore.refresh(tab.path)
  }
  else if (key === 'closeCurrent') {
    handleClose(tab)
  }
  else if (key === 'closeLeft' || key === 'closeRight') {
    const next = key === 'closeLeft' ? tabsStore.closeLeft(tab.path) : tabsStore.closeRight(tab.path)
    if (next)
      router.push(next)
  }
  else if (key === 'closeOthers') {
    tabsStore.closeOthers(tab.path)
  }
  else if (key === 'closeAll') {
    const next = tabsStore.closeAll()
    if (route.path !== next)
      router.push(next)
  }
}
</script>

<template>
  <div class="tabs-bar h-10 flex shrink-0 items-end">
    <div class="min-w-0 flex flex-1 items-end overflow-x-auto px-2">
      <div
        v-for="tab in tabsStore.tabs"
        :key="tab.path"
        class="chrome-tab flex shrink-0 cursor-pointer items-center gap-1.5 px-3 text-xs"
        :class="tab.path === tabsStore.activePath
          ? 'active'
          : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'"
        :style="tab.path === tabsStore.activePath ? { color: appStore.primaryColor } : undefined"
        @click="handleClick(tab)"
        @contextmenu.prevent="openContextMenu($event, tab)"
      >
        <AppIcon v-if="tab.affix" icon="i-carbon-pin" :size="12" />
        <span>{{ t(tab.title) }}</span>
        <span
          v-if="!tab.affix"
          class="flex-center rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
          @click.stop="handleClose(tab)"
        >
          <AppIcon icon="i-carbon-close" :size="12" />
        </span>
      </div>
    </div>

    <div class="flex shrink-0 items-center self-stretch border-l border-gray-300 px-2 dark:border-gray-600">
      <NDropdown
        trigger="click"
        placement="bottom-end"
        :options="quickOptions"
        @select="handleQuickSelect"
      >
        <button
          type="button"
          class="h-6 w-6 flex-center cursor-pointer border-none rounded bg-transparent p-0 text-gray-500 hover:bg-black/10 dark:text-gray-400 dark:hover:bg-white/10"
        >
          <AppIcon icon="i-carbon-chevron-down" :size="14" />
        </button>
      </NDropdown>
    </div>

    <NDropdown
      placement="bottom-start"
      trigger="manual"
      :show="ctx.show"
      :x="ctx.x"
      :y="ctx.y"
      :options="ctxOptions"
      @select="handleCtxSelect"
      @clickoutside="ctx.show = false"
    />
  </div>
</template>

<style scoped>
/* Chrome 风格标签：浅灰标签条，激活标签背景与内容区同色形成融合；
   颜色走 CSS 变量以便暗色整体切换（html.dark 由 App.vue 维护）。 */
.tabs-bar {
  --tabs-bg: #f1f2f4;
  --tab-active-bg: #f9fafb; /* = 内容区 bg-gray-50 */
  background: var(--tabs-bg);
}

html.dark .tabs-bar {
  --tabs-bg: #18181c;
  --tab-active-bg: #101014; /* = Naive 暗色布局底色 */
}

.chrome-tab {
  position: relative;
  height: 34px;
  border-radius: 8px 8px 0 0;
  transition: background-color 0.2s, color 0.2s;
}

.chrome-tab:not(.active):hover {
  background: rgba(0, 0, 0, 0.06);
}

html.dark .chrome-tab:not(.active):hover {
  background: rgba(255, 255, 255, 0.08);
}

.chrome-tab.active {
  background: var(--tab-active-bg);
}

/* 底部外凹角（Chrome 标签底部向外张开的反向圆角）：
   伪元素置于标签底部两外侧，radial-gradient 抠出四分之一圆。 */
.chrome-tab.active::before,
.chrome-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  width: 8px;
  height: 8px;
  pointer-events: none;
}

.chrome-tab.active::before {
  left: -8px;
  background: radial-gradient(circle 8px at 0 0, transparent 7.5px, var(--tab-active-bg) 8px);
}

.chrome-tab.active::after {
  right: -8px;
  background: radial-gradient(circle 8px at 100% 0, transparent 7.5px, var(--tab-active-bg) 8px);
}

/* 相邻未激活标签间的细分隔线（激活标签两侧不显示） */
.chrome-tab + .chrome-tab:not(.active)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 14px;
  background: rgba(0, 0, 0, 0.15);
}

html.dark .chrome-tab + .chrome-tab:not(.active)::before {
  background: rgba(255, 255, 255, 0.15);
}

.chrome-tab.active + .chrome-tab:not(.active)::before {
  content: none;
}
</style>
