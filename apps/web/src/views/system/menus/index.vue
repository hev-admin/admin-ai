<script setup>
import { NButton, NTag } from 'naive-ui'
import { computed, h, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createMenuApi, getMenuTreeApi, removeMenuApi, updateMenuApi } from '@/api/menus'
// render 函数中使用需显式引入（unplugin-vue-components 仅解析模板）
import AppIcon from '@/components/AppIcon.vue'
import { hasPermission } from '@/utils/permission'

// 菜单管理（REQUIREMENTS §5.2 / #18）：树形表格 + CRUD，目录/菜单/按钮三类同表，
// 字段按类型条件显隐（权限码为按钮类型必填，服务端同步校验）。

const MENU_TYPE = { dir: 1, menu: 2, button: 3 }

const { t } = useI18n()
const { message, dialog } = useFeedback()

const TYPE_META = computed(() => ({
  [MENU_TYPE.dir]: { label: t('system.menus.typeDir'), tag: 'info' },
  [MENU_TYPE.menu]: { label: t('system.menus.typeMenu'), tag: 'success' },
  [MENU_TYPE.button]: { label: t('system.menus.typeButton'), tag: 'warning' },
}))

const tableRef = ref(null)
const menuTree = ref([])

async function fetchData() {
  menuTree.value = await getMenuTreeApi()
  return { list: menuTree.value, total: 0 }
}

// ---- 新增 / 编辑弹窗 ----
const modalShow = ref(false)
const editing = ref(null)
const modalInitial = ref(null)

/** 父节点候选：仅目录与菜单（按钮不能作父级），标题走 i18n */
function toParentOptions(nodes) {
  return (nodes || [])
    .filter(node => node.type !== MENU_TYPE.button)
    .map(node => ({
      id: node.id,
      label: t(node.name),
      children: node.children?.length ? toParentOptions(node.children) : undefined,
    }))
    .map(node => (node.children?.length ? node : { ...node, children: undefined }))
}

const parentOptions = computed(() => toParentOptions(menuTree.value))

const modalFields = computed(() => [
  {
    key: 'type',
    label: t('system.menus.type'),
    type: 'radio',
    defaultValue: MENU_TYPE.dir,
    options: [
      { label: t('system.menus.typeDir'), value: MENU_TYPE.dir },
      { label: t('system.menus.typeMenu'), value: MENU_TYPE.menu },
      { label: t('system.menus.typeButton'), value: MENU_TYPE.button },
    ],
  },
  {
    key: 'parentId',
    label: t('system.menus.parent'),
    type: 'tree-select',
    treeData: parentOptions.value,
    placeholder: t('system.menus.parentHint'),
    componentProps: { keyField: 'id', labelField: 'label', childrenField: 'children', defaultExpandAll: true },
  },
  { key: 'name', label: t('system.menus.name'), required: true, placeholder: t('system.menus.nameHint') },
  { key: 'path', label: t('system.menus.path'), required: true, show: model => model.type !== MENU_TYPE.button, placeholder: t('system.menus.pathHint') },
  { key: 'component', label: t('system.menus.component'), show: model => model.type === MENU_TYPE.menu, placeholder: t('system.menus.componentHint') },
  { key: 'icon', label: t('system.menus.icon'), show: model => model.type !== MENU_TYPE.button, placeholder: t('system.menus.iconHint') },
  { key: 'permission', label: t('system.menus.permission'), required: true, show: model => model.type === MENU_TYPE.button, placeholder: t('system.menus.permissionHint') },
  { key: 'sort', label: t('system.menus.sort'), type: 'number', defaultValue: 0, componentProps: { precision: 0 } },
  { key: 'hidden', label: t('system.menus.hidden'), type: 'switch', show: model => model.type !== MENU_TYPE.button },
  { key: 'keepAlive', label: t('system.menus.keepAlive'), type: 'switch', show: model => model.type === MENU_TYPE.menu },
])

function openCreate(parentRow = null) {
  editing.value = null
  modalInitial.value = parentRow
    ? { parentId: parentRow.id, type: parentRow.type === MENU_TYPE.menu ? MENU_TYPE.button : MENU_TYPE.menu }
    : null
  modalShow.value = true
}

function openEdit(row) {
  editing.value = row
  modalInitial.value = {
    type: row.type,
    parentId: row.parentId,
    name: row.name,
    path: row.path,
    component: row.component,
    icon: row.icon,
    permission: row.permission,
    sort: row.sort,
    hidden: row.hidden,
    keepAlive: row.keepAlive,
  }
  modalShow.value = true
}

