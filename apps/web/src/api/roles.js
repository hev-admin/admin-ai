import request from '@/utils/request'

export function listRolesApi(params) {
  return request.get('/roles', { params })
}

export function createRoleApi(data) {
  return request.post('/roles', data)
}

export function updateRoleApi(id, data) {
  return request.put(`/roles/${id}`, data)
}

export function removeRoleApi(id) {
  return request.delete(`/roles/${id}`)
}

/** 分配权限：菜单勾选集合（含按钮节点）整体重设 */
export function assignRoleMenusApi(id, menuIds) {
  return request.put(`/roles/${id}/menus`, { menuIds })
}
