import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock auth store
const mockAuthStore = {
  token: 'test-token',
  setToken: vi.fn(),
  clearToken: vi.fn(),
}

vi.mock('../../src/stores/auth.js', () => ({
  useAuthStore: () => mockAuthStore,
}))

// Mock pinia
vi.mock('pinia', () => ({
  defineStore: vi.fn(),
  createPinia: vi.fn(),
  setActivePinia: vi.fn(),
}))

// Mock axios
const mockInterceptors = {
  request: { handlers: [], use(fn, err) { this.handlers.push({ fulfilled: fn, rejected: err }) } },
  response: { handlers: [], use(fn, err) { this.handlers.push({ fulfilled: fn, rejected: err }) } },
}

const mockAxiosInstance = {
  interceptors: mockInterceptors,
  defaults: {},
}

vi.mock('axios', () => {
  return {
    default: {
      create: () => mockAxiosInstance,
      post: vi.fn(),
    },
  }
})

describe('request utils', () => {
  let requestInterceptor
  let responseSuccessInterceptor
  let responseErrorInterceptor

  beforeEach(async () => {
    vi.clearAllMocks()
    mockInterceptors.request.handlers = []
    mockInterceptors.response.handlers = []
    mockAuthStore.token = 'test-token'

    // Re-import to trigger interceptor registration
    vi.resetModules()

    // Re-mock after resetModules
    vi.doMock('../../src/stores/auth.js', () => ({
      useAuthStore: () => mockAuthStore,
    }))
    vi.doMock('pinia', () => ({
      defineStore: vi.fn(),
      createPinia: vi.fn(),
      setActivePinia: vi.fn(),
    }))
    vi.doMock('axios', () => ({
      default: {
        create: () => mockAxiosInstance,
        post: vi.fn(),
      },
    }))

    await import('../../src/utils/request.js')
    requestInterceptor = mockInterceptors.request.handlers[0]
    responseSuccessInterceptor = mockInterceptors.response.handlers[0]
  })

  describe('request interceptor', () => {
    it('should add Authorization header when token exists', () => {
      const config = { headers: {} }
      const result = requestInterceptor.fulfilled(config)
      expect(result.headers.Authorization).toBe('Bearer test-token')
    })

    it('should not add Authorization header when token is empty', () => {
      mockAuthStore.token = ''
      const config = { headers: {} }
      const result = requestInterceptor.fulfilled(config)
      expect(result.headers.Authorization).toBeUndefined()
    })
  })

  describe('response interceptor - success', () => {
    it('should return response data when code is 200', () => {
      const response = { data: { code: 200, data: { id: 1 }, message: 'ok' } }
      const result = responseSuccessInterceptor.fulfilled(response)
      expect(result).toEqual({ code: 200, data: { id: 1 }, message: 'ok' })
    })

    it('should reject when code is not 200', async () => {
      const response = { data: { code: 400, message: '参数错误' } }
      await expect(responseSuccessInterceptor.fulfilled(response)).rejects.toThrow('参数错误')
    })

    it('should use default message when response message is empty', async () => {
      const response = { data: { code: 500 } }
      await expect(responseSuccessInterceptor.fulfilled(response)).rejects.toThrow('请求失败')
    })
  })

  describe('response interceptor - error', () => {
    it('should reject non-401 errors', async () => {
      responseErrorInterceptor = mockInterceptors.response.handlers[0]
      const error = { response: { status: 500 }, config: {} }
      await expect(responseErrorInterceptor.rejected(error)).rejects.toEqual(error)
    })
  })
})
