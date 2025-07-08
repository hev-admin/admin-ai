import request from '@/utils/request.js'

export const logApi = {
  getList(params) {
    return request.get('/logs', { params })
  },
}
