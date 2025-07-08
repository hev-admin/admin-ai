import { describe, expect, it } from 'vitest'
import { error, paginate, success } from '../../src/utils/response.js'

describe('response utils', () => {
  describe('success', () => {
    it('should return success response with data', () => {
      const data = { id: 1, name: 'test' }
      const result = success(data)

      expect(result).toEqual({
        code: 200,
        message: 'success',
        data,
      })
    })

    it('should return success response with custom message', () => {
      const data = { id: 1 }
      const result = success(data, 'Created successfully')

      expect(result).toEqual({
        code: 200,
        message: 'Created successfully',
        data,
      })
    })

    it('should return success response with null data', () => {
      const result = success()

      expect(result).toEqual({
        code: 200,
        message: 'success',
        data: null,
      })
    })
  })

  describe('error', () => {
    it('should return error response with message', () => {
      const result = error('Something went wrong')

      expect(result).toEqual({
        code: 400,
        message: 'Something went wrong',
        data: null,
      })
    })

    it('should return error response with custom code', () => {
      const result = error('Not found', 404)

      expect(result).toEqual({
        code: 404,
        message: 'Not found',
        data: null,
      })
    })

    it('should return default error response', () => {
      const result = error()

      expect(result).toEqual({
        code: 400,
        message: 'error',
        data: null,
      })
    })
  })

  describe('paginate', () => {
    it('should return paginated response', () => {
      const list = [{ id: 1 }, { id: 2 }]
      const result = paginate(list, 1, 10, 25)

      expect(result).toEqual({
        code: 200,
        message: 'success',
        data: {
          list,
          pagination: {
            page: 1,
            pageSize: 10,
            total: 25,
            totalPages: 3,
          },
        },
      })
    })

    it('should calculate totalPages correctly', () => {
      const result = paginate([], 1, 10, 100)

      expect(result.data.pagination.totalPages).toBe(10)
    })

    it('should handle empty list', () => {
      const result = paginate([], 1, 10, 0)

      expect(result.data.pagination.totalPages).toBe(0)
    })
  })
})
