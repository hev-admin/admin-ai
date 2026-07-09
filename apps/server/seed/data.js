import { MENU_TYPE, USER_STATUS } from '../src/constants.js'

// 种子数据单一定义源（REQUIREMENTS §6）：Prisma 经 prisma/seed.js、Mongo 经 seed/mongo.js（M4 #25）
// 消费同一份定义，保证两套实现演示数据一致。节点用 key 互相引用，入库时映射为真实 id。

/** 种子账号统一明文密码（seed 时经 bcryptjs 哈希入库，REQUIREMENTS §4.3） */
export const SEED_PASSWORD = '123456'

/**
 * 菜单树：目录 / 菜单 / 按钮三类同表（§4.4）。
 * - name 为 i18n key，前端据此翻译标题（i18n 于 M3 #22 接入）
 * - icon 为 UnoCSS preset-icons 图标类名，web 侧 safelist 由本文件自动派生
 *   （collectMenuIcons，M6 #39）——运行时经菜单管理新增的图标另见 uno.config.js 的手工扩展位
 * - 按钮节点的 key 即权限码，便于按 :delete 后缀筛选删除类权限
 */
export const menuTree = [
  {
    key: 'dashboard',
    type: MENU_TYPE.menu,
    name: 'menu.dashboard',
    path: '/dashboard',
    component: 'dashboard/index',
    icon: 'i-carbon-dashboard',
    sort: 1,
    keepAlive: true,
  },
  {
    key: 'system',
    type: MENU_TYPE.dir,
    name: 'menu.system',
    path: '/system',
    icon: 'i-carbon-settings',
    sort: 2,
    children: [
      {
        key: 'system:users',
        type: MENU_TYPE.menu,
        name: 'menu.system.users',
        path: '/system/users',
        component: 'system/users/index',
        icon: 'i-carbon-user-multiple',
        sort: 1,
        keepAlive: true,
        children: [
          { key: 'sys:user:list', type: MENU_TYPE.button, name: 'menu.system.users.list', permission: 'sys:user:list', sort: 0 },
          { key: 'sys:user:add', type: MENU_TYPE.button, name: 'menu.system.users.add', permission: 'sys:user:add', sort: 1 },
          { key: 'sys:user:edit', type: MENU_TYPE.button, name: 'menu.system.users.edit', permission: 'sys:user:edit', sort: 2 },
          { key: 'sys:user:delete', type: MENU_TYPE.button, name: 'menu.system.users.delete', permission: 'sys:user:delete', sort: 3 },
          { key: 'sys:user:status', type: MENU_TYPE.button, name: 'menu.system.users.status', permission: 'sys:user:status', sort: 4 },
          { key: 'sys:user:resetPwd', type: MENU_TYPE.button, name: 'menu.system.users.resetPwd', permission: 'sys:user:resetPwd', sort: 5 },
          { key: 'sys:user:assignRole', type: MENU_TYPE.button, name: 'menu.system.users.assignRole', permission: 'sys:user:assignRole', sort: 6 },
        ],
      },
      {
        key: 'system:roles',
        type: MENU_TYPE.menu,
        name: 'menu.system.roles',
        path: '/system/roles',
        component: 'system/roles/index',
        icon: 'i-carbon-user-role',
        sort: 2,
        keepAlive: true,
        children: [
          { key: 'sys:role:list', type: MENU_TYPE.button, name: 'menu.system.roles.list', permission: 'sys:role:list', sort: 0 },
          { key: 'sys:role:add', type: MENU_TYPE.button, name: 'menu.system.roles.add', permission: 'sys:role:add', sort: 1 },
          { key: 'sys:role:edit', type: MENU_TYPE.button, name: 'menu.system.roles.edit', permission: 'sys:role:edit', sort: 2 },
          { key: 'sys:role:delete', type: MENU_TYPE.button, name: 'menu.system.roles.delete', permission: 'sys:role:delete', sort: 3 },
          { key: 'sys:role:assignPerm', type: MENU_TYPE.button, name: 'menu.system.roles.assignPerm', permission: 'sys:role:assignPerm', sort: 4 },
        ],
      },
      {
        key: 'system:menus',
        type: MENU_TYPE.menu,
        name: 'menu.system.menus',
        path: '/system/menus',
        component: 'system/menus/index',
        icon: 'i-carbon-list',
        sort: 3,
        keepAlive: true,
        children: [
          { key: 'sys:menu:list', type: MENU_TYPE.button, name: 'menu.system.menus.list', permission: 'sys:menu:list', sort: 0 },
          { key: 'sys:menu:add', type: MENU_TYPE.button, name: 'menu.system.menus.add', permission: 'sys:menu:add', sort: 1 },
          { key: 'sys:menu:edit', type: MENU_TYPE.button, name: 'menu.system.menus.edit', permission: 'sys:menu:edit', sort: 2 },
          { key: 'sys:menu:delete', type: MENU_TYPE.button, name: 'menu.system.menus.delete', permission: 'sys:menu:delete', sort: 3 },
        ],
      },
    ],
  },
  {
    key: 'profile',
    type: MENU_TYPE.menu,
    name: 'menu.profile',
    path: '/profile',
    component: 'profile/index',
    icon: 'i-carbon-user-avatar',
    sort: 99,
    hidden: true,
  },
]

