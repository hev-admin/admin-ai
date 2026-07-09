<script setup>
import { useI18n } from 'vue-i18n'

// 动态路由的组件路径尚未实现时的占位视图（见 stores/permission.js 的回退逻辑）
const { t } = useI18n()
const route = useRoute()
</script>

<template>
  <div class="h-full min-h-100 flex-center">
    <NResult status="info" :title="t('exception.building.title')" :description="t('exception.building.desc', { path: route.path })">
      <template #icon>
        <AppIcon icon="i-carbon-tools" :size="56" class="text-gray-300" />
      </template>
    </NResult>
  </div>
</template>
