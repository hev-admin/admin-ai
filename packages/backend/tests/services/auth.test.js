import bcrypt from 'bcryptjs'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import prisma from '../../src/config/database.js'
import { authService } from '../../src/services/auth.js'
import { tokenService } from '../../src/services/token.js'

// Mock dependencies
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
  },
}))

vi.mock('../../src/config/database.js', () => ({
  default: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('../../src/services/token.js', () => ({
  tokenService: {
    generateTokens: vi.fn(),
    invalidateUserTokens: vi.fn(),
  },
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should throw error when user not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null)

      await expect(authService.login('nonexistent', 'password'))
        .rejects
        .toThrow('用户不存在')
    })

    it('should throw error when user is disabled', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: '1',
        username: 'test',
        status: 0,
        password: 'hashed',
        roles: [],
      })

      await expect(authService.login('test', 'password'))
        .rejects
        .toThrow('用户已被禁用')
    })

    it('should throw error when password is incorrect', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: '1',
        username: 'test',
        status: 1,
        password: 'hashed',
        roles: [],
      })
      bcrypt.compare.mockResolvedValue(false)

      await expect(authService.login('test', 'wrongpassword'))
        .rejects
        .toThrow('密码错误')
    })

    it('should return token and user on successful login', async () => {
      const mockUser = {
        id: '1',
        username: 'test',
        email: 'test@example.com',
        status: 1,
        password: 'hashed',
        roles: [],
      }
      prisma.user.findFirst.mockResolvedValue(mockUser)
      bcrypt.compare.mockResolvedValue(true)
      tokenService.generateTokens.mockReturnValue({
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token',
      })

      const result = await authService.login('test', 'password')

      expect(result.token).toBe('mock-token')
      expect(result.refreshToken).toBe('mock-refresh-token')
      expect(result.user).not.toHaveProperty('password')
      expect(result.user.username).toBe('test')
    })

    it('should allow login with email', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: '1',
        username: 'test',
        email: 'test@example.com',
        status: 1,
        password: 'hashed',
        roles: [],
      })
      bcrypt.compare.mockResolvedValue(true)
      tokenService.generateTokens.mockReturnValue({
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token',
      })

      await authService.login('test@example.com', 'password')

      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { username: 'test@example.com' },
              { email: 'test@example.com' },
            ],
          },
        }),
      )
    })
  })

  describe('register', () => {
    it('should throw error when user already exists', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: '1' })

      await expect(authService.register({
        username: 'existing',
        email: 'existing@example.com',
        password: 'Password123',
      })).rejects.toThrow('用户名或邮箱已存在')
    })

    it('should create user with hashed password', async () => {
      prisma.user.findFirst.mockResolvedValue(null)
      bcrypt.hash.mockResolvedValue('hashed-password')
      prisma.user.create.mockResolvedValue({
        id: '1',
        username: 'newuser',
        email: 'new@example.com',
        nickname: 'newuser',
        password: 'hashed-password',
      })

      const result = await authService.register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123',
      })

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 12)
      expect(result).not.toHaveProperty('password')
    })

    it('should use username as nickname when not provided', async () => {
      prisma.user.findFirst.mockResolvedValue(null)
      bcrypt.hash.mockResolvedValue('hashed')
      prisma.user.create.mockResolvedValue({
        id: '1',
        username: 'newuser',
        email: 'new@example.com',
        nickname: 'newuser',
        password: 'hashed',
      })

      await authService.register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123',
      })

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nickname: 'newuser',
          }),
        }),
      )
    })
  })

  describe('getProfile', () => {
    it('should throw error when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(authService.getProfile('nonexistent'))
        .rejects
        .toThrow('用户不存在')
    })

    it('should return user profile without password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        username: 'test',
        email: 'test@example.com',
        password: 'hashed',
        roles: [],
      })

      const result = await authService.getProfile('1')

      expect(result).not.toHaveProperty('password')
      expect(result.username).toBe('test')
    })
  })

  describe('changePassword', () => {
    it('should throw error when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(authService.changePassword('1', 'OldPass123', 'NewPass456'))
        .rejects
        .toThrow('用户不存在')
    })

    it('should throw error when old password is incorrect', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        password: 'hashed',
      })
      bcrypt.compare.mockResolvedValue(false)

      await expect(authService.changePassword('1', 'WrongPass1', 'NewPass456'))
        .rejects
        .toThrow('原密码错误')
    })

    it('should update password when old password is correct', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        password: 'hashed',
      })
      bcrypt.compare.mockResolvedValueOnce(true) // old password check
      bcrypt.compare.mockResolvedValueOnce(false) // same password check
      bcrypt.hash.mockResolvedValue('new-hashed')
      prisma.user.update.mockResolvedValue({})

      await authService.changePassword('1', 'OldPass123', 'NewPass456')

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass456', 12)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { password: 'new-hashed' },
      })
    })
  })
})
