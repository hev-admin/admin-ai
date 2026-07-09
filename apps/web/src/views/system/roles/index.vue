<script setup>
import { NButton, NTag } from 'naive-ui'
import { computed, h, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getMenuTreeApi } from '@/api/menus'
import { assignRoleMenusApi, createRoleApi, listRolesApi, removeRoleApi, updateRoleApi } from '@/api/roles'
import { formatDateTime } from '@/utils/format'
import { hasPermission } from '@/utils/permission'

// 角色管理（REQUIREMENTS §5.2 / #18）：CRUD + 分配权限（菜单树勾选，含按钮级权限节点）

const SUPER_ROLE_CODE = 'super'

const { t } = useI18n()
const { message, dialog } = useFeedback()

const tableRef = ref(null)
const searchParams = ref({})

const searchFields = computed(() => [
  { key: 'name', label: t('system.roles.name'), placeholder: t('common.fuzzyHint') },
  { key: 'code', label: t('system.roles.code'), placeholder: t('common.fuzzyHint') },
])

function fetchData({ page, pageSize }) {
  return listRolesApi({ page, pageSize, ...searchParams.value })
}

function handleSearch(values) {
  searchParams.value = values
  tableRef.value?.reload({ reset: true })
}

// ---- 新增 / 编辑弹窗 ----
const modalShow = ref(false)
const editing = ref(null)
const modalInitial = ref(null)

const modalFields = computed(() => [
  { key: 'name', label: t('system.roles.name'), required: true },
  {
    key: 'code',
    label: t('system.roles.code'),
    required: true,
    placeholder: t('system.roles.codeHint'),
    // super 是权限短路的语义锚点，标识不可改（服务端同样校验）
    disabled: editing.value?.code === SUPER_ROLE_CODE,
  },
  { key: 'remark', label: t('common.remark'), type: 'textarea', placeholder: t('common.optional') },
])

function openCreate() {
  editing.value = null
  modalInitial.value = null
  modalShow.value = true
}

function openEdit(row) {
  editing.value = row
  modalInitial.value = { name: row.name, code: row.code, remark: row.remark }
  modalShow.value = true
}

async function handleModalSubmit(values) {
  const payload = { name: values.name, code: values.code, remark: values.remark ?? '' }
  if (editing.value) {
    await updateRoleApi(editing.value.id, payload)
    message.success(t('common.saveSuccess'))
  }
  else {
    await createRoleApi(payload)
    message.success(t('common.createSuccess'))
  }
  tableRef.value?.reload()
}

// ---- 分配权限弹窗 ----
const permShow = ref(false)
const permTarget = ref(null)
const permInitial = ref(null)
const menuTree = ref([])
const permFields = computed(() => [{ key: 'menuIds', label: t('system.roles.menuPerms'), defaultValue: [] }])

/** 后端菜单树 → NTree data（标题走 i18n，未登记的自定义 key 原样显示） */
function toTreeData(nodes) {
  return (nodes || []).map(node => ({
    id: node.id,
    label: t(node.name),
    children: node.children?.length ? toTreeData(node.children) : undefined,
  }))
}

function collectIds(nodes, acc = []) {
  for (const node of nodes || []) {
    acc.push(node.id)
    if (node.children?.length)
      collectIds(node.children, acc)
  }
  return acc
}

/** 级联勾选回显只放叶子节点，父节点勾选态由 NTree cascade 推导 */
function leafIdsOf(nodes, picked, acc = []) {
  for (const node of nodes || []) {
    if (node.children?.length)
      leafIdsOf(node.children, picked, acc)
    else if (picked.has(node.id))
      acc.push(node.id)
  }
  return acc
}

/** 提交时补全「有勾选后代」的全部祖先 id：目录/菜单节点必须随按钮一起入库，否则该角色菜单树断链 */
function withAncestors(nodes, checked) {
  const result = new Set(checked)
  function walk(node) {
    let has = result.has(node.id)
    for (const child of node.children ?? []) {
      if (walk(child))
        has = true
    }
    if (has)
      result.add(node.id)
    return has
  }
  for (const node of nodes) walk(node)
  return [...result]
}

