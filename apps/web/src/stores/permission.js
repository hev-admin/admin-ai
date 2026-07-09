import { defineStore } from 'pinia'
import { ref } from 'vue'
import router from '@/router'

// 动态路由与菜单树（REQUIREMENTS §4.2 / §11）。
// M1 采取「叶子菜单平铺注册到主布局子路由」策略：目录节点只参与侧边栏树形渲染（M2 #15）。

const viewModules = import.meta.glob('/src/views/**/*.vue')
const FALLBACK_VIEW = '/src/views/exception/under-construction.vue'

function toRouteName(path) {
  return path
    .split('/')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function flattenTree(nodes, acc = []) {
  for (const node of nodes) {
    acc.push(node)
    if (node.children?.length)
      flattenTree(node.children, acc)
  }
  return acc
}

function menuToRoute(menu) {
  // 组件路径未实现的页面回退到「建设中」占位视图，保证菜单可点
  const loader = viewModules[`/src/views/${menu.component}.vue`] || viewModules[FALLBACK_VIEW]
  const name = toRouteName(menu.path)
  return {
    path: menu.path,
    name,
    // 页面 SFC 均为 index.vue（Vue 推断组件名全部同名），KeepAlive include 无法区分；
    // 解析后浅拷贝并以路由 name 作为显式组件名（M3 决策点 3），include 即按路由 name 匹配
    component: () => loader().then(mod => ({ ...mod.default, name })),
    meta: {
      title: menu.name,
      icon: menu.icon,
      hidden: menu.hidden,
      keepAlive: menu.keepAlive,
    },
  }
}

export const usePermissionStore = defineStore('permission', () => {
  const menus = ref([])
  const isLoaded = ref(false)
  const addedRouteNames = ref([])

  /** 根据 getUserInfo 返回的菜单树生成路由并注入主布局（§4.2 动态路由） */
  function buildRoutes(menuTree = []) {
    menus.value = menuTree
    flattenTree(menuTree)
      .filter(menu => menu.type === 2 && menu.path && !menu.path.startsWith('http'))
      .forEach((menu) => {
        const route = menuToRoute(menu)
        router.addRoute('Layout', route)
        addedRouteNames.value.push(route.name)
      })
    isLoaded.value = true
  }

  function reset() {
    addedRouteNames.value.forEach((name) => {
      if (router.hasRoute(name))
        router.removeRoute(name)
    })
    addedRouteNames.value = []
    menus.value = []
    isLoaded.value = false
  }

  return { menus, isLoaded, buildRoutes, reset }
})
