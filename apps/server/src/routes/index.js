import { authRoutes } from './auth.js'
import { dashboardRoutes } from './dashboard.js'
import { healthRoutes } from './health.js'
import { menusRoutes } from './menus.js'
import { rolesRoutes } from './roles.js'
import { usersRoutes } from './users.js'

/** 按资源模块注册路由，统一 /api 前缀（REQUIREMENTS §6 / §7） */
export function registerRoutes(app) {
  app.route('/api/health', healthRoutes)
  app.route('/api/auth', authRoutes)
  app.route('/api/users', usersRoutes)
  app.route('/api/roles', rolesRoutes)
  app.route('/api/menus', menusRoutes)
  app.route('/api/dashboard', dashboardRoutes)
}
