import { beforeEach, describe, expect, it, vi } from 'vitest'
import prisma from '../../src/config/database.js'
import { roleService } from '../../src/services/role.js'

// Mock dependencies
vi.mock('../../src/config/database.js', () => ({
  default: {
    role: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    rolePermission: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}))

describe('roleService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return paginated roles with total count', async () => {
      const mockRoles = [
        { id: '1', name: 'Admin', code: 'admin', sort: 1 },
        { id: '2', name: 'User', code: 'user', sort: 2 },
      ]
      prisma.role.findMany.mockResolvedValue(mockRoles)
      prisma.role.count.mockResolvedValue(2)

      const result = await roleService.getList(1, 10)

      expect(result).toEqual({ list: mockRoles, total: 2 })
      expect(prisma.role.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { sort: 'asc' },
      })
      expect(prisma.role.count).toHaveBeenCalled()
    })

    it('should apply correct skip for page 2', async () => {
      prisma.role.findMany.mockResolvedValue([])
      prisma.role.count.mockResolvedValue(0)

      await roleService.getList(2, 10)

      expect(prisma.role.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        orderBy: { sort: 'asc' },
      })
    })

    it('should use default page and pageSize when not provided', async () => {
      prisma.role.findMany.mockResolvedValue([])
      prisma.role.count.mockResolvedValue(0)

      await roleService.getList()

      expect(prisma.role.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { sort: 'asc' },
      })
    })
  })

  describe('getAll', () => {
    it('should return all active roles', async () => {
      const mockRoles = [
        { id: '1', name: 'Admin', code: 'admin', status: 1, sort: 1 },
      ]
      prisma.role.findMany.mockResolvedValue(mockRoles)

      const result = await roleService.getAll()

      expect(result).toEqual(mockRoles)
      expect(prisma.role.findMany).toHaveBeenCalledWith({
        where: { status: 1 },
        orderBy: { sort: 'asc' },
      })
    })
  })

  describe('getById', () => {
    it('should return role with permissions', async () => {
      const mockRole = {
        id: '1',
        name: 'Admin',
        permissions: [
          { menuId: 'm1', menu: { id: 'm1', name: 'Dashboard' } },
        ],
      }
      prisma.role.findUnique.mockResolvedValue(mockRole)

      const result = await roleService.getById('1')

      expect(result).toEqual(mockRole)
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { permissions: { include: { menu: true } } },
      })
    })

    it('should return null when role not found', async () => {
      prisma.role.findUnique.mockResolvedValue(null)

      const result = await roleService.getById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create role with permissions when menuIds provided', async () => {
      const mockRole = { id: '1', name: 'Editor', code: 'editor' }
      prisma.role.create.mockResolvedValue(mockRole)

      const result = await roleService.create({
        name: 'Editor',
        code: 'editor',
        menuIds: ['m1', 'm2'],
      })

      expect(result).toEqual(mockRole)
      expect(prisma.role.create).toHaveBeenCalledWith({
        data: {
          name: 'Editor',
          code: 'editor',
          permissions: {
            create: [{ menuId: 'm1' }, { menuId: 'm2' }],
          },
        },
      })
    })

    it('should create role without permissions when menuIds not provided', async () => {
      const mockRole = { id: '1', name: 'Viewer', code: 'viewer' }
      prisma.role.create.mockResolvedValue(mockRole)

      const result = await roleService.create({
        name: 'Viewer',
        code: 'viewer',
      })

      expect(result).toEqual(mockRole)
      expect(prisma.role.create).toHaveBeenCalledWith({
        data: {
          name: 'Viewer',
          code: 'viewer',
          permissions: undefined,
        },
      })
    })

    it('should create role without permissions when menuIds is empty', async () => {
      const mockRole = { id: '1', name: 'Viewer', code: 'viewer' }
      prisma.role.create.mockResolvedValue(mockRole)

      await roleService.create({
        name: 'Viewer',
        code: 'viewer',
        menuIds: [],
      })

      expect(prisma.role.create).toHaveBeenCalledWith({
        data: {
          name: 'Viewer',
          code: 'viewer',
          permissions: undefined,
        },
      })
    })
  })

  describe('update', () => {
    it('should update role and replace permissions when menuIds provided', async () => {
      const mockRole = { id: '1', name: 'Editor Updated' }
      prisma.rolePermission.deleteMany.mockResolvedValue({ count: 1 })
      prisma.rolePermission.createMany.mockResolvedValue({ count: 2 })
      prisma.role.update.mockResolvedValue(mockRole)

      const result = await roleService.update('1', {
        name: 'Editor Updated',
        menuIds: ['m2', 'm3'],
      })

      expect(result).toEqual(mockRole)
      expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: { roleId: '1' },
      })
      expect(prisma.rolePermission.createMany).toHaveBeenCalledWith({
        data: [
          { roleId: '1', menuId: 'm2' },
          { roleId: '1', menuId: 'm3' },
        ],
      })
      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Editor Updated' },
      })
    })

    it('should update role without touching permissions when menuIds not provided', async () => {
      const mockRole = { id: '1', name: 'Updated' }
      prisma.role.update.mockResolvedValue(mockRole)

      const result = await roleService.update('1', { name: 'Updated' })

      expect(result).toEqual(mockRole)
      expect(prisma.rolePermission.deleteMany).not.toHaveBeenCalled()
      expect(prisma.rolePermission.createMany).not.toHaveBeenCalled()
      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated' },
      })
    })
  })

  describe('delete', () => {
    it('should delete role by id', async () => {
      const mockRole = { id: '1', name: 'Deleted' }
      prisma.role.delete.mockResolvedValue(mockRole)

      const result = await roleService.delete('1')

      expect(result).toEqual(mockRole)
      expect(prisma.role.delete).toHaveBeenCalledWith({ where: { id: '1' } })
    })
  })

  describe('batchDelete', () => {
    it('should delete multiple roles by ids', async () => {
      prisma.role.deleteMany.mockResolvedValue({ count: 3 })

      const result = await roleService.batchDelete(['1', '2', '3'])

      expect(result).toEqual({ count: 3 })
      expect(prisma.role.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['1', '2', '3'] } },
      })
    })
  })
})
