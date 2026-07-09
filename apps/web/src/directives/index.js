import { permissionDirective } from './permission.js'

/** 全局自定义指令统一注册（main.js 调用） */
export function setupDirectives(app) {
  app.directive('permission', permissionDirective)
}
