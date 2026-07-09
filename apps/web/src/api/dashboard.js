import request from '@/utils/request'

export function getDashboardStatsApi() {
  return request.get('/dashboard/stats')
}
