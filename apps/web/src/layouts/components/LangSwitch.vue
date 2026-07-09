<script setup>
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES } from '@/locales'

// 语言切换器（#22）：写 app store 的 locale（持久化），i18n / 组件库 locale / 标题
// 的联动统一由 App.vue 的 watch 接线，本组件不直接操作 i18n 实例。

const { t } = useI18n()
const appStore = useAppStore()

const options = computed(() => SUPPORTED_LOCALES.map(item => ({
  label: item.value === appStore.locale ? `${item.label} ✓` : item.label,
  key: item.value,
})))
</script>

<template>
  <NDropdown :options="options" trigger="click" @select="key => appStore.setLocale(key)">
    <NButton quaternary circle :title="t('layout.language')">
      <template #icon>
        <AppIcon icon="i-carbon-translate" />
      </template>
    </NButton>
  </NDropdown>
</template>
