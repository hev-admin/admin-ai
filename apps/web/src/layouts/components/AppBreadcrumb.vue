<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import { findMenuChain } from '@/utils/menu'

// 面包屑（#15）：按当前路由在菜单树中的祖先链渲染；
// 不在菜单树中的页面（如 403）回退为路由 meta.title 单级显示。

const { t } = useI18n()
const route = useRoute()
const permissionStore = usePermissionStore()

const items = computed(() => {
  const chain = findMenuChain(permissionStore.menus, route.path)
  if (chain.length)
    return chain.map(node => ({ key: node.id, icon: node.icon, label: t(node.name) }))
  const title = route.meta?.title
  return title ? [{ key: route.path, icon: null, label: t(title) }] : []
})
</script>

<template>
  <NBreadcrumb>
    <!-- 行内流对齐:文字直接提供真实基线(与分隔符/相邻项精确对齐),
         图标靠 AppIcon 自带的 vertical-align: middle 贴文字;不能用 inline-flex
         包裹(空图标 span 会把容器基线合成到图标底边,整块上浮)。
         图标与文字须同行书写,避免模板空白折叠出多余间距。 -->
    <NBreadcrumbItem v-for="item in items" :key="item.key" :clickable="false">
      <AppIcon v-if="item.icon" :icon="item.icon" :size="14" class="mr-1" />{{ item.label }}
    </NBreadcrumbItem>
  </NBreadcrumb>
</template>
