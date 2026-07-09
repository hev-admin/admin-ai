<script setup>
import { NButton, NSwitch, NTag } from 'naive-ui'
import { computed, h, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  assignUserRolesApi,
  createUserApi,
  listUsersApi,
  removeUserApi,
  removeUsersApi,
  resetUserPasswordApi,
  setUserStatusApi,
  updateUserApi,
} from '@/api/users'
import { listRolesApi } from '@/api/roles'
import { formatDateTime } from '@/utils/format'
import { hasPermission } from '@/utils/permission'

// 用户管理（REQUIREMENTS §5.2 / #18）：模板演示 v-permission 指令（工具栏按钮）
// 与 hasPermission 函数（render 列内按钮）两种按钮级权限用法。
// 文案全部走 i18n（M3 #22）：列/字段配置用 computed 包裹，切换语言即时重译。

const { t } = useI18n()
const { message, dialog } = useFeedback()

const tableRef = ref(null)
const searchParams = ref({})
const checkedRowKeys = ref([])

const searchFields = computed(() => [
  { key: 'username', label: t('system.users.username'), placeholder: t('common.fuzzyHint') },
  {
    key: 'status',
    label: t('common.status'),
    type: 'select',
    width: 140,
    options: [
      { label: t('common.enabled'), value: 1 },
      { label: t('common.disabled'), value: 0 },
    ],
  },
])

function fetchData({ page, pageSize }) {
  return listUsersApi({ page, pageSize, ...searchParams.value })
}

function handleSearch(values) {
  searchParams.value = values
  checkedRowKeys.value = []
  tableRef.value?.reload({ reset: true })
}

// 角色下拉选项（新增/编辑与分配角色共用）
const roleOptions = ref([])
onMounted(async () => {
  if (!hasPermission('sys:role:list'))
    return
  const data = await listRolesApi({ page: 1, pageSize: 100 })
  roleOptions.value = data.list.map(role => ({ label: role.name, value: role.id }))
})

// ---- 新增 / 编辑弹窗 ----
const modalShow = ref(false)
const editing = ref(null)
const modalInitial = ref(null)

const modalFields = computed(() => [
  { key: 'username', label: t('system.users.username'), required: true, disabled: Boolean(editing.value), placeholder: t('system.users.usernameHint') },
  ...(editing.value ? [] : [{ key: 'password', label: t('system.users.initialPassword'), type: 'password', required: true, placeholder: t('system.users.passwordHint') }]),
  { key: 'nickname', label: t('system.users.nickname'), required: true },
  { key: 'email', label: t('system.users.email'), placeholder: t('common.optional') },
  { key: 'avatar', label: t('system.users.avatar'), placeholder: t('system.users.avatarHint') },
  { key: 'roleIds', label: t('system.users.roles'), type: 'select', options: roleOptions.value, componentProps: { multiple: true } },
  { key: 'status', label: t('common.enabled'), type: 'switch', defaultValue: true },
])

function openCreate() {
  editing.value = null
  modalInitial.value = null
  modalShow.value = true
}

function openEdit(row) {
  editing.value = row
  modalInitial.value = {
    username: row.username,
    nickname: row.nickname,
    email: row.email,
    avatar: row.avatar,
    roleIds: [...row.roleIds],
    status: row.status === 1,
  }
  modalShow.value = true
}

async function handleModalSubmit(values) {
  const payload = {
    nickname: values.nickname,
    email: values.email ?? '',
    avatar: values.avatar ?? '',
    roleIds: values.roleIds ?? [],
    status: values.status ? 1 : 0,
  }
  if (editing.value) {
    await updateUserApi(editing.value.id, payload)
    message.success(t('common.saveSuccess'))
  }
  else {
    await createUserApi({ ...payload, username: values.username, password: values.password })
    message.success(t('common.createSuccess'))
  }
  tableRef.value?.reload()
}

// ---- 重置密码弹窗 ----
const passwordShow = ref(false)
const passwordTarget = ref(null)
const passwordFields = computed(() => [
  { key: 'password', label: t('system.users.newPassword'), type: 'password', required: true, placeholder: t('system.users.passwordHint') },
])

function openResetPassword(row) {
  passwordTarget.value = row
  passwordShow.value = true
}

async function handlePasswordSubmit(values) {
  await resetUserPasswordApi(passwordTarget.value.id, values.password)
  message.success(t('system.users.pwdResetDone'))
}

// ---- 分配角色弹窗 ----
const rolesShow = ref(false)
const rolesTarget = ref(null)
const rolesInitial = ref(null)
const rolesFields = computed(() => [
  { key: 'roleIds', label: t('system.users.roles'), type: 'select', options: roleOptions.value, componentProps: { multiple: true } },
])

function openAssignRoles(row) {
  rolesTarget.value = row
  rolesInitial.value = { roleIds: [...row.roleIds] }
  rolesShow.value = true
}

async function handleRolesSubmit(values) {
  await assignUserRolesApi(rolesTarget.value.id, values.roleIds ?? [])
  message.success(t('system.users.rolesUpdated'))
  tableRef.value?.reload()
}

