/** 菜单节点类型：目录 / 菜单 / 按钮 三类同表（REQUIREMENTS §4.4） */
export const MENU_TYPE = { dir: 1, menu: 2, button: 3 }

/** 用户状态 */
export const USER_STATUS = { disabled: 0, enabled: 1 }

/** 超级管理员角色标识：聚合用户信息时短路为全部菜单 + 全部按钮码（§4.5） */
export const SUPER_ROLE_CODE = 'super'
