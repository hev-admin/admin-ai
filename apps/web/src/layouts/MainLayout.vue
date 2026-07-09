<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppBreadcrumb from './components/AppBreadcrumb.vue'
import LangSwitch from './components/LangSwitch.vue'
import SidebarMenu from './components/SidebarMenu.vue'
import Tabs from './components/Tabs.vue'
import ThemeColorPicker from './components/ThemeColorPicker.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import { useTabsStore } from '@/stores/tabs'

// 主布局（REQUIREMENTS §3 / #15 / #19）：左侧菜单 + 顶栏（折叠/面包屑/全屏/主题/语言/用户）
// + 多标签页 + 内容区（KeepAlive 缓存名单由 tabs store 提供，Transition 过渡）。

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const tabsStore = useTabsStore()
const { dialog, message } = useFeedback()

const userOptions = computed(() => [
  { label: t('menu.profile'), key: 'profile' },
  { type: 'divider', key: 'divider' },
  { label: t('layout.logout'), key: 'logout' },
])

function handleUserAction(key) {
  if (key === 'profile') {
    router.push('/profile')
    return
  }
  if (key === 'logout') {
    dialog.warning({
      title: t('common.tip'),
      content: t('layout.logoutConfirm'),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
      onPositiveClick: async () => {
        await userStore.logout()
        message.success(t('layout.logoutSuccess'))
        router.replace('/login')
      },
    })
  }
}

// 全屏切换（§3 顶栏清单项，M2 规划查漏补充）
const isFullscreen = ref(false)
function syncFullscreen() {
  isFullscreen.value = Boolean(document.fullscreenElement)
}
function toggleFullscreen() {
  if (document.fullscreenElement)
    document.exitFullscreen()
  else
    document.documentElement.requestFullscreen()
}
onMounted(() => document.addEventListener('fullscreenchange', syncFullscreen))
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', syncFullscreen))
</script>

<template>
  <NLayout has-sider class="h-screen">
    <NLayoutSider
      bordered
      collapse-mode="width"
      :width="220"
      :collapsed-width="64"
      :collapsed="appStore.collapsed"
      :native-scrollbar="false"
    >
      <div class="h-12 flex-center gap-2 overflow-hidden whitespace-nowrap text-base font-semibold">
        <AppIcon icon="i-carbon-application-web" :size="22" class="shrink-0 text-[var(--primary-color,#2080f0)]" />
        <span v-if="!appStore.collapsed">admin-ai</span>
      </div>
      <SidebarMenu :collapsed="appStore.collapsed" />
    </NLayoutSider>

    <NLayout content-style="height: 100%; display: flex; flex-direction: column;">
      <header class="h-12 flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <NButton quaternary circle @click="appStore.toggleCollapsed()">
            <template #icon>
              <AppIcon icon="i-carbon-menu" />
            </template>
          </NButton>
          <AppBreadcrumb class="hidden md:block" />
        </div>

        <div class="flex items-center gap-2">
          <NTooltip>
            <template #trigger>
              <NButton quaternary circle @click="toggleFullscreen()">
                <template #icon>
                  <AppIcon :icon="isFullscreen ? 'i-carbon-minimize' : 'i-carbon-maximize'" />
                </template>
              </NButton>
            </template>
            {{ isFullscreen ? t('layout.exitFullscreen') : t('layout.fullscreen') }}
          </NTooltip>

          <ThemeToggle />
          <ThemeColorPicker />
          <LangSwitch />

          <NDropdown :options="userOptions" @select="handleUserAction">
            <div class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
              <NAvatar v-if="userStore.userInfo?.avatar" :src="userStore.userInfo.avatar" round :size="28" />
              <NAvatar v-else round :size="28">
                {{ (userStore.userInfo?.nickname || '?').slice(0, 1) }}
              </NAvatar>
              <span class="text-sm">{{ userStore.userInfo?.nickname || userStore.userInfo?.username }}</span>
            </div>
          </NDropdown>
        </div>
      </header>

      <Tabs />

      <main class="min-h-0 flex-1 overflow-auto bg-gray-50 p-4 dark:bg-transparent">
        <RouterView v-slot="{ Component, route }">
          <Transition name="fade-slide" mode="out-in" appear>
            <KeepAlive :include="tabsStore.cachedNames">
              <component :is="Component" :key="`${route.path}:${tabsStore.viewKey(route.path)}`" />
            </KeepAlive>
          </Transition>
        </RouterView>
      </main>
    </NLayout>
  </NLayout>
</template>

<style>
/* 内容区路由切换过渡（§3；全局类名供 Transition 使用，不 scoped） */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-12px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
