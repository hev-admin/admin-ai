import { dashboardSeed } from '../../seed/data.js'

/**
 * 工作台统计（REQUIREMENTS §5.1 / M3 决策点 8）：种子假数据 + 请求时组装相对日期。
 * 不查库，与 DB_DRIVER 无关；指标卡名称 / 饼图分类 / 动态条目均返回 i18n key，前端翻译。
 */
export function getDashboardStats() {
  const now = new Date()
  const days = dashboardSeed.trend.visits.length
  const dates = Array.from({ length: days }, (_, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() - (days - 1 - index))
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}-${day}`
  })

  const activities = dashboardSeed.activities.map(({ key, offsetMinutes }) => ({
    key,
    time: new Date(now.getTime() - offsetMinutes * 60_000).toISOString(),
  }))

  return {
    cards: dashboardSeed.cards,
    trend: {
      dates,
      series: { visits: dashboardSeed.trend.visits, orders: dashboardSeed.trend.orders },
    },
    pie: dashboardSeed.pie,
    activities,
  }
}
