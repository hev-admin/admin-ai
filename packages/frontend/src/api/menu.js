import request from '@/utils/request.js'

export const menuApi = {
  getTree() {
    return request.get('/menus')
  },

  getList() {
    return request.get('/menus/list')
  },

  getById(id) {
    return request.get(`/menus/${id}`)
  },

  create(data) {
    return request.post('/menus', data)
  },

  update(id, data) {
    return request.put(`/menus/${id}`, data)
  },

  delete(id) {
    return request.delete(`/menus/${id}`)
  },

  batchDelete(ids) {
    return request.post('/menus/batch-delete', { ids })
  },

  getUserMenus() {
    return request.get('/menus/user')
  },

  getUserPermissions() {
    return request.get('/menus/permissions')
  },
}