// ---- 状态 / 删除 ----
async function handleStatusChange(row, value) {
  await setUserStatusApi(row.id, value ? 1 : 0)
  message.success(value ? t('system.users.enabledMsg') : t('system.users.disabledMsg'))
  tableRef.value?.reload()
}

function confirmRemove(row) {
  dialog.warning({
    title: t('common.deleteConfirmTitle'),
    content: t('system.users.deleteConfirm', { name: row.username }),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      await removeUserApi(row.id)
      message.success(t('common.deleteSuccess'))
      checkedRowKeys.value = checkedRowKeys.value.filter(key => key !== row.id)
      tableRef.value?.reload()
    },
  })
}

function confirmBatchRemove() {
  dialog.warning({
    title: t('system.users.batchDeleteTitle'),
    content: t('system.users.batchDeleteConfirm', { count: checkedRowKeys.value.length }),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      const { removed } = await removeUsersApi(checkedRowKeys.value)
      message.success(t('system.users.batchDeleted', { count: removed }))
      checkedRowKeys.value = []
      tableRef.value?.reload()
    },
  })
}

// ---- 列配置 ----
function actionButton(label, type, onClick) {
  return h(NButton, { size: 'small', quaternary: true, type, onClick }, { default: () => label })
}

const columns = computed(() => [
  { type: 'selection' },
  { key: 'username', title: t('system.users.username'), width: 120 },
  { key: 'nickname', title: t('system.users.nickname'), width: 120, ellipsis: true },
  { key: 'email', title: t('system.users.email'), minWidth: 180, ellipsis: true, render: row => row.email || '—' },
  {
    key: 'roles',
    title: t('system.users.roles'),
    minWidth: 150,
    render: row => row.roles?.length
      ? h('div', { class: 'flex flex-wrap gap-1' }, row.roles.map(role =>
          h(NTag, { size: 'small', type: 'info', bordered: false }, { default: () => role.name })))
      : '—',
  },
  {
    key: 'status',
    title: t('common.status'),
    width: 80,
    align: 'center',
    render: row => h(NSwitch, {
      value: row.status === 1,
      size: 'small',
      disabled: !hasPermission('sys:user:status'),
      onUpdateValue: value => handleStatusChange(row, value),
    }),
  },
  { key: 'createdAt', title: t('common.createdAt'), width: 170, render: row => formatDateTime(row.createdAt) },
  {
    key: 'actions',
    title: t('common.actions'),
    width: 250,
    align: 'center',
    fixed: 'right',
    render: (row) => {
      const buttons = []
      if (hasPermission('sys:user:edit'))
        buttons.push(actionButton(t('common.edit'), 'primary', () => openEdit(row)))
      if (hasPermission('sys:user:resetPwd'))
        buttons.push(actionButton(t('system.users.resetPwd'), 'warning', () => openResetPassword(row)))
      if (hasPermission('sys:user:assignRole'))
        buttons.push(actionButton(t('system.users.assignRole'), 'info', () => openAssignRoles(row)))
      if (hasPermission('sys:user:delete'))
        buttons.push(actionButton(t('common.delete'), 'error', () => confirmRemove(row)))
      return h('div', { class: 'flex justify-center gap-1' }, buttons)
    },
  },
])
</script>

<template>
  <div>
    <ProSearchForm :fields="searchFields" @search="handleSearch" />

    <ProTable
      ref="tableRef"
      v-model:checked-row-keys="checkedRowKeys"
      :columns="columns"
      :fetch-data="fetchData"
      :scroll-x="1100"
    >
      <template #toolbar>
        <NButton v-permission="'sys:user:add'" type="primary" @click="openCreate">
          <template #icon>
            <AppIcon icon="i-carbon-add" />
          </template>
          {{ t('system.users.add') }}
        </NButton>
        <NButton
          v-permission="'sys:user:delete'"
          type="error"
          secondary
          :disabled="!checkedRowKeys.length"
          @click="confirmBatchRemove"
        >
          <template #icon>
            <AppIcon icon="i-carbon-trash-can" />
          </template>
          {{ t('common.batchDelete') }}
        </NButton>
      </template>
    </ProTable>

    <ProModalForm
      v-model:show="modalShow"
      :title="editing ? t('system.users.edit') : t('system.users.add')"
      :fields="modalFields"
      :initial-values="modalInitial"
      :on-submit="handleModalSubmit"
    />

    <ProModalForm
      v-model:show="passwordShow"
      :title="t('system.users.resetPwdTitle', { name: passwordTarget?.username ?? '' })"
      :fields="passwordFields"
      :on-submit="handlePasswordSubmit"
    />

    <ProModalForm
      v-model:show="rolesShow"
      :title="t('system.users.assignRoleTitle', { name: rolesTarget?.username ?? '' })"
      :fields="rolesFields"
      :initial-values="rolesInitial"
      :on-submit="handleRolesSubmit"
    />
  </div>
</template>
