import request from '@/utils/request'

export function listUsersApi(params) {
  return request.get('/users', { params })
}

export function createUserApi(data) {
  return request.post('/users', data)
}

export function updateUserApi(id, data) {
  return request.put(`/users/${id}`, data)
}

export function removeUserApi(id) {
  return request.delete(`/users/${id}`)
}

/** 批量删除：DELETE /api/users，body { ids }（REQUIREMENTS §7） */
export function removeUsersApi(ids) {
  return request.delete('/users', { data: { ids } })
}

export function setUserStatusApi(id, status) {
  return request.patch(`/users/${id}/status`, { status })
}

export function resetUserPasswordApi(id, password) {
  return request.put(`/users/${id}/password`, { password })
}

export function assignUserRolesApi(id, roleIds) {
  return request.put(`/users/${id}/roles`, { roleIds })
}
