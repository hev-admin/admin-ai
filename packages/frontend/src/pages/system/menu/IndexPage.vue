<script setup>
import { NButton, NTag } from 'naive-ui'
import { exportApi } from '@/api/export.js'
import { menuApi } from '@/api/menu.js'

const message = useMessage()
const dialog = useDialog()

const menus = ref([])
const menuList = ref([])
const loading = ref(false)
const checkedRowKeys = ref([])

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('新增菜单')
const formLoading = ref(false)

// 表单数据
const formData = reactive({
  id: null,
  parentId: null,
  name: '',
  path: '',
  component: '',
  redirect: '',
  icon: '',
  title: '',
  permission: '',
  type: 1,
  visible: 1,
  status: 1,
  sort: 0,
  keepAlive: 0,
  external: 0,
})

// 扁平化菜单树用于表格展示
const flattenedMenus = computed(() => {
  const result = []
  function flatten(items, level = 0) {
    items.forEach((item) => {
      result.push({ ...item, level })
      if (item.children?.length) {
        flatten(item.children, level + 1)
      }
    })
  }
  flatten(menus.value)
  return result
})

// 表格列定义
const columns = [
  { type: 'selection' },
  {
    title: '菜单名称',
    key: 'title',
    render(row) {
      return h('span', { style: { paddingLeft: `${row.level * 20}px` } }, row.title)
    },
  },
  { title: '路径', key: 'path' },
  {
    title: '类型',
    key: 'type',
    render(row) {
      const types = { 1: { text: '目录', type: 'info' }, 2: { text: '菜单', type: 'success' }, 3: { text: '按钮', type: 'warning' } }
      const t = types[row.type] || { text: '未知', type: 'default' }
      return h(NTag, { type: t.type, size: 'small' }, { default: () => t.text })
    },
  },
  { title: '排序', key: 'sort' },
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
    width: 180,
    render(row) {
      const buttons = []
      if (row.type !== 3) {
        buttons.push(h(NButton, { text: true, type: 'success', onClick: () => handleAdd(row.id) }, { default: () => '添加' }))
      }
      buttons.push(h(NButton, { text: true, type: 'primary', onClick: () => handleEdit(row) }, { default: () => '编辑' }))
      buttons.push(h(NButton, { text: true, type: 'error', onClick: () => handleDelete(row.id) }, { default: () => '删除' }))
      return h('div', { class: 'flex gap-2' }, buttons)
    },
  },
]

// 选项
const typeOptions = [
  { label: '目录', value: 1 },
  { label: '菜单', value: 2 },
  { label: '按钮', value: 3 },
]
const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
]
const visibleOptions = [
  { label: '显示', value: 1 },
  { label: '隐藏', value: 0 },
]
const boolOptions = [
  { label: '是', value: 1 },
  { label: '否', value: 0 },
]

// 父菜单选项
const parentMenuOptions = computed(() => {
  const options = [{ label: '无（顶级菜单）', value: null }]
  const list = formData.id
    ? menuList.value.filter((m) => {
        if (m.type === 3)
          return false
        if (m.id === formData.id)
          return false
        // 排除子菜单
        let parent = menuList.value.find(p => p.id === m.parentId)
        while (parent) {
          if (parent.id === formData.id)
            return false
          parent = menuList.value.find(p => p.id === parent.parentId)
        }
        return true
      })
    : menuList.value.filter(m => m.type !== 3)
  list.forEach(m => options.push({ label: m.title, value: m.id }))
  return options
})

// 重置表单
function resetForm() {
  formData.id = null
  formData.parentId = null
  formData.name = ''
  formData.path = ''
  formData.component = ''
  formData.redirect = ''
  formData.icon = ''
  formData.title = ''
  formData.permission = ''
  formData.type = 1
  formData.visible = 1
  formData.status = 1
  formData.sort = 0
  formData.keepAlive = 0
  formData.external = 0
}

// 获取菜单树
async function fetchMenus() {
  loading.value = true
  try {
    const res = await menuApi.getTree()
    menus.value = res.data
  }
  finally {
    loading.value = false
  }
}

// 获取菜单列表
async function fetchMenuList() {
  const res = await menuApi.getList()
  menuList.value = res.data
}

// 打开新增弹窗
function handleAdd(parentId = null) {
  resetForm()
  formData.parentId = parentId
  modalTitle.value = '新增菜单'
  modalVisible.value = true
}

// 打开编辑弹窗
async function handleEdit(menu) {
  resetForm()
  modalTitle.value = '编辑菜单'
  const res = await menuApi.getById(menu.id)
  const detail = res.data
  Object.assign(formData, {
    id: detail.id,
    parentId: detail.parentId,
    name: detail.name || '',
    path: detail.path || '',
    component: detail.component || '',
    redirect: detail.redirect || '',
    icon: detail.icon || '',
    title: detail.title || '',
    permission: detail.permission || '',
    type: detail.type,
    visible: detail.visible,
    status: detail.status,
    sort: detail.sort || 0,
    keepAlive: detail.keepAlive || 0,
    external: detail.external || 0,
  })
  modalVisible.value = true
}