async function handleModalSubmit(values) {
  const isButton = values.type === MENU_TYPE.button
  const payload = {
    parentId: values.parentId ?? null,
    type: values.type,
    name: values.name,
    path: isButton ? null : values.path,
    component: values.type === MENU_TYPE.menu ? values.component : null,
    icon: isButton ? null : values.icon,
    permission: isButton ? values.permission : null,
    sort: values.sort ?? 0,
    hidden: isButton ? false : Boolean(values.hidden),
    keepAlive: values.type === MENU_TYPE.menu ? Boolean(values.keepAlive) : false,
  }
  if (editing.value) {
    await updateMenuApi(editing.value.id, payload)
    message.success(t('common.saveSuccess'))
  }
  else {
    await createMenuApi(payload)
    message.success(t('common.createSuccess'))
  }
  tableRef.value?.reload()
}

// ---- 删除 ----
function confirmRemove(row) {
  dialog.warning({
    title: t('common.deleteConfirmTitle'),
    content: t('system.menus.deleteConfirm', { name: t(row.name) }),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      const { removed } = await removeMenuApi(row.id)
      message.success(t('system.menus.deleted', { count: removed }))
      tableRef.value?.reload()
    },
  })
}

// ---- 列配置 ----
function actionButton(label, type, onClick) {
  return h(NButton, { size: 'small', quaternary: true, type, onClick }, { default: () => label })
}

const columns = computed(() => [
  {
    key: 'name',
    title: t('system.menus.name'),
    minWidth: 220,
    // 行内流对齐:文字节点提供真实基线,树形展开箭头(naive-ui 按文本基线调校)
    // 得以精确对齐;图标由 AppIcon 自带 vertical-align: middle 贴文字。
    // 不可用 inline-flex 包裹——空图标 span 会把容器基线合成到图标底边,整块上浮。
    render: row => h('span', { class: 'whitespace-nowrap' }, [
      row.icon ? h(AppIcon, { icon: row.icon, size: 16, class: 'mr-1.5' }) : null,
      t(row.name),
      row.hidden ? h(NTag, { size: 'tiny', bordered: false, class: 'ml-1.5' }, { default: () => t('system.menus.hiddenTag') }) : null,
    ]),
  },
  {
    key: 'type',
    title: t('system.menus.type'),
    width: 100,
    align: 'center',
    render: row => h(NTag, { size: 'small', bordered: false, type: TYPE_META.value[row.type].tag }, { default: () => TYPE_META.value[row.type].label }),
  },
  { key: 'path', title: t('system.menus.path'), minWidth: 140, render: row => row.path || '—' },
  { key: 'component', title: t('system.menus.component'), minWidth: 160, render: row => row.component || '—' },
  {
    key: 'permission',
    title: t('system.menus.permission'),
    minWidth: 150,
    render: row => row.permission
      ? h(NTag, { size: 'small', bordered: false, type: 'warning' }, { default: () => row.permission })
      : '—',
  },
  { key: 'sort', title: t('system.menus.sort'), width: 70, align: 'center' },
  { key: 'keepAlive', title: t('system.menus.cache'), width: 80, align: 'center', render: row => (row.keepAlive ? t('common.yes') : '—') },
  {
    key: 'actions',
    title: t('common.actions'),
    width: 220,
    align: 'center',
    fixed: 'right',
    render: (row) => {
      const buttons = []
      if (hasPermission('sys:menu:add') && row.type !== MENU_TYPE.button)
        buttons.push(actionButton(t('system.menus.addChild'), 'primary', () => openCreate(row)))
      if (hasPermission('sys:menu:edit'))
        buttons.push(actionButton(t('common.edit'), 'primary', () => openEdit(row)))
      if (hasPermission('sys:menu:delete'))
        buttons.push(actionButton(t('common.delete'), 'error', () => confirmRemove(row)))
      return h('div', { class: 'flex justify-center gap-1' }, buttons)
    },
  },
])
</script>

<template>
  <div>
    <ProTable
      ref="tableRef"
      :columns="columns"
      :fetch-data="fetchData"
      :paginated="false"
      default-expand-all
      :scroll-x="1100"
    >
      <template #toolbar>
        <NButton v-permission="'sys:menu:add'" type="primary" @click="openCreate()">
          <template #icon>
            <AppIcon icon="i-carbon-add" />
          </template>
          {{ t('system.menus.add') }}
        </NButton>
        <span class="text-xs text-gray-400">{{ t('system.menus.reloginHint') }}</span>
      </template>
    </ProTable>

    <ProModalForm
      v-model:show="modalShow"
      :title="editing ? t('system.menus.edit') : t('system.menus.add')"
      :fields="modalFields"
      :initial-values="modalInitial"
      :on-submit="handleModalSubmit"
      :width="560"
      :label-width="100"
    />
  </div>
</template>
