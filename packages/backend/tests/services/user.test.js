import bcrypt from 'bcryptjs'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import prisma from '../../src/config/database.js'
import { userService } from '../../src/services/user.js'

// Mock dependencies
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}))

vi.mock('../../src/config/database.js', () => ({
  default: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    userRole: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}))

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return paginated list without keyword', async () => {
      const mockUsers = [
        { id: '1', username: 'user1' },
        { id: '2', username: 'user2' },
      ]
      prisma.user.findMany.mockResolvedValue(mockUsers)
      prisma.user.count.mockResolvedValue(25)

      const result = await userService.getList(1, 10)

      expect(result.list).toEqual(mockUsers)
      expect(result.total).toBe(25)
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      )
    })

    it('should filter by keyword', async () => {
      prisma.user.findMany.mockResolvedValue([])
      prisma.user.count.mockResolvedValue(0)

      await userService.getList(1, 10, 'john')

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { username: { contains: 'john' } },
              { email: { contains: 'john' } },
              { nickname: { contains: 'john' } },
            ],
          },
        }),
      )
    })

    it('should calculate correct offset for pagination', async () => {
      prisma.user.findMany.mockResolvedValue([])
      prisma.user.count.mockResolvedValue(0)

      await userService.getList(3, 20)

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40,
          take: 20,
        }),
      )
    })

    it('should exclude password from selection', async () => {
      prisma.user.findMany.mockResolvedValue([])
      prisma.user.count.mockResolvedValue(0)

      await userService.getList()

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.not.objectContaining({
            password: true,
          }),
        }),
      )
    })
  })

  describe('getById', () => {
    it('should return user by id', async () => {
      const mockUser = { id: '1', username: 'test' }
      prisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await userService.getById('1')

      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { roles: { include: { role: true } } },
      })
    })

    it('should return null for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      const result = await userService.getById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create user with hashed password', async () => {
      bcrypt.hash.mockResolvedValue('hashed-password')
      prisma.user.create.mockResolvedValue({
        id: '1',
        username: 'newuser',
        email: 'new@example.com',
      })

      await userService.create({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      })

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
    })

    it('should create user with roles', async () => {
      bcrypt.hash.mockResolvedValue('hashed')
      prisma.user.create.mockResolvedValue({ id: '1' })

      await userService.create({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password',
        roleIds: ['role1', 'role2'],
      })

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            roles: {
              create: [
                { roleId: 'role1' },
                { roleId: 'role2' },
              ],
            },
          }),
        }),
      )
    })

    it('should create user without roles when roleIds is empty', async () => {
      bcrypt.hash.mockResolvedValue('hashed')
      prisma.user.create.mockResolvedValue({ id: '1' })

      await userService.create({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password',
        roleIds: [],
      })

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            roles: undefined,
          }),
        }),
      )
    })
  })

  describe('update', () => {
    it('should update user data', async () => {
      prisma.user.update.mockResolvedValue({ id: '1', nickname: 'New Name' })

      await userService.update('1', { nickname: 'New Name' })

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { nickname: 'New Name' },
      })
    })

    it('should update user roles when roleIds provided', async () => {
      prisma.userRole.deleteMany.mockResolvedValue({})
      prisma.userRole.createMany.mockResolvedValue({})
      prisma.user.update.mockResolvedValue({ id: '1' })

      await userService.update('1', {
        nickname: 'Name',
        roleIds: ['role1', 'role2'],
      })

      expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: '1' },
      })
      expect(prisma.userRole.createMany).toHaveBeenCalledWith({
        data: [
          { userId: '1', roleId: 'role1' },
          { userId: '1', roleId: 'role2' },
        ],
      })
    })
  })

  describe('delete', () => {
    it('should delete user by id', async () => {
      prisma.user.delete.mockResolvedValue({ id: '1' })

      await userService.delete('1')

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })
  })

  describe('batchDelete', () => {
    it('should delete multiple users', async () => {
      prisma.user.deleteMany.mockResolvedValue({ count: 3 })

      await userService.batchDelete(['1', '2', '3'])

      expect(prisma.user.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['1', '2', '3'] } },
      })
    })
  })
})
