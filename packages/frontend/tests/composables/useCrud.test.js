import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCrud } from '../../src/composables/useCrud.js'

// Mock naive-ui
const mockMessage = { success: vi.fn(), error: vi.fn(), warning: vi.fn() }
const mockDialog = { warning: vi.fn() }

vi.mock('naive-ui', () => ({
  useMessage: () => mockMessage,
  useDialog: () => mockDialog,
}))

function createMockApi() {
  return {
    getList: vi.fn().mockResolvedValue({
      data: {
        list: [{ id: 1, name: 'Item 1' }],
        pagination: { total: 1, totalPages: 1 },
      },
    }),
    create: vi.fn().mockResolvedValue({ data: { id: 2 } }),
    update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    delete: vi.fn().mockResolvedValue({}),
    batchDelete: vi.fn().mockResolvedValue({}),
  }
}

describe('useCrud', () => {
  let api

  beforeEach(() => {
    vi.clearAllMocks()
    api = createMockApi()
  })

  describe('initialization', () => {
    it('should fetch list immediately by default', async () => {
      useCrud(api)
      await vi.waitFor(() => expect(api.getList).toHaveBeenCalledTimes(1))
    })

    it('should not fetch when immediate is false', () => {
      useCrud(api, { immediate: false })
      expect(api.getList).not.toHaveBeenCalled()
    })

    it('should return default state', () => {
      const crud = useCrud(api, { immediate: false })
      expect(crud.loading.value).toBe(false)
      expect(crud.list.value).toEqual([])
      expect(crud.pagination.page).toBe(1)
      expect(crud.pagination.pageSize).toBe(10)
      expect(crud.keyword.value).toBe('')
      expect(crud.selectedIds.value).toEqual([])
      expect(crud.formVisible.value).toBe(false)
      expect(crud.isEdit.value).toBe(false)
    })

    it('should use custom pageSize', () => {
      const crud = useCrud(api, { immediate: false, pageSize: 20 })
      expect(crud.pagination.pageSize).toBe(20)
    })
  })

  describe('fetchList', () => {
    it('should update list and pagination on success', async () => {
      const crud = useCrud(api, { immediate: false })
      await crud.fetchList()
      expect(crud.list.value).toEqual([{ id: 1, name: 'Item 1' }])
      expect(crud.pagination.total).toBe(1)
    })

    it('should pass page, pageSize, and keyword to API', async () => {
      const crud = useCrud(api, { immediate: false })
      crud.keyword.value = 'test'
      await crud.fetchList()
      expect(api.getList).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        keyword: 'test',
      })
    })

    it('should set loading to false after completion', async () => {
      const crud = useCrud(api, { immediate: false })
      await crud.fetchList()
      expect(crud.loading.value).toBe(false)
    })

    it('should show error message on failure', async () => {
      api.getList.mockRejectedValue(new Error('Network error'))
      const crud = useCrud(api, { immediate: false })
      await crud.fetchList()
      expect(mockMessage.error).toHaveBeenCalledWith('Network error')
    })
  })

  describe('handlePageChange', () => {
    it('should update page and fetch', async () => {
      const crud = useCrud(api, { immediate: false })
      await crud.handlePageChange(3)
      expect(crud.pagination.page).toBe(3)
      expect(api.getList).toHaveBeenCalled()
    })
  })

  describe('handlePageSizeChange', () => {
    it('should update pageSize, reset page to 1, and fetch', async () => {
      const crud = useCrud(api, { immediate: false })
      crud.pagination.page = 5
      await crud.handlePageSizeChange(20)
      expect(crud.pagination.pageSize).toBe(20)
      expect(crud.pagination.page).toBe(1)
    })
  })

  describe('handleSearch', () => {
    it('should reset page to 1 and fetch', async () => {
      const crud = useCrud(api, { immediate: false })
      crud.pagination.page = 3
      await crud.handleSearch()
      expect(crud.pagination.page).toBe(1)
      expect(api.getList).toHaveBeenCalled()
    })
  })

  describe('handleReset', () => {
    it('should clear keyword, reset page, and fetch', async () => {
      const crud = useCrud(api, { immediate: false })
      crud.keyword.value = 'test'
      crud.pagination.page = 3
      await crud.handleReset()
      expect(crud.keyword.value).toBe('')
      expect(crud.pagination.page).toBe(1)
    })
  })

  describe('handleCreate', () => {
    it('should open form in create mode', () => {
      const crud = useCrud(api, { immediate: false })
      crud.handleCreate()
      expect(crud.formVisible.value).toBe(true)
      expect(crud.isEdit.value).toBe(false)
    })

    it('should accept default data', () => {
      const crud = useCrud(api, { immediate: false })
      crud.handleCreate({ role: 'admin' })
      expect(crud.formData.value).toEqual({ role: 'admin' })
    })
  })

  describe('handleEdit', () => {
    it('should open form in edit mode with row data', () => {
      const crud = useCrud(api, { immediate: false })
      crud.handleEdit({ id: 1, name: 'Test' })
      expect(crud.formVisible.value).toBe(true)
      expect(crud.isEdit.value).toBe(true)
      expect(crud.formData.value).toEqual({ id: 1, name: 'Test' })
    })
  })

  describe('handleSubmit', () => {
    it('should call create API in create mode', async () => {
      const crud = useCrud(api, { immediate: false })
      crud.handleCreate()
      await crud.handleSubmit({ name: 'New' })
      expect(api.create).toHaveBeenCalledWith({ name: 'New' })
      expect(mockMessage.success).toHaveBeenCalledWith('创建成功')
      expect(crud.formVisible.value).toBe(false)
    })

    it('should call update API in edit mode', async () => {
      const crud = useCrud(api, { immediate: false })
      crud.handleEdit({ id: 1, name: 'Old' })
      await crud.handleSubmit({ name: 'Updated' })
      expect(api.update).toHaveBeenCalledWith(1, { name: 'Updated' })
      expect(mockMessage.success).toHaveBeenCalledWith('更新成功')
    })

    it('should show error on failure', async () => {
      api.create.mockRejectedValue(new Error('create fail'))
      const crud = useCrud(api, { immediate: false })
      crud.handleCreate()
      await crud.handleSubmit({ name: 'New' })
      expect(mockMessage.error).toHaveBeenCalledWith('create fail')
    })
  })

  describe('handleDelete', () => {
    it('should show confirm dialog', () => {
      const crud = useCrud(api, { immediate: false })
      crud.handleDelete(1)
      expect(mockDialog.warning).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '确认删除',
          content: '确定要删除吗？',
        }),
      )
    })
  })

  describe('handleBatchDelete', () => {
    it('should warn when no items selected', () => {
      const crud = useCrud(api, { immediate: false })
      crud.handleBatchDelete()
      expect(mockMessage.warning).toHaveBeenCalledWith('请先选择要删除的项目')
    })

    it('should show confirm dialog when items selected', () => {
      const crud = useCrud(api, { immediate: false })
      crud.selectedIds.value = [1, 2]
      crud.handleBatchDelete()
      expect(mockDialog.warning).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '确认删除',
          content: '确定要删除选中的项目吗？',
        }),
      )
    })
  })

  describe('handleSelectionChange', () => {
    it('should update selectedIds', () => {
      const crud = useCrud(api, { immediate: false })
      crud.handleSelectionChange([1, 2, 3])
      expect(crud.selectedIds.value).toEqual([1, 2, 3])
    })
  })

  describe('handleCancel', () => {
    it('should close form and clear data', () => {
      const crud = useCrud(api, { immediate: false })
      crud.handleCreate()
      crud.handleCancel()
      expect(crud.formVisible.value).toBe(false)
      expect(crud.formData.value).toBeNull()
    })
  })
})
