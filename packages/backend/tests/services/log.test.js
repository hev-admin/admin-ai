import { beforeEach, describe, expect, it, vi } from 'vitest'
import prisma from '../../src/config/database.js'
import { logService } from '../../src/services/log.js'

// Mock dependencies
vi.mock('../../src/config/database.js', () => ({
  default: {
    operationLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('logService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create an operation log entry', async () => {
      const logData = {
        module: 'user',
        action: 'create',
        username: 'admin',
        ip: '127.0.0.1',
        duration: 50,
      }
      prisma.operationLog.create.mockResolvedValue({ id: '1', ...logData })

      const result = await logService.create(logData)

      expect(result).toEqual({ id: '1', ...logData })
      expect(prisma.operationLog.create).toHaveBeenCalledWith({ data: logData })
    })
  })

  describe('getList', () => {
    it('should return paginated logs with default params', async () => {
      const mockLogs = [
        { id: '1', module: 'user', action: 'create' },
        { id: '2', module: 'role', action: 'update' },
      ]
      prisma.operationLog.findMany.mockResolvedValue(mockLogs)
      prisma.operationLog.count.mockResolvedValue(2)

      const result = await logService.getList()

      expect(result).toEqual({ list: mockLogs, total: 2 })
      expect(prisma.operationLog.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should apply pagination correctly', async () => {
      prisma.operationLog.findMany.mockResolvedValue([])
      prisma.operationLog.count.mockResolvedValue(0)

      await logService.getList(3, 15)

      expect(prisma.operationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 30,
          take: 15,
        }),
      )
    })

    it('should filter by module', async () => {
      prisma.operationLog.findMany.mockResolvedValue([])
      prisma.operationLog.count.mockResolvedValue(0)

      await logService.getList(1, 20, { module: 'user' })

      expect(prisma.operationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { module: 'user' },
        }),
      )
    })

    it('should filter by username with contains', async () => {
      prisma.operationLog.findMany.mockResolvedValue([])
      prisma.operationLog.count.mockResolvedValue(0)

      await logService.getList(1, 20, { username: 'admin' })

      expect(prisma.operationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { username: { contains: 'admin' } },
        }),
      )
    })

    it('should filter by date range', async () => {
      prisma.operationLog.findMany.mockResolvedValue([])
      prisma.operationLog.count.mockResolvedValue(0)

      const startDate = '2026-01-01'
      const endDate = '2026-01-31'

      await logService.getList(1, 20, { startDate, endDate })

      expect(prisma.operationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
        }),
      )
    })

    it('should filter by startDate only', async () => {
      prisma.operationLog.findMany.mockResolvedValue([])
      prisma.operationLog.count.mockResolvedValue(0)

      await logService.getList(1, 20, { startDate: '2026-01-01' })

      expect(prisma.operationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: new Date('2026-01-01'),
            },
          },
        }),
      )
    })

    it('should apply allowed sort fields', async () => {
      prisma.operationLog.findMany.mockResolvedValue([])
      prisma.operationLog.count.mockResolvedValue(0)

      await logService.getList(1, 20, {}, { field: 'duration', order: 'asc' })

      expect(prisma.operationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { duration: 'asc' },
        }),
      )
    })

    it('should fall back to default sort when field is not allowed', async () => {
      prisma.operationLog.findMany.mockResolvedValue([])
      prisma.operationLog.count.mockResolvedValue(0)

      await logService.getList(1, 20, {}, { field: 'malicious', order: 'asc' })

      expect(prisma.operationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        }),
      )
    })

    it('should default sort order to desc when invalid order given', async () => {
      prisma.operationLog.findMany.mockResolvedValue([])
      prisma.operationLog.count.mockResolvedValue(0)

      await logService.getList(1, 20, {}, { field: 'createdAt', order: 'invalid' })

      expect(prisma.operationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      )
    })

    it('should combine multiple filters', async () => {
      prisma.operationLog.findMany.mockResolvedValue([])
      prisma.operationLog.count.mockResolvedValue(0)

      await logService.getList(1, 20, {
        module: 'user',
        username: 'admin',
        startDate: '2026-01-01',
      })

      expect(prisma.operationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            module: 'user',
            username: { contains: 'admin' },
            createdAt: { gte: new Date('2026-01-01') },
          },
        }),
      )
    })
  })

  describe('getStats', () => {
    it('should return total and today count', async () => {
      prisma.operationLog.count
        .mockResolvedValueOnce(1000) // total
        .mockResolvedValueOnce(42) // todayCount

      const result = await logService.getStats()

      expect(result).toEqual({ total: 1000, todayCount: 42 })
      expect(prisma.operationLog.count).toHaveBeenCalledTimes(2)
    })

    it('should filter today count by start of day', async () => {
      prisma.operationLog.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(5)

      await logService.getStats()

      // Second call should filter by today's start
      const secondCallArgs = prisma.operationLog.count.mock.calls[1][0]
      expect(secondCallArgs).toEqual({
        where: {
          createdAt: {
            gte: expect.any(Date),
          },
        },
      })

      // Verify the date is today (start of day)
      const filterDate = secondCallArgs.where.createdAt.gte
      const now = new Date()
      expect(filterDate.getFullYear()).toBe(now.getFullYear())
      expect(filterDate.getMonth()).toBe(now.getMonth())
      expect(filterDate.getDate()).toBe(now.getDate())
    })
  })
})
