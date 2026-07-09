import { useUserStore } from '@/stores/user'

const SUPER_ROLE_CODE = 'super'

/**
 * 按钮级权限判断（REQUIREMENTS §4.2）：与 v-permission 指令共用同一实现。
 * super 角色短路放行（与后端权限中间件语义对齐）；
 * 传入数组时按「任一命中」判定。
 */
export function hasPermission(required) {
  if (!required || (Array.isArray(required) && !required.length))
    return true
  const userStore = useUserStore()
  if (userStore.roles.includes(SUPER_ROLE_CODE))
    return true
  const needed = Array.isArray(required) ? required : [required]
  return needed.some(permission => userStore.permissions.includes(permission))
}
