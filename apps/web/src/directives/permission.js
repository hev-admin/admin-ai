import { hasPermission } from '@/utils/permission'

/**
 * 按钮级权限指令（REQUIREMENTS §4.2）：`v-permission="'sys:user:add'"`，
 * 支持数组「任一命中」。无权限时直接移除元素（非隐藏）。
 * 注意：登录期内权限码不变（内嵌 JWT），无需响应式重挂载。
 */
export const permissionDirective = {
  mounted(el, binding) {
    if (!hasPermission(binding.value))
      el.parentNode?.removeChild(el)
  },
}
