import { beforeEach, describe, expect, it, vi } from 'vitest'
import prisma from '../../src/config/database.js'
import { settingService } from '../../src/services/setting.js'

// Mock dependencies
vi.mock('../../src/config/database.js', () => ({
  default: {
    setting: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

describe('settingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should return all settings', async () => {
      const mockSettings = [
        { id: '1', key: 'siteName', value: 'Admin AI', group: 'system' },
        { id: '2', key: 'theme', value: 'dark', group: 'appearance' },
      ]
      prisma.setting.findMany.mockResolvedValue(mockSettings)

      const result = await settingService.getAll()

      expect(result).toEqual(mockSettings)
      expect(prisma.setting.findMany).toHaveBeenCalledWith()
    })
  })

  describe('getByGroup', () => {
    it('should return settings filtered by group', async () => {
      const mockSettings = [
        { id: '1', key: 'siteName', value: 'Admin AI', group: 'system' },
      ]
      prisma.setting.findMany.mockResolvedValue(mockSettings)

      const result = await settingService.getByGroup('system')

      expect(result).toEqual(mockSettings)
      expect(prisma.setting.findMany).toHaveBeenCalledWith({
        where: { group: 'system' },
      })
    })
  })

  describe('get', () => {
    it('should return a single setting by key', async () => {
      const mockSetting = { id: '1', key: 'siteName', value: 'Admin AI', group: 'system' }
      prisma.setting.findUnique.mockResolvedValue(mockSetting)

      const result = await settingService.get('siteName')

      expect(result).toEqual(mockSetting)
      expect(prisma.setting.findUnique).toHaveBeenCalledWith({
        where: { key: 'siteName' },
      })
    })

    it('should return null when setting not found', async () => {
      prisma.setting.findUnique.mockResolvedValue(null)

      const result = await settingService.get('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('should upsert a setting with default group', async () => {
      const mockSetting = { id: '1', key: 'siteName', value: 'New Name', group: 'system' }
      prisma.setting.upsert.mockResolvedValue(mockSetting)

      const result = await settingService.set('siteName', 'New Name')

      expect(result).toEqual(mockSetting)
      expect(prisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'siteName' },
        update: { value: 'New Name' },
        create: { key: 'siteName', value: 'New Name', group: 'system' },
      })
    })

    it('should upsert a setting with custom group', async () => {
      const mockSetting = { id: '1', key: 'theme', value: 'dark', group: 'appearance' }
      prisma.setting.upsert.mockResolvedValue(mockSetting)

      const result = await settingService.set('theme', 'dark', 'appearance')

      expect(result).toEqual(mockSetting)
      expect(prisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'theme' },
        update: { value: 'dark' },
        create: { key: 'theme', value: 'dark', group: 'appearance' },
      })
    })
  })

  describe('batchSet', () => {
    it('should upsert multiple settings in a transaction', async () => {
      const settings = [
        { key: 'siteName', value: 'Admin AI', group: 'system' },
        { key: 'theme', value: 'dark', group: 'appearance' },
      ]
      const mockResults = [
        { id: '1', ...settings[0] },
        { id: '2', ...settings[1] },
      ]
      prisma.$transaction.mockResolvedValue(mockResults)

      const result = await settingService.batchSet(settings)

      expect(result).toEqual(mockResults)
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.anything(),
          expect.anything(),
        ]),
      )
    })

    it('should use default group when not specified in settings', async () => {
      const settings = [
        { key: 'siteName', value: 'Admin AI' },
      ]
      prisma.$transaction.mockResolvedValue([])

      await settingService.batchSet(settings)

      // Verify that upsert was called with default group
      expect(prisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'siteName' },
        update: { value: 'Admin AI' },
        create: { key: 'siteName', value: 'Admin AI', group: 'system' },
      })
    })

    it('should pass upsert operations to $transaction', async () => {
      const mockUpsertResult = { id: '1', key: 'k', value: 'v' }
      prisma.setting.upsert.mockReturnValue(mockUpsertResult)
      prisma.$transaction.mockResolvedValue([mockUpsertResult])

      await settingService.batchSet([{ key: 'k', value: 'v' }])

      expect(prisma.$transaction).toHaveBeenCalledWith([mockUpsertResult])
    })
  })
})