/** 深度优先平铺菜单树，附带 parentKey，供入库时先父后子建立关联 */
export function flattenMenus(tree, parentKey = null, acc = []) {
  for (const node of tree) {
    const { children, ...rest } = node
    acc.push({ ...rest, parentKey })
    if (children?.length)
      flattenMenus(children, node.key, acc)
  }
  return acc
}

/**
 * 种子菜单树用到的全部图标类名（去重）——apps/web/uno.config.js 据此派生 safelist
 * 单一来源（M6 #39）：seed 增删图标无需再手工同步 uno 配置。
 */
export function collectMenuIcons(tree = menuTree) {
  return [...new Set(flattenMenus(tree).map(menu => menu.icon).filter(Boolean))]
}

const allMenuKeys = flattenMenus(menuTree).map(menu => menu.key)

/** 三角色（REQUIREMENTS §4.3）：super 全量；admin 无删除类按钮；user 仅工作台与个人中心 */
export const roleSeeds = [
  {
    code: 'super',
    name: '超级管理员',
    remark: '拥有全部菜单与按钮权限',
    menuKeys: [...allMenuKeys],
  },
  {
    code: 'admin',
    name: '管理员',
    remark: '全部菜单，无删除类按钮权限',
    menuKeys: allMenuKeys.filter(key => !key.endsWith(':delete')),
  },
  {
    code: 'user',
    name: '普通用户',
    remark: '仅工作台与个人中心',
    menuKeys: ['dashboard', 'profile'],
  },
]

export const userSeeds = [
  { username: 'super', nickname: '超级管理员', email: 'super@admin-ai.dev', avatar: null, status: USER_STATUS.enabled, roleCodes: ['super'] },
  { username: 'admin', nickname: '管理员', email: 'admin@admin-ai.dev', avatar: null, status: USER_STATUS.enabled, roleCodes: ['admin'] },
  { username: 'user', nickname: '普通用户', email: 'user@admin-ai.dev', avatar: null, status: USER_STATUS.enabled, roleCodes: ['user'] },
]

/**
 * Dashboard 假数据（REQUIREMENTS §5.1 / §6，M3 决策点 8）：不入库，server 的
 * dashboard service 直接消费（两套驱动共享同一份定义）；文案统一存 i18n key
 * （dashboard.stats.* / dashboard.source.* / dashboard.activities.*，对齐菜单 name 存 key 的先例），
 * 相对时间（近 30 天日期、动态条目时刻）由 service 在请求时组装。
 */
export const dashboardSeed = {
  /** 指标卡：trend 为同比涨跌百分比（正涨负跌）；unit 为 '%' 时按百分数展示 */
  cards: [
    { key: 'visits', value: 128932, trend: 12.4 },
    { key: 'users', value: 8642, trend: 3.1 },
    { key: 'orders', value: 4210, trend: -2.8 },
    { key: 'conversion', value: 3.26, unit: '%', trend: 0.6 },
  ],
  /** 折线图（近 30 天，末位为今天）：两条序列长度须一致 */
  trend: {
    visits: [820, 932, 901, 934, 1290, 1330, 1320, 1010, 1120, 1260, 980, 1080, 1150, 1230, 1380, 1420, 1290, 1180, 1350, 1470, 1560, 1440, 1310, 1250, 1390, 1520, 1610, 1580, 1690, 1750],
    orders: [320, 302, 341, 374, 390, 450, 420, 332, 401, 454, 290, 330, 410, 380, 470, 510, 480, 430, 460, 520, 540, 490, 450, 430, 510, 560, 580, 570, 610, 640],
  },
  /** 饼图：访问来源占比 */
  pie: [
    { key: 'search', value: 435 },
    { key: 'direct', value: 310 },
    { key: 'referral', value: 234 },
    { key: 'social', value: 155 },
    { key: 'other', value: 102 },
  ],
  /** 最近动态：offsetMinutes 为距请求时刻的分钟数 */
  activities: [
    { key: 'release', offsetMinutes: 30 },
    { key: 'newUser', offsetMinutes: 150 },
    { key: 'roleChange', offsetMinutes: 420 },
    { key: 'menuChange', offsetMinutes: 1560 },
    { key: 'backup', offsetMinutes: 2880 },
  ],
}
