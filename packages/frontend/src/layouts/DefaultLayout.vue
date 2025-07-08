<script setup>
import { ref } from 'vue'
import AppBreadcrumb from '@/components/common/AppBreadcrumb.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import AppSidebar from '@/components/common/AppSidebar.vue'
import TabsView from '@/components/TabsView/index.vue'
import { useTabsStore } from '@/stores/tabs.js'

const collapsed = ref(false)
const tabsStore = useTabsStore()

function toggleSidebar() {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <div class="flex h-full">
    <AppSidebar :collapsed="collapsed" />
    <div class="flex flex-col flex-1 overflow-hidden">
      <AppHeader :collapsed="collapsed" @toggle="toggleSidebar" />
      <TabsView />
      <main class="flex-1 overflow-auto p-4 bg-white dark:bg-gray-900">
        <AppBreadcrumb />
        <RouterView v-slot="{ Component }">
          <KeepAlive :include="tabsStore.cachedViews">
            <component :is="Component" />
          </KeepAlive>
        </RouterView>
      </main>
    </div>
  </div>
</template>
