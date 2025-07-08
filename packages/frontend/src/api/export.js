import request from '@/utils/request.js'

export const exportApi = {
  exportUsers() {
    return request.get('/export/users')
  },

  exportRoles() {
    return request.get('/export/roles')
  },

  exportMenus() {
    return request.get('/export/menus')
  },
}
