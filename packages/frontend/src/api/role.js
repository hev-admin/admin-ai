import request from '@/utils/request.js'

export const roleApi = {
  getList(params) {
    return request.get('/roles', { params })
  },

  getAll() {
    return request.get('/roles/all')
  },

  getById(id) {
    return request.get(`/roles/${id}`)
  },

  create(data) {
    return request.post('/roles', data)
  },

  update(id, data) {
    return request.put(`/roles/${id}`, data)
  },

  delete(id) {
    return request.delete(`/roles/${id}`)
  },

  batchDelete(ids) {
    return request.post('/roles/batch-delete', { ids })
  },

  getMenus(id) {
    return request.get(`/roles/${id}/menus`)
  },

  updateMenus(id, menuIds) {
    return request.put(`/roles/${id}/menus`, { menuIds })
  },
}
