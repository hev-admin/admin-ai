<script setup>
import { ref } from 'vue'
import AppBreadcrumb from '@/components/common/AppBreadcrumb.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import AppSidebar from '@/components/common/AppSidebar.vue'

const collapsed = ref(false)

function toggleSidebar() {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <div class="flex h-full">
    <AppSidebar :collapsed="collapsed" />
    <div class="flex flex-col flex-1 overflow-hidden">
      <AppHeader :collapsed="collapsed" @toggle="toggleSidebar" />
      <main class="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900">
        <AppBreadcrumb />
        <RouterView />
      </main>
    </div>
  </div>
</template>
