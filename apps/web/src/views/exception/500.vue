<script setup>
import { useI18n } from 'vue-i18n'

// 服务异常页（#23）：独立于主布局（服务不可用时布局数据也不可靠），在守卫白名单内
const { t } = useI18n()
const router = useRouter()

function reload() {
  window.location.reload()
}
</script>

<template>
  <div class="h-full min-h-100 flex-center">
    <NResult status="500" title="500" :description="t('exception.500.desc')">
      <template #footer>
        <div class="flex justify-center gap-2">
          <NButton @click="reload()">
            {{ t('exception.reload') }}
          </NButton>
          <NButton type="primary" @click="router.replace('/')">
            {{ t('common.backHome') }}
          </NButton>
        </div>
      </template>
    </NResult>
  </div>
</template>
