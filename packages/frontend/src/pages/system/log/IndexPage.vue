<script setup>
import { NButton, NTag } from 'naive-ui'
import { logApi } from '@/api/log.js'

const message = useMessage()

const logs = ref([])
const loading = ref(false)
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0 })
const filters = ref({ module: '', username: '' })
const dateRange = ref(null)
const sortField = ref('createdAt')
const sortOrder = ref('desc')

// 详情弹窗
const detailVisible = ref(false)
const detailData = ref(null)

// 模块选项
const moduleOptions = [
  { label: '全部', value: '' },
  { label: '用户管理', value: '用户管理' },
  { label: '角色管理', value: '角色管理' },
  { label: '菜单管理', value: '菜单管理' },
  { label: '认证', value: '认证' },
  { label: '其他', value: '其他' },
]

// 表格列定义
const columns = [
  { title: '用户', key: 'username', width: 100, render: row => row.username || '-' },
  { title: '模块', key: 'module', width: 100 },
  { title: '操作', key: 'action', width: 80 },
  { title: '请求方法', key: 'method', width: 90 },
  { title: '请求路径', key: 'path', ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render(row) {
      return h(NTag, { type: row.status === 1 ? 'success' : 'error', size: 'small' }, {
        default: () => row.status === 1 ? '成功' : '失败',
      })
    },
  },
  {
    title: '耗时',
    key: 'duration',
    width: 80,
    sorter: true,
    render: row => `${row.duration}ms`,
  },
  {
    title: '时间',
    key: 'createdAt',
    width: 170,
    sorter: true,
    render: row => new Date(row.createdAt).toLocaleString('zh-CN'),
  },
  {
    title: '操作',
    key: 'actions',
    width: 60,
    render(row) {
      return h(NButton, { text: true, type: 'primary', onClick: () => showDetail(row) }, { default: () => '详情' })
    },
  },
]

async function fetchLogs() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filters.value,
      sortField: sortField.value,
      sortOrder: sortOrder.value,
    }
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await logApi.getList(params)
    logs.value = res.data.list
    pagination.itemCount = res.data.pagination.total
  }
  catch (e) {
    message.error(e.message || '获取日志失败')
  }
  finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchLogs()
}

function handlePageChange(page) {
  pagination.page = page
  fetchLogs()
}

function handleSorterChange(sorter) {
  if (sorter && sorter.columnKey) {
    sortField.value = sorter.columnKey
    sortOrder.value = sorter.order === 'ascend' ? 'asc' : 'desc'
  }
  else {
    sortField.value = 'createdAt'
    sortOrder.value = 'desc'
  }
  fetchLogs()
}

function handleReset() {
  filters.value = { module: '', username: '' }
  dateRange.value = null
  sortField.value = 'createdAt'
  sortOrder.value = 'desc'
  pagination.page = 1
  fetchLogs()
}

function showDetail(row) {
  detailData.value = row
  detailVisible.value = true
}

onMounted(fetchLogs)
</script>

<template>
  <div>
    <h1 text-2xl font-bold mb-4>
      操作日志
    </h1>

    <n-card mb-4>
      <n-space align="center" :wrap="true">
        <n-input
          v-model:value="filters.username"
          placeholder="搜索用户名"
          style="width: 160px"
          clearable
          @keyup.enter="handleSearch"
        />
        <n-select
          v-model:value="filters.module"
          placeholder="模块筛选"
          :options="moduleOptions"
          style="width: 140px"
          clearable
          @update:value="handleSearch"
        />
        <n-date-picker
          v-model:value="dateRange"
          type="daterange"
          clearable
          @update:value="handleSearch"
        />
        <NButton type="primary" @click="handleSearch">
          搜索
        </NButton>
        <NButton @click="handleReset">
          重置
        </NButton>
      </n-space>
    </n-card>

    <n-card>
      <n-data-table
        :columns="columns"
        :data="logs"
        :loading="loading"
        :row-key="row => row.id"
        @update:sorter="handleSorterChange"
      />
      <n-empty v-if="!loading && logs.length === 0" description="暂无日志数据" mt-4 />
      <div flex justify-end mt-4>
        <n-pagination
          v-model:page="pagination.page"
          :page-size="pagination.pageSize"
          :item-count="pagination.itemCount"
          @update:page="handlePageChange"
        />
      </div>
    </n-card>

    <!-- 详情弹窗 -->
    <n-modal
      v-model:show="detailVisible"
      preset="dialog"
      title="日志详情"
      style="width: 550px"
    >
      <n-descriptions v-if="detailData" bordered :column="1" label-placement="left">
        <n-descriptions-item label="用户">
          {{ detailData.username || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="模块">
          {{ detailData.module }}
        </n-descriptions-item>
        <n-descriptions-item label="操作">
          {{ detailData.action }}
        </n-descriptions-item>
        <n-descriptions-item label="请求方法">
          {{ detailData.method }}
        </n-descriptions-item>
        <n-descriptions-item label="请求路径">
          {{ detailData.path }}
        </n-descriptions-item>
        <n-descriptions-item label="IP 地址">
          {{ detailData.ip }}
        </n-descriptions-item>
        <n-descriptions-item label="User-Agent">
          {{ detailData.userAgent || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="状态">
          <NTag :type="detailData.status === 1 ? 'success' : 'error'" size="small">
            {{ detailData.status === 1 ? '成功' : '失败' }}
          </NTag>
        </n-descriptions-item>
        <n-descriptions-item label="耗时">
          {{ detailData.duration }}ms
        </n-descriptions-item>
        <n-descriptions-item label="时间">
          {{ new Date(detailData.createdAt).toLocaleString('zh-CN') }}
        </n-descriptions-item>
      </n-descriptions>
    </n-modal>
  </div>
</template>
