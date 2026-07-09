<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * 表格封装（REQUIREMENTS §9.1 Pro* 组件）：列配置 + 数据源 + 分页 + 工具栏 + loading。
 * 服务端分页（remote）：fetchData({ page, pageSize }) 返回 { list, total }，
 * 搜索条件由调用方闭包并入 fetchData，条件变化后调用 reload({ reset: true })。
 *
 * column：{ key, title, width?, minWidth?, align?, fixed?, ellipsis?, render?(row, index) }
 * 特殊列：{ type: 'selection' }（多选，配合 v-model:checkedRowKeys）、{ type: 'index' }（序号）。
 * render 返回 VNode；插槽 #toolbar（左侧操作区）/ #toolbar-right。
 */
const props = defineProps({
  columns: { type: Array, required: true },
  fetchData: { type: Function, required: true },
  rowKey: { type: String, default: 'id' },
  scrollX: { type: Number, default: undefined },
  immediate: { type: Boolean, default: true },
  checkedRowKeys: { type: Array, default: () => [] },
  /** false 时隐藏分页（树形表格等一次性数据源，fetchData 返回 { list } 即可） */
  paginated: { type: Boolean, default: true },
  defaultExpandAll: { type: Boolean, default: false },
})

const emit = defineEmits(['update:checkedRowKeys'])

const { t } = useI18n()

const list = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const naiveColumns = computed(() => props.columns.map((column) => {
  if (column.type === 'selection')
    return { type: 'selection', width: column.width, disabled: column.disabled }
  if (column.type === 'index') {
    return {
      title: column.title ?? '#',
      key: '__index',
      width: column.width ?? 64,
      align: 'center',
      render: (_, index) => (page.value - 1) * pageSize.value + index + 1,
    }
  }
  return {
    title: column.title,
    key: column.key,
    width: column.width,
    minWidth: column.minWidth,
    align: column.align,
    fixed: column.fixed,
    ellipsis: column.ellipsis ? { tooltip: true } : undefined,
    render: column.render,
  }
}))

const pagination = computed(() => {
  if (!props.paginated)
    return false
  return {
    page: page.value,
    pageSize: pageSize.value,
    itemCount: total.value,
    showSizePicker: true,
    pageSizes: [10, 20, 50],
    prefix: ({ itemCount }) => t('common.totalItems', { total: itemCount }),
    onChange: (value) => {
      page.value = value
      load()
    },
    onUpdatePageSize: (value) => {
      pageSize.value = value
      page.value = 1
      load()
    },
  }
})

async function load() {
  loading.value = true
  try {
    const data = await props.fetchData({ page: page.value, pageSize: pageSize.value })
    list.value = data?.list ?? []
    total.value = data?.total ?? 0
    // 末页数据被删空后自动回退一页
    if (props.paginated && !list.value.length && page.value > 1) {
      page.value -= 1
      return load()
    }
  }
  finally {
    loading.value = false
  }
}

/** 重新拉取当前页；reset: true 时回到第一页（搜索条件变化后用） */
function reload({ reset = false } = {}) {
  if (reset)
    page.value = 1
  return load()
}

defineExpose({ reload })

onMounted(() => {
  if (props.immediate)
    load()
})
</script>

<template>
  <NCard :bordered="false">
    <div v-if="$slots.toolbar || $slots['toolbar-right']" class="mb-3 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <slot name="toolbar" />
      </div>
      <div class="flex items-center gap-2">
        <slot name="toolbar-right" />
        <NTooltip>
          <template #trigger>
            <NButton quaternary circle :loading="loading" @click="reload()">
              <template #icon>
                <AppIcon icon="i-carbon-renew" />
              </template>
            </NButton>
          </template>
          {{ t('common.refresh') }}
        </NTooltip>
      </div>
    </div>

    <NDataTable
      remote
      :columns="naiveColumns"
      :data="list"
      :loading="loading"
      :row-key="row => row[rowKey]"
      :pagination="pagination"
      :scroll-x="scrollX"
      :default-expand-all="defaultExpandAll"
      :checked-row-keys="checkedRowKeys"
      @update:checked-row-keys="keys => emit('update:checkedRowKeys', keys)"
    />
  </NCard>
</template>
