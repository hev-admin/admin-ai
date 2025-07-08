import request from '@/utils/request.js'

export const userApi = {
  getList(params) {
    return request.get('/users', { params })
  },

  getById(id) {
    return request.get(`/users/${id}`)
  },

  create(data) {
    return request.post('/users', data)
  },

  update(id, data) {
    return request.put(`/users/${id}`, data)
  },

  delete(id) {
    return request.delete(`/users/${id}`)
  },

  batchDelete(ids) {
    return request.post('/users/batch-delete', { ids })
  },

  updateStatus(id, status) {
    return request.put(`/users/${id}/status`, { status })
  },

  resetPassword(id, password) {
    return request.put(`/users/${id}/reset-password`, { password })
  },
}
