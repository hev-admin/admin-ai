<script setup>
import { NTag } from 'naive-ui'
import { logApi } from '@/api/log.js'

const logs = ref([])
const loading = ref(false)
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0 })
const filters = ref({ module: '', username: '' })

// 表格列定义
const columns = [
  { title: '用户', key: 'username', render: row => row.username || '-' },
  { title: '模块', key: 'module' },
  { title: '操作', key: 'action' },
  { title: '请求路径', key: 'path' },
  {
    title: '状态',
    key: 'status',
    render(row) {
      return h(NTag, { type: row.status === 1 ? 'success' : 'error' }, {
        default: () => row.status === 1 ? '成功' : '失败',
      })
    },
  },
  { title: '耗时', key: 'duration', render: row => `${row.duration}ms` },
  { title: '时间', key: 'createdAt', render: row => new Date(row.createdAt).toLocaleString('zh-CN') },
]

async function fetchLogs() {
  loading.value = true
  try {
    const res = await logApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filters.value,
    })
    logs.value = res.data.list
    pagination.itemCount = res.data.pagination.total
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

onMounted(fetchLogs)
</script>

<template>
  <div>
    <h1 text-2xl font-bold mb-4>
      操作日志
    </h1>

    <n-card mb-4>
      <n-space>
        <n-input
          v-model:value="filters.username"
          placeholder="搜索用户名"
          style="width: 200px"
          @keyup.enter="handleSearch"
        />
        <n-button type="primary" @click="handleSearch">
          搜索
        </n-button>
      </n-space>
    </n-card>

    <n-card>
      <n-data-table
        :columns="columns"
        :data="logs"
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
  </div>
</template>
