<script setup>
import { NButton, NTag } from 'naive-ui'
import { exportApi } from '@/api/export.js'
import { roleApi } from '@/api/role.js'
import { userApi } from '@/api/user.js'

const message = useMessage()
const dialog = useDialog()

const users = ref([])
const roles = ref([])
const loading = ref(false)
const pagination = reactive({ page: 1, pageSize: 10, itemCount: 0 })
const checkedRowKeys = ref([])

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('新增用户')
const formLoading = ref(false)

// 表单数据
const formData = reactive({
  id: null,
  username: '',
  email: '',
  password: '',
  nickname: '',
  phone: '',
  status: 1,
  roleIds: [],
})

// 表格列定义
const columns = [
  { type: 'selection' },
  { title: '用户名', key: 'username' },
  { title: '邮箱', key: 'email' },
  { title: '昵称', key: 'nickname' },
  {
    title: '角色',
    key: 'roles',
    render(row) {
      return row.roles?.map(r => h(
        NTag,
        { type: 'info', size: 'small', style: { marginRight: '4px' } },
        { default: () => r.role.name },
      ))
    },
  },
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

// 重置表单
function resetForm() {
  formData.id = null
  formData.username = ''
  formData.email = ''
  formData.password = ''
  formData.nickname = ''
  formData.phone = ''
  formData.status = 1
  formData.roleIds = []
}

// 获取用户列表
async function fetchUsers() {
  loading.value = true
  try {
    const res = await userApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    users.value = res.data.list
    pagination.itemCount = res.data.pagination.total
  }
  finally {
    loading.value = false
  }
}

// 获取角色列表
async function fetchRoles() {
  const res = await roleApi.getAll()
  roles.value = res.data
}

// 分页改变
function handlePageChange(page) {
  pagination.page = page
  fetchUsers()
}

// 打开新增弹窗
function handleAdd() {
  resetForm()
  modalTitle.value = '新增用户'
  modalVisible.value = true
}

// 打开编辑弹窗
function handleEdit(user) {
  resetForm()
  modalTitle.value = '编辑用户'
  formData.id = user.id
  formData.username = user.username
  formData.email = user.email
  formData.nickname = user.nickname || ''
  formData.phone = user.phone || ''
  formData.status = user.status
  formData.roleIds = user.roles?.map(r => r.roleId) || []
  modalVisible.value = true
}

// 提交表单
async function handleSubmit() {
  formLoading.value = true
  try {
    const data = {
      username: formData.username,
      email: formData.email,
      nickname: formData.nickname,
      phone: formData.phone,
      status: formData.status,
      roleIds: formData.roleIds,
    }

    if (formData.id) {
      await userApi.update(formData.id, data)
      message.success('更新成功')
    }
    else {
      data.password = formData.password
      await userApi.create(data)
      message.success('创建成功')
    }

    modalVisible.value = false
    fetchUsers()
  }
  catch (e) {
    message.error(e.message || '操作失败')
  }
  finally {
    formLoading.value = false
  }
}

// 删除用户
function handleDelete(id) {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除该用户吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      await userApi.delete(id)
      message.success('删除成功')
      fetchUsers()
    },
  })
}

// 批量删除
function handleBatchDelete() {
  if (!checkedRowKeys.value.length) {
    message.warning('请选择要删除的用户')
    return
  }
  dialog.warning({
    title: '确认删除',
    content: `确定要删除选中的 ${checkedRowKeys.value.length} 个用户吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      await userApi.batchDelete(checkedRowKeys.value)
      message.success('删除成功')
      checkedRowKeys.value = []
      fetchUsers()
    },
  })
}

// 导出用户数据
async function handleExport() {
  const res = await exportApi.exportUsers()
  const data = res.data
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `users_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  message.success('导出成功')
}

onMounted(() => {
  fetchUsers()
  fetchRoles()
})
</script>

<template>
  <div>
    <div flex justify-between items-center mb-4>
      <h1 text-2xl font-bold>
        用户管理
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
          新增用户
        </NButton>
      </n-space>
    </div>

    <n-card>
      <n-data-table
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="users"
        :loading="loading"
        :row-key="row => row.id"
      />
      <div flex justify-end mt-4>
        <n-pagination
          v-model:page="pagination.page"
          :page-size="pagination.pageSize"
          :item-count="pagination.itemCount"
          @update:page="handlePageChange"
        />
      </div>
    </n-card>

    <!-- 新增/编辑弹窗 -->
    <n-modal
      v-model:show="modalVisible"
      preset="dialog"
      :title="modalTitle"
      style="width: 500px"
    >
      <n-form label-placement="left" label-width="80">
        <n-form-item label="用户名" required>
          <n-input
            v-model:value="formData.username"
            :disabled="!!formData.id"
            placeholder="请输入用户名"
          />
        </n-form-item>

        <n-form-item label="邮箱" required>
          <n-input v-model:value="formData.email" placeholder="请输入邮箱" />
        </n-form-item>

        <n-form-item v-if="!formData.id" label="密码" required>
          <n-input
            v-model:value="formData.password"
            type="password"
            placeholder="请输入密码"
            show-password-on="click"
          />
        </n-form-item>

        <n-form-item label="昵称">
          <n-input v-model:value="formData.nickname" placeholder="请输入昵称" />
        </n-form-item>

        <n-form-item label="手机号">
          <n-input v-model:value="formData.phone" placeholder="请输入手机号" />
        </n-form-item>

        <n-form-item label="状态">
          <n-select v-model:value="formData.status" :options="statusOptions" />
        </n-form-item>

        <n-form-item label="角色">
          <n-checkbox-group v-model:value="formData.roleIds">
            <n-space>
              <n-checkbox v-for="role in roles" :key="role.id" :value="role.id" :label="role.name" />
            </n-space>
          </n-checkbox-group>
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
