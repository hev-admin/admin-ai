import { useDialog, useMessage } from 'naive-ui'
import { reactive, ref } from 'vue'

/**
 * Generic CRUD composable for managing list data
 *
 * @param {object} api - API object with list, create, update, delete methods
 * @param {object} options - Configuration options
 */
export function useCrud(api, options = {}) {
  const {
    immediate = true,
    pageSize = 10,
    deleteConfirmMessage = '确定要删除吗？',
    batchDeleteConfirmMessage = '确定要删除选中的项目吗？',
  } = options

  const message = useMessage()
  const dialog = useDialog()

  // State
  const loading = ref(false)
  const list = ref([])
  const pagination = reactive({
    page: 1,
    pageSize,
    total: 0,
    totalPages: 0,
  })
  const keyword = ref('')
  const selectedIds = ref([])
  const formVisible = ref(false)
  const formLoading = ref(false)
  const formData = ref(null)
  const isEdit = ref(false)

  /**
   * Fetch list data
   */
  async function fetchList() {
    loading.value = true
    try {
      const res = await api.getList({
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword: keyword.value,
      })

      list.value = res.data.list
      pagination.total = res.data.pagination.total
      pagination.totalPages = res.data.pagination.totalPages
    }
    catch (error) {
      message.error(error.message || '获取列表失败')
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Handle page change
   */
  function handlePageChange(page) {
    pagination.page = page
    fetchList()
  }

  /**
   * Handle page size change
   */
  function handlePageSizeChange(size) {
    pagination.pageSize = size
    pagination.page = 1
    fetchList()
  }

  /**
   * Handle search
   */
  function handleSearch() {
    pagination.page = 1
    fetchList()
  }

  /**
   * Reset search
   */
  function handleReset() {
    keyword.value = ''
    pagination.page = 1
    fetchList()
  }

  /**
   * Open create form
   */
  function handleCreate(defaultData = {}) {
    isEdit.value = false
    formData.value = { ...defaultData }
    formVisible.value = true
  }

  /**
   * Open edit form
   */
  function handleEdit(row) {
    isEdit.value = true
    formData.value = { ...row }
    formVisible.value = true
  }

  /**
   * Submit form (create or update)
   */
  async function handleSubmit(data) {
    formLoading.value = true
    try {
      if (isEdit.value) {
        await api.update(formData.value.id, data)
        message.success('更新成功')
      }
      else {
        await api.create(data)
        message.success('创建成功')
      }
      formVisible.value = false
      fetchList()
    }
    catch (error) {
      message.error(error.message || '操作失败')
    }
    finally {
      formLoading.value = false
    }
  }

  /**
   * Delete single item
   */
  function handleDelete(id) {
    dialog.warning({
      title: '确认删除',
      content: deleteConfirmMessage,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await api.delete(id)
          message.success('删除成功')
          fetchList()
        }
        catch (error) {
          message.error(error.message || '删除失败')
        }
      },
    })
  }

  /**
   * Batch delete selected items
   */
  function handleBatchDelete() {
    if (selectedIds.value.length === 0) {
      message.warning('请先选择要删除的项目')
      return
    }

    dialog.warning({
      title: '确认删除',
      content: batchDeleteConfirmMessage,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await api.batchDelete(selectedIds.value)
          message.success('批量删除成功')
          selectedIds.value = []
          fetchList()
        }
        catch (error) {
          message.error(error.message || '删除失败')
        }
      },
    })
  }

  /**
   * Handle selection change
   */
  function handleSelectionChange(keys) {
    selectedIds.value = keys
  }

  /**
   * Close form
   */
  function handleCancel() {
    formVisible.value = false
    formData.value = null
  }

  /**
   * Refresh list
   */
  function refresh() {
    fetchList()
  }

  // Initial fetch
  if (immediate) {
    fetchList()
  }

  return {
    // State
    loading,
    list,
    pagination,
    keyword,
    selectedIds,
    formVisible,
    formLoading,
    formData,
    isEdit,
    // Methods
    fetchList,
    handlePageChange,
    handlePageSizeChange,
    handleSearch,
    handleReset,
    handleCreate,
    handleEdit,
    handleSubmit,
    handleDelete,
    handleBatchDelete,
    handleSelectionChange,
    handleCancel,
    refresh,
  }
}
