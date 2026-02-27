import { beforeEach, describe, expect, it, vi } from 'vitest'
import prisma from '../../src/config/database.js'
import { menuService } from '../../src/services/menu.js'
import { cache } from '../../src/utils/cache.js'

// Mock dependencies
vi.mock('../../src/config/database.js', () => ({
  default: {
    menu: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    userRole: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('../../src/utils/cache.js', () => ({
  cache: {
    getOrSet: vi.fn(),
    delete: vi.fn(),
    deletePattern: vi.fn(),
  },
  cacheKeys: {
    menuTree: () => 'menu:tree',
    userMenus: userId => `user:${userId}:menus`,
    userPermissions: userId => `user:${userId}:permissions`,
  },
  cacheTTL: {
    SHORT: 60000,
    MEDIUM: 300000,
    LONG: 900000,
    HOUR: 3600000,
  },
}))

describe('menuService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTree', () => {
    it('should return cached menu tree via cache.getOrSet', async () => {
      const mockTree = [
        { id: '1', parentId: null, name: 'Dashboard', children: [] },
      ]
      cache.getOrSet.mockResolvedValue(mockTree)

      const result = await menuService.getTree()

      expect(result).toEqual(mockTree)
      expect(cache.getOrSet).toHaveBeenCalledWith(
        'menu:tree',
        expect.any(Function),
        300000,
      )
    })

    it('should build tree from flat menus when cache misses', async () => {
      const flatMenus = [
        { id: '1', parentId: null, name: 'System', sort: 1 },
        { id: '2', parentId: '1', name: 'Users', sort: 1 },
        { id: '3', parentId: '1', name: 'Roles', sort: 2 },
        { id: '4', parentId: null, name: 'Dashboard', sort: 0 },
      ]

      // Execute the factory function that would be passed to getOrSet
      cache.getOrSet.mockImplementation(async (_key, factory, _ttl) => {
        return factory()
      })
      prisma.menu.findMany.mockResolvedValue(flatMenus)

      const result = await menuService.getTree()

      // Verify tree structure
      expect(result).toHaveLength(2) // Dashboard and System at root
      const systemMenu = result.find(m => m.name === 'System')
      expect(systemMenu.children).toHaveLength(2)
      expect(systemMenu.children[0].name).toBe('Users')
      expect(systemMenu.children[1].name).toBe('Roles')
    })
  })

  describe('getList', () => {
    it('should return flat list of menus', async () => {
      const mockMenus = [
        { id: '1', parentId: null, name: 'Dashboard', sort: 1 },
        { id: '2', parentId: null, name: 'System', sort: 2 },
      ]
      prisma.menu.findMany.mockResolvedValue(mockMenus)

      const result = await menuService.getList()

      expect(result).toEqual(mockMenus)
      expect(prisma.menu.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { sort: 'asc' },
        }),
      )
    })
  })

  describe('getById', () => {
    it('should return menu by id', async () => {
      const mockMenu = { id: '1', name: 'Dashboard' }
      prisma.menu.findUnique.mockResolvedValue(mockMenu)

      const result = await menuService.getById('1')

      expect(result).toEqual(mockMenu)
      expect(prisma.menu.findUnique).toHaveBeenCalledWith({ where: { id: '1' } })
    })

    it('should return null when menu not found', async () => {
      prisma.menu.findUnique.mockResolvedValue(null)

      const result = await menuService.getById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create menu and invalidate cache', async () => {
      const mockMenu = { id: '1', name: 'New Menu', path: '/new' }
      prisma.menu.create.mockResolvedValue(mockMenu)

      const result = await menuService.create({ name: 'New Menu', path: '/new' })

      expect(result).toEqual(mockMenu)
      expect(prisma.menu.create).toHaveBeenCalledWith({
        data: { name: 'New Menu', path: '/new' },
      })
      expect(cache.deletePattern).toHaveBeenCalledWith('menu:*')
      expect(cache.deletePattern).toHaveBeenCalledWith('user:*:menus')
    })
  })

  describe('update', () => {
    it('should update menu and invalidate cache', async () => {
      const mockMenu = { id: '1', name: 'Updated Menu' }
      prisma.menu.update.mockResolvedValue(mockMenu)

      const result = await menuService.update('1', { name: 'Updated Menu' })

      expect(result).toEqual(mockMenu)
      expect(prisma.menu.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated Menu' },
      })
      expect(cache.deletePattern).toHaveBeenCalledWith('menu:*')
      expect(cache.deletePattern).toHaveBeenCalledWith('user:*:menus')
      expect(cache.deletePattern).toHaveBeenCalledWith('user:*:permissions')
    })
  })

  describe('delete', () => {
    it('should delete menu and invalidate cache', async () => {
      const mockMenu = { id: '1', name: 'Deleted' }
      prisma.menu.delete.mockResolvedValue(mockMenu)

      const result = await menuService.delete('1')

      expect(result).toEqual(mockMenu)
      expect(prisma.menu.delete).toHaveBeenCalledWith({ where: { id: '1' } })
      expect(cache.deletePattern).toHaveBeenCalledWith('menu:*')
      expect(cache.deletePattern).toHaveBeenCalledWith('user:*:menus')
      expect(cache.deletePattern).toHaveBeenCalledWith('user:*:permissions')
    })
  })

  describe('getUserMenus', () => {
    it('should return cached user menus via cache.getOrSet', async () => {
      const mockMenus = [
        { id: '1', name: 'Dashboard', children: [] },
      ]
      cache.getOrSet.mockResolvedValue(mockMenus)

      const result = await menuService.getUserMenus('user1')

      expect(result).toEqual(mockMenus)
      expect(cache.getOrSet).toHaveBeenCalledWith(
        'user:user1:menus',
        expect.any(Function),
        300000,
      )
    })

    it('should return empty array when user has no roles', async () => {
      cache.getOrSet.mockImplementation(async (_key, factory, _ttl) => {
        return factory()
      })
      prisma.userRole.findMany.mockResolvedValue([])

      const result = await menuService.getUserMenus('user1')

      expect(result).toEqual([])
    })

    it('should collect menu IDs from user roles and build tree', async () => {
      cache.getOrSet.mockImplementation(async (_key, factory, _ttl) => {
        return factory()
      })
      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            permissions: [
              { menuId: 'm1' },
              { menuId: 'm2' },
            ],
          },
        },
        {
          role: {
            permissions: [
              { menuId: 'm2' },
              { menuId: 'm3' },
            ],
          },
        },
      ])
      prisma.menu.findMany.mockResolvedValue([
        { id: 'm1', parentId: null, name: 'Dashboard', sort: 1 },
        { id: 'm2', parentId: null, name: 'System', sort: 2 },
        { id: 'm3', parentId: 'm2', name: 'Users', sort: 1 },
      ])

      const result = await menuService.getUserMenus('user1')

      // Should deduplicate menu IDs (m2 appears in both roles)
      expect(prisma.menu.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: { in: expect.arrayContaining(['m1', 'm2', 'm3']) },
            status: 1,
            visible: 1,
          },
        }),
      )
      // Result should be a tree
      expect(result).toHaveLength(2) // Dashboard and System at root
      const systemMenu = result.find(m => m.name === 'System')
      expect(systemMenu.children).toHaveLength(1)
      expect(systemMenu.children[0].name).toBe('Users')
    })
  })

  describe('getUserPermissions', () => {
    it('should return cached user permissions via cache.getOrSet', async () => {
      const mockPermissions = ['system:user:list', 'system:role:list']
      cache.getOrSet.mockResolvedValue(mockPermissions)

      const result = await menuService.getUserPermissions('user1')

      expect(result).toEqual(mockPermissions)
      expect(cache.getOrSet).toHaveBeenCalledWith(
        'user:user1:permissions',
        expect.any(Function),
        300000,
      )
    })

    it('should collect unique permissions from user roles', async () => {
      cache.getOrSet.mockImplementation(async (_key, factory, _ttl) => {
        return factory()
      })
      prisma.userRole.findMany.mockResolvedValue([
        {
          role: {
            permissions: [
              { menu: { permission: 'system:user:list' } },
              { menu: { permission: 'system:role:list' } },
            ],
          },
        },
        {
          role: {
            permissions: [
              { menu: { permission: 'system:user:list' } }, // duplicate
              { menu: { permission: 'system:menu:list' } },
              { menu: { permission: null } }, // no permission
            ],
          },
        },
      ])

      const result = await menuService.getUserPermissions('user1')

      // Should deduplicate and exclude null
      expect(result).toHaveLength(3)
      expect(result).toContain('system:user:list')
      expect(result).toContain('system:role:list')
      expect(result).toContain('system:menu:list')
    })

    it('should return empty array when user has no roles', async () => {
      cache.getOrSet.mockImplementation(async (_key, factory, _ttl) => {
        return factory()
      })
      prisma.userRole.findMany.mockResolvedValue([])

      const result = await menuService.getUserPermissions('user1')

      expect(result).toEqual([])
    })
  })

  describe('invalidateUserCache', () => {
    it('should delete user menus and permissions cache', () => {
      menuService.invalidateUserCache('user1')

      expect(cache.delete).toHaveBeenCalledWith('user:user1:menus')
      expect(cache.delete).toHaveBeenCalledWith('user:user1:permissions')
    })
  })
})