async function openAssignPerm(row) {
  permTarget.value = row
  if (!menuTree.value.length)
    menuTree.value = await getMenuTreeApi()
  const picked = new Set(row.menuIds)
  permInitial.value = { menuIds: leafIdsOf(menuTree.value, picked) }
  permShow.value = true
}

const permTreeData = computed(() => toTreeData(menuTree.value))
const permExpandedKeys = computed(() => collectIds(menuTree.value))

async function handlePermSubmit(values) {
  const menuIds = withAncestors(menuTree.value, values.menuIds ?? [])
  await assignRoleMenusApi(permTarget.value.id, menuIds)
  message.success(t('system.roles.permsUpdated'))
  tableRef.value?.reload()
}

// ---- 删除 ----
function confirmRemove(row) {
  dialog.warning({
    title: t('common.deleteConfirmTitle'),
    content: t('system.roles.deleteConfirm', { name: row.name }),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      await removeRoleApi(row.id)
      message.success(t('common.deleteSuccess'))
      tableRef.value?.reload()
    },
  })
}

// ---- 列配置 ----
function actionButton(label, type, onClick) {
  return h(NButton, { size: 'small', quaternary: true, type, onClick }, { default: () => label })
}

const columns = computed(() => [
  { key: 'name', title: t('system.roles.name'), width: 160 },
  {
    key: 'code',
    title: t('system.roles.code'),
    width: 140,
    render: row => h(NTag, { size: 'small', bordered: false, type: row.code === SUPER_ROLE_CODE ? 'warning' : 'default' }, { default: () => row.code }),
  },
  { key: 'remark', title: t('common.remark'), minWidth: 180, ellipsis: true, render: row => row.remark || '—' },
  { key: 'createdAt', title: t('common.createdAt'), width: 170, render: row => formatDateTime(row.createdAt) },
  {
    key: 'actions',
    title: t('common.actions'),
    width: 220,
    align: 'center',
    fixed: 'right',
    render: (row) => {
      const buttons = []
      if (hasPermission('sys:role:edit'))
        buttons.push(actionButton(t('common.edit'), 'primary', () => openEdit(row)))
      if (hasPermission('sys:role:assignPerm'))
        buttons.push(actionButton(t('system.roles.assignPerm'), 'info', () => openAssignPerm(row)))
      if (hasPermission('sys:role:delete'))
        buttons.push(actionButton(t('common.delete'), 'error', () => confirmRemove(row)))
      return h('div', { class: 'flex justify-center gap-1' }, buttons)
    },
  },
])
</script>

<template>
  <div>
    <ProSearchForm :fields="searchFields" @search="handleSearch" />

    <ProTable ref="tableRef" :columns="columns" :fetch-data="fetchData" :scroll-x="900">
      <template #toolbar>
        <NButton v-permission="'sys:role:add'" type="primary" @click="openCreate">
          <template #icon>
            <AppIcon icon="i-carbon-add" />
          </template>
          {{ t('system.roles.add') }}
        </NButton>
      </template>
    </ProTable>

    <ProModalForm
      v-model:show="modalShow"
      :title="editing ? t('system.roles.edit') : t('system.roles.add')"
      :fields="modalFields"
      :initial-values="modalInitial"
      :on-submit="handleModalSubmit"
    />

    <ProModalForm
      v-model:show="permShow"
      :title="t('system.roles.assignPermTitle', { name: permTarget?.name ?? '' })"
      :fields="permFields"
      :initial-values="permInitial"
      :on-submit="handlePermSubmit"
      :label-width="90"
    >
      <template #field-menuIds="{ model }">
        <div class="max-h-80 w-full overflow-auto rounded border border-gray-200 p-2 dark:border-gray-700">
          <NTree
            block-line
            checkable
            cascade
            :data="permTreeData"
            key-field="id"
            label-field="label"
            children-field="children"
            :checked-keys="model.menuIds"
            :default-expanded-keys="permExpandedKeys"
            @update:checked-keys="keys => (model.menuIds = keys)"
          />
        </div>
      </template>
    </ProModalForm>
  </div>
</template>