// 提交表单
async function handleSubmit() {
  formLoading.value = true
  try {
    const data = {
      parentId: formData.parentId || null,
      name: formData.name,
      path: formData.path || null,
      component: formData.component || null,
      redirect: formData.redirect || null,
      icon: formData.icon || null,
      title: formData.title,
      permission: formData.permission || null,
      type: formData.type,
      visible: formData.visible,
      status: formData.status,
      sort: formData.sort,
      keepAlive: formData.keepAlive,
      external: formData.external,
    }

    if (formData.id) {
      await menuApi.update(formData.id, data)
      message.success('更新成功')
    }
    else {
      await menuApi.create(data)
      message.success('创建成功')
    }

    modalVisible.value = false
    fetchMenus()
    fetchMenuList()
  }
  catch (e) {
    message.error(e.message || '操作失败')
  }
  finally {
    formLoading.value = false
  }
}

// 删除菜单
function handleDelete(id) {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除该菜单吗？删除后子菜单也会被删除。',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      await menuApi.delete(id)
      message.success('删除成功')
      fetchMenus()
      fetchMenuList()
    },
  })
}

// 批量删除
function handleBatchDelete() {
  if (!checkedRowKeys.value.length) {
    message.warning('请选择要删除的菜单')
    return
  }
  dialog.warning({
    title: '确认删除',
    content: `确定要删除选中的 ${checkedRowKeys.value.length} 个菜单吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      await menuApi.batchDelete(checkedRowKeys.value)
      message.success('删除成功')
      checkedRowKeys.value = []
      fetchMenus()
      fetchMenuList()
    },
  })
}

// 导出菜单数据
async function handleExport() {
  const res = await exportApi.exportMenus()
  const data = res.data
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `menus_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  message.success('导出成功')
}

onMounted(() => {
  fetchMenus()
  fetchMenuList()
})
</script>

<template>
  <div>
    <div flex justify-between items-center mb-4>
      <h1 text-2xl font-bold>
        菜单管理
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
        <NButton type="primary" @click="handleAdd()">
          新增菜单
        </NButton>
      </n-space>
    </div>

    <n-card>
      <n-data-table
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="flattenedMenus"
        :loading="loading"
        :row-key="row => row.id"
      />
    </n-card>

    <!-- 新增/编辑弹窗 -->
    <n-modal
      v-model:show="modalVisible"
      preset="dialog"
      :title="modalTitle"
      style="width: 650px"
    >
      <n-form label-placement="left" label-width="80">
        <n-grid :cols="2" :x-gap="16">
          <n-gi>
            <n-form-item label="上级菜单">
              <n-select v-model:value="formData.parentId" :options="parentMenuOptions" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="菜单类型" required>
              <n-select v-model:value="formData.type" :options="typeOptions" />
            </n-form-item>
          </n-gi>
        </n-grid>

        <n-grid :cols="2" :x-gap="16">
          <n-gi>
            <n-form-item label="菜单标题" required>
              <n-input v-model:value="formData.title" placeholder="请输入菜单标题" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="路由名称" required>
              <n-input v-model:value="formData.name" placeholder="请输入路由名称" />
            </n-form-item>
          </n-gi>
        </n-grid>

        <n-grid v-if="formData.type !== 3" :cols="2" :x-gap="16">
          <n-gi>
            <n-form-item label="路由路径">
              <n-input v-model:value="formData.path" placeholder="请输入路由路径" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="组件路径">
              <n-input v-model:value="formData.component" placeholder="如: system/user/IndexPage" />
            </n-form-item>
          </n-gi>
        </n-grid>

        <n-grid v-if="formData.type !== 3" :cols="2" :x-gap="16">
          <n-gi>
            <n-form-item label="图标">
              <n-input v-model:value="formData.icon" placeholder="请输入图标名称" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="重定向">
              <n-input v-model:value="formData.redirect" placeholder="请输入重定向路径" />
            </n-form-item>
          </n-gi>
        </n-grid>

        <n-form-item label="权限标识">
          <n-input v-model:value="formData.permission" placeholder="如: system:user:add" />
        </n-form-item>

        <n-grid :cols="4" :x-gap="16">
          <n-gi>
            <n-form-item label="排序">
              <n-input-number v-model:value="formData.sort" :min="0" style="width: 100%" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="状态">
              <n-select v-model:value="formData.status" :options="statusOptions" />
            </n-form-item>
          </n-gi>
          <n-gi v-if="formData.type !== 3">
            <n-form-item label="是否可见">
              <n-select v-model:value="formData.visible" :options="visibleOptions" />
            </n-form-item>
          </n-gi>
          <n-gi v-if="formData.type === 2">
            <n-form-item label="是否缓存">
              <n-select v-model:value="formData.keepAlive" :options="boolOptions" />
            </n-form-item>
          </n-gi>
        </n-grid>
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
