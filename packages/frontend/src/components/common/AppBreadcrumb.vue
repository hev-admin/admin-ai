<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  const crumbs = matched.map(item => ({
    path: item.path,
    title: item.meta.title,
    icon: item.meta.icon,
  }))

  // Add home breadcrumb at the beginning if not already there
  if (crumbs.length > 0 && crumbs[0].path !== '/') {
    crumbs.unshift({
      path: '/',
      title: '首页',
      icon: 'home',
    })
  }

  return crumbs
})

function handleNavigate(item) {
  if (item.path) {
    router.push(item.path)
  }
}
</script>

<template>
  <div v-if="breadcrumbs.length > 0" un-flex="~ items-center gap-2" un-mb-4>
    <template v-for="(item, index) in breadcrumbs" :key="item.path || index">
      <n-button
        v-if="index < breadcrumbs.length - 1"
        text
        size="small"
        @click="handleNavigate(item)"
      >
        {{ item.title }}
      </n-button>
      <span v-else un-text="gray-600 dark:gray-400">
        {{ item.title }}
      </span>
      <span
        v-if="index < breadcrumbs.length - 1"
        un-text="gray-400 dark:gray-600"
      >
        /
      </span>
    </template>
  </div>
</template>
