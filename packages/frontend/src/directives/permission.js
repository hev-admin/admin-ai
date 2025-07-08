import { usePermissionStore } from '@/stores/permission.js'

export const permission = {
  mounted(el, binding) {
    const permissionStore = usePermissionStore()
    const { value } = binding

    if (value) {
      const hasPermission = Array.isArray(value)
        ? value.some(p => permissionStore.hasPermission(p))
        : permissionStore.hasPermission(value)

      if (!hasPermission) {
        el.parentNode?.removeChild(el)
      }
    }
  },
}

export function setupPermissionDirective(app) {
  app.directive('permission', permission)
}
