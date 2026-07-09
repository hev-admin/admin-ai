<script setup>
import { reactive, toRaw } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * 条件搜索区封装（REQUIREMENTS §9.1 Pro* 组件）：字段配置渲染 + 查询/重置。
 * 业务页面不直接散用 UI 库表单组合；切换 UI 库时仅重写本组件内部实现。
 *
 * field：{ key, label, type: 'input' | 'select' | 'date', options?, placeholder?, width? }
 * 特殊控件经 #field-<key> 插槽承接（作用域含 model）。
 *
 * 约定：emit('search', values) 的 values 已剔除空值（null / '' / undefined 不参与过滤，
 * 与 server repository 的 where 空值忽略约定对齐）；重置后自动触发一次查询。
 */
const props = defineProps({
  fields: { type: Array, required: true },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['search'])

const { t } = useI18n()

const model = reactive({})
initModel()

function initModel() {
  props.fields.forEach((field) => {
    model[field.key] = field.defaultValue ?? null
  })
}

function compactValues() {
  const values = {}
  for (const [key, value] of Object.entries(toRaw(model))) {
    if (value !== null && value !== undefined && value !== '')
      values[key] = value
  }
  return values
}

function handleSearch() {
  emit('search', compactValues())
}

function handleReset() {
  initModel()
  emit('search', compactValues())
}
</script>

<template>
  <NCard :bordered="false" class="mb-4">
    <NForm inline label-placement="left" :show-feedback="false" class="flex flex-wrap gap-y-3">
      <NFormItem v-for="field in fields" :key="field.key" :label="field.label">
        <slot :name="`field-${field.key}`" :model="model">
          <NSelect
            v-if="field.type === 'select'"
            v-model:value="model[field.key]"
            :options="field.options ?? []"
            :placeholder="field.placeholder ?? t('common.pleaseSelect')"
            clearable
            :style="{ width: `${field.width ?? 160}px` }"
          />
          <NDatePicker
            v-else-if="field.type === 'date'"
            v-model:value="model[field.key]"
            type="date"
            clearable
            :style="{ width: `${field.width ?? 160}px` }"
          />
          <NInput
            v-else
            v-model:value="model[field.key]"
            :placeholder="field.placeholder ?? t('common.pleaseInput')"
            clearable
            :style="{ width: `${field.width ?? 200}px` }"
            @keyup.enter="handleSearch"
          />
        </slot>
      </NFormItem>

      <NFormItem>
        <div class="flex gap-2">
          <NButton type="primary" :loading="loading" @click="handleSearch">
            <template #icon>
              <AppIcon icon="i-carbon-search" />
            </template>
            {{ t('common.search') }}
          </NButton>
          <NButton @click="handleReset">
            <template #icon>
              <AppIcon icon="i-carbon-reset" />
            </template>
            {{ t('common.reset') }}
          </NButton>
        </div>
      </NFormItem>
    </NForm>
  </NCard>
</template>
