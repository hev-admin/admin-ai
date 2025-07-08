import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock naive-ui before importing the module under test
const mockMessage = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), loading: vi.fn() }
const mockNotification = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }
const mockDialog = { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }

vi.mock('naive-ui', () => ({
  useMessage: () => mockMessage,
  useNotification: () => mockNotification,
  useDialog: () => mockDialog,
}))

const { setupMessage, message, notification, dialog, handleApiError } = await import('../../src/utils/message.js')

describe('message utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('setupMessage', () => {
    it('should initialize message instances', () => {
      setupMessage()
      // After setup, message calls should delegate to the naive-ui instances
      message.success('test')
      expect(mockMessage.success).toHaveBeenCalledWith('test', {})
    })
  })

  describe('message proxy', () => {
    it('should call success', () => {
      setupMessage()
      message.success('ok')
      expect(mockMessage.success).toHaveBeenCalledWith('ok', {})
    })

    it('should call error', () => {
      setupMessage()
      message.error('fail')
      expect(mockMessage.error).toHaveBeenCalledWith('fail', {})
    })

    it('should call warning', () => {
      setupMessage()
      message.warning('warn')
      expect(mockMessage.warning).toHaveBeenCalledWith('warn', {})
    })

    it('should call info', () => {
      setupMessage()
      message.info('info')
      expect(mockMessage.info).toHaveBeenCalledWith('info', {})
    })

    it('should call loading', () => {
      setupMessage()
      message.loading('loading')
      expect(mockMessage.loading).toHaveBeenCalledWith('loading', {})
    })

    it('should pass options to message methods', () => {
      setupMessage()
      message.success('ok', { duration: 3000 })
      expect(mockMessage.success).toHaveBeenCalledWith('ok', { duration: 3000 })
    })
  })

  describe('notification proxy', () => {
    it('should call notification success', () => {
      setupMessage()
      notification.success({ title: 'ok' })
      expect(mockNotification.success).toHaveBeenCalledWith({ title: 'ok' })
    })

    it('should call notification error', () => {
      setupMessage()
      notification.error({ title: 'fail' })
      expect(mockNotification.error).toHaveBeenCalledWith({ title: 'fail' })
    })
  })

  describe('dialog proxy', () => {
    it('should call confirm with default options', () => {
      setupMessage()
      dialog.confirm({ content: 'sure?' })
      expect(mockDialog.warning).toHaveBeenCalledWith({
        title: '确认',
        positiveText: '确定',
        negativeText: '取消',
        content: 'sure?',
      })
    })

    it('should allow overriding confirm defaults', () => {
      setupMessage()
      dialog.confirm({ title: '自定义', content: 'msg' })
      expect(mockDialog.warning).toHaveBeenCalledWith({
        title: '自定义',
        positiveText: '确定',
        negativeText: '取消',
        content: 'msg',
      })
    })
  })

  describe('handleApiError', () => {
    it('should show specific message for 401', () => {
      setupMessage()
      handleApiError({ response: { data: { code: 401 }, status: 401 } })
      expect(mockMessage.error).toHaveBeenCalledWith('登录已过期，请重新登录', {})
    })

    it('should show specific message for 403', () => {
      setupMessage()
      handleApiError({ response: { data: { code: 403 }, status: 403 } })
      expect(mockMessage.error).toHaveBeenCalledWith('无权限访问', {})
    })

    it('should show specific message for 404', () => {
      setupMessage()
      handleApiError({ response: { data: { code: 404 }, status: 404 } })
      expect(mockMessage.error).toHaveBeenCalledWith('请求的资源不存在', {})
    })

    it('should show default message from error.message', () => {
      setupMessage()
      const result = handleApiError({ message: '网络错误' })
      expect(mockMessage.error).toHaveBeenCalledWith('网络错误', {})
      expect(result).toBe('网络错误')
    })

    it('should show fallback message when no message available', () => {
      setupMessage()
      const result = handleApiError({})
      expect(result).toBe('请求失败，请稍后重试')
    })
  })
})
