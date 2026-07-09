<script setup>
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'
import { usePermissionStore } from '@/stores/permission'
import { findMenuChain } from '@/utils/menu'

// 侧边栏菜单（REQUIREMENTS §3 / #15）：由 permission store 的菜单树渲染，
// 支持多级、图标、hidden 过滤、外链新窗口打开；折叠状态由外层 NLayoutSider 联动。

const MENU_TYPE_DIR = 1

const props = defineProps({
  collapsed: { type: Boolean, default: false },
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const permissionStore = usePermissionStore()

function toOptions(nodes) {
  return (nodes || [])
    .filter(node => !node.hidden)
    .map((node) => {
      const children = node.children?.length ? toOptions(node.children) : []
      // 子级全被隐藏/为空的目录不渲染（点了也无路由可去）
      if (node.type === MENU_TYPE_DIR && !children.length)
        return null
      return {
        key: node.path,
        label: t(node.name),
        icon: node.icon ? () => h(AppIcon, { icon: node.icon }) : undefined,
        children: children.length ? children : undefined,
      }
    })
    .filter(Boolean)
}

const options = computed(() => toOptions(permissionStore.menus))
const activeKey = computed(() => route.path)
// 初次进入时展开当前路由的祖先目录（此后展开状态交给用户操作）
const defaultExpandedKeys = findMenuChain(permissionStore.menus, route.path)
  .slice(0, -1)
  .map(node => node.path)

function handleSelect(key) {
  if (key.startsWith('http')) {
    window.open(key, '_blank', 'noopener')
    return
  }
  router.push(key)
}
</script>

<template>
  <NMenu
    :collapsed="props.collapsed"
    :options="options"
    :value="activeKey"
    :default-expanded-keys="defaultExpandedKeys"
    :collapsed-width="64"
    :collapsed-icon-size="20"
    :indent="18"
    accordion
    @update:value="handleSelect"
  />
</template>
