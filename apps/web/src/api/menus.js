import request from '@/utils/request'

/** 树形查询：含按钮节点的完整树（菜单管理与角色分配权限共用） */
export function getMenuTreeApi() {
  return request.get('/menus')
}

export function createMenuApi(data) {
  return request.post('/menus', data)
}

export function updateMenuApi(id, data) {
  return request.put(`/menus/${id}`, data)
}

/** 删除：服务端级联删除全部子孙节点 */
export function removeMenuApi(id) {
  return request.delete(`/menus/${id}`)
}
