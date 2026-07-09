import { Hono } from 'hono'
import { getDashboardStats } from '../services/dashboard.js'
import { ok } from '../utils/response.js'

// 工作台统计（REQUIREMENTS §7）：仅登录校验、不挂权限码——user 角色也可见工作台（M3 决策点 8）

export const dashboardRoutes = new Hono()

dashboardRoutes.get('/stats', (c) => {
  return ok(c, getDashboardStats())
})
