<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
</script>

<template>
  <div class="h-full min-h-100 flex-center">
    <NResult status="404" title="404" :description="t('exception.404.desc')">
      <template #footer>
        <NButton type="primary" @click="router.replace('/')">
          {{ t('common.backHome') }}
        </NButton>
      </template>
    </NResult>
  </div>
</template>
