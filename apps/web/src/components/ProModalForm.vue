<script setup>
import { computed, reactive, ref, toRaw, watch } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * 弹窗表单封装（REQUIREMENTS §9.1 Pro* 组件）：字段 schema 渲染常用控件，
 * validate / resetFields 等库间语义差异由本组件消化，业务页面不接触 UI 库表单 API。
 *
 * field：{
 *   key, label,
 *   type: 'input' | 'password' | 'textarea' | 'number' | 'select' | 'radio' | 'switch' | 'tree-select' | 'date',
 *   options?, treeData?,            // select/radio 选项、tree-select 树数据
 *   required?, rules?,              // required 生成通用非空校验；rules 传入则优先
 *   placeholder?, defaultValue?,
 *   disabled?,                      // boolean 或 (model) => boolean
 *   show?,                          // (model) => boolean，条件显隐（如按类型切换字段）
 *   componentProps?,                // 透传底层控件的逃逸口（§2.2 口径：集中、少量）
 * }
 * 特殊控件经 #field-<key> 插槽承接。
 *
 * onSubmit(values) 返回 Promise：resolve 关闭弹窗、reject 保持打开（错误提示由请求层统一处理）。
 */
const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  fields: { type: Array, required: true },
  initialValues: { type: Object, default: null },
  onSubmit: { type: Function, default: null },
  width: { type: Number, default: 520 },
  labelWidth: { type: Number, default: 90 },
})

const emit = defineEmits(['update:show'])

const { t } = useI18n()

const formRef = ref(null)
const submitting = ref(false)
const model = reactive({})

function defaultByType(field) {
  if (field.type === 'switch')
    return false
  return null
}

function initModel() {
  Object.keys(model).forEach(key => delete model[key])
  props.fields.forEach((field) => {
    model[field.key] = props.initialValues?.[field.key] ?? field.defaultValue ?? defaultByType(field)
  })
}

watch(() => props.show, (visible) => {
  if (visible) {
    initModel()
    formRef.value?.restoreValidation()
  }
})

const visibleFields = computed(() => props.fields.filter(field => !field.show || field.show(model)))

// required 用自定义校验器统一处理各值形态（字符串/数组/数字/null），规避 async-validator 的 type 约束
const rules = computed(() => {
  const result = {}
  for (const field of visibleFields.value) {
    if (field.rules) {
      result[field.key] = field.rules
    }
    else if (field.required) {
      const selectLike = ['select', 'tree-select', 'radio', 'date'].includes(field.type)
      result[field.key] = {
        required: true,
        trigger: ['blur', 'change'],
        message: t(selectLike ? 'common.pleaseSelectField' : 'common.pleaseInputField', { field: field.label }),
        validator: (_, value) => {
          if (value === null || value === undefined || value === '')
            return false
          if (Array.isArray(value) && !value.length)
            return false
          return true
        },
      }
    }
  }
  return result
})

function isDisabled(field) {
  return typeof field.disabled === 'function' ? field.disabled(model) : Boolean(field.disabled)
}

async function handleConfirm() {
  try {
    await formRef.value?.validate()
  }
  catch {
    return
  }
  submitting.value = true
  try {
    await props.onSubmit?.({ ...toRaw(model) })
    emit('update:show', false)
  }
  catch {
    // 保持弹窗打开：错误提示由请求层统一 toast
  }
  finally {
    submitting.value = false
  }
}

function handleClose() {
  emit('update:show', false)
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="title"
    :style="{ width: `${width}px` }"
    :mask-closable="false"
    @update:show="handleClose"
  >
    <NForm
      ref="formRef"
      :model="model"
      :rules="rules"
      label-placement="left"
      :label-width="labelWidth"
      require-mark-placement="left"
    >
      <NFormItem v-for="field in visibleFields" :key="field.key" :label="field.label" :path="field.key">
        <slot :name="`field-${field.key}`" :model="model">
          <NInputNumber
            v-if="field.type === 'number'"
            v-model:value="model[field.key]"
            class="w-full"
            :disabled="isDisabled(field)"
            :placeholder="field.placeholder ?? t('common.pleaseInput')"
            v-bind="field.componentProps"
          />
          <NSelect
            v-else-if="field.type === 'select'"
            v-model:value="model[field.key]"
            :options="field.options ?? []"
            clearable
            :disabled="isDisabled(field)"
            :placeholder="field.placeholder ?? t('common.pleaseSelect')"
            v-bind="field.componentProps"
          />
          <NRadioGroup
            v-else-if="field.type === 'radio'"
            v-model:value="model[field.key]"
            :disabled="isDisabled(field)"
            v-bind="field.componentProps"
          >
            <NRadio v-for="option in field.options ?? []" :key="option.value" :value="option.value">
              {{ option.label }}
            </NRadio>
          </NRadioGroup>
          <NSwitch
            v-else-if="field.type === 'switch'"
            v-model:value="model[field.key]"
            :disabled="isDisabled(field)"
            v-bind="field.componentProps"
          />
          <NTreeSelect
            v-else-if="field.type === 'tree-select'"
            v-model:value="model[field.key]"
            :options="field.treeData ?? []"
            clearable
            :disabled="isDisabled(field)"
            :placeholder="field.placeholder ?? t('common.pleaseSelect')"
            v-bind="field.componentProps"
          />
          <NDatePicker
            v-else-if="field.type === 'date'"
            v-model:value="model[field.key]"
            type="date"
            clearable
            class="w-full"
            :disabled="isDisabled(field)"
            v-bind="field.componentProps"
          />
          <NInput
            v-else
            v-model:value="model[field.key]"
            :type="field.type === 'password' ? 'password' : field.type === 'textarea' ? 'textarea' : 'text'"
            :show-password-on="field.type === 'password' ? 'click' : undefined"
            :disabled="isDisabled(field)"
            :placeholder="field.placeholder ?? t('common.pleaseInput')"
            v-bind="field.componentProps"
          />
        </slot>
      </NFormItem>
    </NForm>

    <template #footer>
      <div class="flex justify-end gap-2">
        <NButton :disabled="submitting" @click="handleClose">
          {{ t('common.cancel') }}
        </NButton>
        <NButton type="primary" :loading="submitting" @click="handleConfirm">
          {{ t('common.confirm') }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>
