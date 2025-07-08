import request from '@/utils/request.js'

export const settingApi = {
  getAll() {
    return request.get('/settings')
  },

  save(settings) {
    return request.put('/settings', { settings })
  },
}
