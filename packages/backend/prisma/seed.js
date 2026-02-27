import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '../src/generated/client/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 数据库文件绝对路径
const dbPath = path.join(__dirname, 'dev.db')

// 创建 Prisma adapter（Prisma 7 使用 better-sqlite3）
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
})

// 使用 adapter 实例化 PrismaClient
const prisma = new PrismaClient({ adapter })

async function main() {
  // 创建管理员角色
  const adminRole = await prisma.role.upsert({
    where: { code: 'admin' },
    update: {},
    create: {
      name: '管理员',
      code: 'admin',
      description: '系统管理员',
      status: 1,
      sort: 0,
    },
  })

  // 创建普通用户角色
  await prisma.role.upsert({
    where: { code: 'user' },
    update: {},
    create: {
      name: '普通用户',
      code: 'user',
      description: '普通用户',
      status: 1,
      sort: 1,
    },
  })

  // 创建管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      nickname: '管理员',
      status: 1,
    },
  })

  // 关联管理员角色
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  })

  // 创建菜单
  const menus = await createMenus()

  // 给管理员角色分配所有菜单权限
  for (const menu of menus) {
    await prisma.rolePermission.upsert({
      where: { roleId_menuId: { roleId: adminRole.id, menuId: menu.id } },
      update: {},
      create: { roleId: adminRole.id, menuId: menu.id },
    })
  }

  console.log('Seed completed!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

async function createMenus() {
  const allMenus = []

  // 仪表盘
  const dashboard = await prisma.menu.upsert({
    where: { id: 'dashboard' },
    update: {},
    create: {
      id: 'dashboard',
      name: 'Dashboard',
      path: '/',
      title: '仪表盘',
      icon: 'i-lucide-home',
      type: 2,
      sort: 0,
    },
  })
  allMenus.push(dashboard)

  // 系统管理目录
  const system = await prisma.menu.upsert({
    where: { id: 'system' },
    update: {},
    create: {
      id: 'system',
      name: 'System',
      title: '系统管理',
      icon: 'i-lucide-settings',
      type: 1,
      sort: 1,
    },
  })
  allMenus.push(system)

  // 用户管理
  const user = await prisma.menu.upsert({
    where: { id: 'system-user' },
    update: { permission: 'system:user:list' },
    create: {
      id: 'system-user',
      parentId: 'system',
      name: 'UserManagement',
      path: '/system/user',
      title: '用户管理',
      icon: 'i-lucide-users',
      permission: 'system:user:list',
      type: 2,
      sort: 0,
    },
  })
  allMenus.push(user)

  // 角色管理
  const role = await prisma.menu.upsert({
    where: { id: 'system-role' },
    update: { permission: 'system:role:list' },
    create: {
      id: 'system-role',
      parentId: 'system',
      name: 'RoleManagement',
      path: '/system/role',
      title: '角色管理',
      icon: 'i-lucide-shield',
      permission: 'system:role:list',
      type: 2,
      sort: 1,
    },
  })
  allMenus.push(role)

  // 菜单管理
  const menu = await prisma.menu.upsert({
    where: { id: 'system-menu' },
    update: { permission: 'system:menu:list' },
    create: {
      id: 'system-menu',
      parentId: 'system',
      name: 'MenuManagement',
      path: '/system/menu',
      title: '菜单管理',
      icon: 'i-lucide-menu',
      permission: 'system:menu:list',
      type: 2,
      sort: 2,
    },
  })
  allMenus.push(menu)

  // 操作日志
  const log = await prisma.menu.upsert({
    where: { id: 'system-log' },
    update: { permission: 'system:log:view' },
    create: {
      id: 'system-log',
      parentId: 'system',
      name: 'LogManagement',
      path: '/system/log',
      title: '操作日志',
      icon: 'i-lucide-file-text',
      permission: 'system:log:view',
      type: 2,
      sort: 3,
    },
  })
  allMenus.push(log)

  // 系统设置
  const setting = await prisma.menu.upsert({
    where: { id: 'system-setting' },
    update: { permission: 'system:setting:view' },
    create: {
      id: 'system-setting',
      parentId: 'system',
      name: 'SystemSetting',
      path: '/system/setting',
      title: '系统设置',
      icon: 'i-lucide-sliders',
      permission: 'system:setting:view',
      type: 2,
      sort: 4,
    },
  })
  allMenus.push(setting)

  return allMenus
}
