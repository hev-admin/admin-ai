<script setup>
import { NButton, NTag } from 'naive-ui'
import { exportApi } from '@/api/export.js'
import { menuApi } from '@/api/menu.js'
import { roleApi } from '@/api/role.js'

const message = useMessage()
const dialog = useDialog()

const roles = ref([])
const menus = ref([])
const loading = ref(false)
const checkedRowKeys = ref([])

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('新增角色')
const formLoading = ref(false)
const formRef = ref(null)

// 表单数据
const formData = reactive({
  id: null,
  name: '',
  code: '',
  description: '',
  status: 1,
  sort: 0,
  menuIds: [],
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { max: 50, message: '角色名称不能超过50个字符', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入角色标识', trigger: 'blur' },
    { max: 50, message: '角色标识不能超过50个字符', trigger: 'blur' },
    { pattern: /^[a-z]\w*$/i, message: '以字母开头，只能包含字母、数字和下划线', trigger: 'blur' },
  ],
  description: [
    { max: 200, message: '描述不能超过200个字符', trigger: 'blur' },
  ],
}

// 表格列定义
const columns = [
  { type: 'selection' },
  { title: '角色名称', key: 'name' },
  { title: '角色标识', key: 'code' },
  { title: '描述', key: 'description' },
  {
    title: '状态',
    key: 'status',
    render(row) {
      return h(NTag, { type: row.status === 1 ? 'success' : 'error' }, {
        default: () => row.status === 1 ? '启用' : '禁用',
      })
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h('div', { class: 'flex gap-2' }, [
        h(NButton, { text: true, type: 'primary', onClick: () => handleEdit(row) }, { default: () => '编辑' }),
        h(NButton, { text: true, type: 'error', onClick: () => handleDelete(row.id) }, { default: () => '删除' }),
      ])
    },
  },
]

// 状态选项
const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
]

// 菜单树选项
const menuTreeOptions = computed(() => {
  function transform(list) {
    return list.map(item => ({
      key: item.id,
      label: item.title || item.name,
      children: item.children?.length ? transform(item.children) : undefined,
    }))
  }
  return transform(menus.value)
})

// 重置表单
function resetForm() {
  formData.id = null
  formData.name = ''
  formData.code = ''
  formData.description = ''
  formData.status = 1
  formData.sort = 0
  formData.menuIds = []
}

// 获取角色列表
async function fetchRoles() {
  loading.value = true
  try {
    const res = await roleApi.getList({})
    roles.value = res.data.list || res.data
  }
  finally {
    loading.value = false
  }
}

// 获取菜单树
async function fetchMenus() {
  const res = await menuApi.getTree()
  menus.value = res.data
}

// 打开新增弹窗
function handleAdd() {
  resetForm()
  modalTitle.value = '新增角色'
  modalVisible.value = true
}

// 打开编辑弹窗
async function handleEdit(role) {
  resetForm()
  modalTitle.value = '编辑角色'
  const res = await roleApi.getById(role.id)
  const detail = res.data
  formData.id = detail.id
  formData.name = detail.name
  formData.code = detail.code
  formData.description = detail.description || ''
  formData.status = detail.status
  formData.sort = detail.sort || 0
  formData.menuIds = detail.permissions?.map(p => p.menuId) || []
  modalVisible.value = true
}

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value?.validate()
  }
  catch {
    return
  }

  formLoading.value = true
  try {
    const data = {
      name: formData.name,
      code: formData.code,
      description: formData.description,
      status: formData.status,
      sort: formData.sort,
      menuIds: formData.menuIds,
    }

    if (formData.id) {
      await roleApi.update(formData.id, data)
      message.success('更新成功')
    }
    else {
      await roleApi.create(data)
      message.success('创建成功')
    }

    modalVisible.value = false
    fetchRoles()
  }
  catch (e) {
    message.error(e.message || '操作失败')
  }
  finally {
    formLoading.value = false
  }
}

// 删除角色
function handleDelete(id) {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除该角色吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      await roleApi.delete(id)
      message.success('删除成功')
      fetchRoles()
    },
  })
}

// 批量删除
function handleBatchDelete() {
  if (!checkedRowKeys.value.length) {
    message.warning('请选择要删除的角色')
    return
  }
  dialog.warning({
    title: '确认删除',
    content: `确定要删除选中的 ${checkedRowKeys.value.length} 个角色吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      await roleApi.batchDelete(checkedRowKeys.value)
      message.success('删除成功')
      checkedRowKeys.value = []
      fetchRoles()
    },
  })
}

// 导出角色数据
async function handleExport() {
  const res = await exportApi.exportRoles()
  const data = res.data
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `roles_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  message.success('导出成功')
}

onMounted(() => {
  fetchRoles()
  fetchMenus()
})
</script>

<template>
  <div>
    <div flex justify-between items-center mb-4>
      <h1 text-2xl font-bold>
        角色管理
      </h1>
      <n-space>
        <NButton @click="handleExport">
          导出
        </NButton>
        <NButton
          v-if="checkedRowKeys.length"
          type="error"
          @click="handleBatchDelete"
        >
          批量删除 ({{ checkedRowKeys.length }})
        </NButton>
        <NButton type="primary" @click="handleAdd">
          新增角色
        </NButton>
      </n-space>
    </div>

    <n-card>
      <n-data-table
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="roles"
        :loading="loading"
        :row-key="row => row.id"
      />
      <n-empty v-if="!loading && roles.length === 0" description="暂无数据" mt-4 />
    </n-card>

    <!-- 新增/编辑弹窗 -->
    <n-modal
      v-model:show="modalVisible"
      preset="dialog"
      :title="modalTitle"
      style="width: 600px"
    >
      <n-form ref="formRef" :model="formData" :rules="formRules" label-placement="left" label-width="80">
        <n-grid :cols="2" :x-gap="16">
          <n-gi>
            <n-form-item label="角色名称" path="name">
              <n-input v-model:value="formData.name" placeholder="请输入角色名称" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="角色标识" path="code">
              <n-input
                v-model:value="formData.code"
                :disabled="!!formData.id"
                placeholder="请输入角色标识"
              />
            </n-form-item>
          </n-gi>
        </n-grid>

        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="formData.description"
            type="textarea"
            :rows="2"
            placeholder="请输入描述"
          />
        </n-form-item>

        <n-grid :cols="2" :x-gap="16">
          <n-gi>
            <n-form-item label="状态">
              <n-select v-model:value="formData.status" :options="statusOptions" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="排序">
              <n-input-number v-model:value="formData.sort" :min="0" style="width: 100%" />
            </n-form-item>
          </n-gi>
        </n-grid>

        <n-form-item label="菜单权限">
          <n-tree
            v-model:checked-keys="formData.menuIds"
            :data="menuTreeOptions"
            checkable
            cascade
            selectable
            block-line
            style="max-height: 200px; overflow: auto"
          />
        </n-form-item>
      </n-form>

      <template #action>
        <n-space justify="end">
          <NButton @click="modalVisible = false">
            取消
          </NButton>
          <NButton type="primary" :loading="formLoading" @click="handleSubmit">
            确定
          </NButton>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>
