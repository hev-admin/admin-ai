<script setup>
import { usePermissionStore } from '@/stores/permission.js'
import { useThemeStore } from '@/stores/theme.js'

defineProps({
  collapsed: Boolean,
})

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.theme === 'dark')

const route = useRoute()
const router = useRouter()
const permissionStore = usePermissionStore()

// 默认菜单（当权限菜单未加载时使用）
const defaultMenus = [
  { path: '/', icon: 'i-lucide-home', title: '仪表盘' },
]

// 转换后端菜单格式为 naive-ui 菜单格式
function transformMenus(menus) {
  return menus.map((menu) => {
    const item = {
      key: menu.path || menu.title,
      label: menu.title,
      icon: () => h('span', { class: menu.icon || 'i-lucide-circle' }),
    }
    if (menu.children?.length) {
      item.children = transformMenus(menu.children)
    }
    return item
  })
}

const menuOptions = computed(() => {
  if (permissionStore.menus.length > 0) {
    return transformMenus(permissionStore.menus)
  }
  return transformMenus(defaultMenus)
})

const activeKey = computed(() => route.path)

function handleMenuSelect(key) {
  if (key) {
    router.push(key)
  }
}

onMounted(() => {
  if (!permissionStore.loaded) {
    permissionStore.init()
  }
})
</script>

<template>
  <aside
    transition-all
    duration-300
    class="bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-r border-gray-200 dark:border-gray-700"
    :class="collapsed ? 'w-16' : 'w-60'"
  >
    <div h-14 flex items-center justify-center border-b class="border-gray-200 dark:border-gray-700">
      <span v-if="!collapsed" text-xl font-bold class="text-gray-800 dark:text-white">Admin AI</span>
      <span v-else text-xl font-bold class="text-gray-800 dark:text-white">A</span>
    </div>
    <n-menu
      :value="activeKey"
      :options="menuOptions"
      :collapsed="collapsed"
      :collapsed-width="64"
      :collapsed-icon-size="22"
      :inverted="isDark"
      @update:value="handleMenuSelect"
    />
  </aside>
</template>
