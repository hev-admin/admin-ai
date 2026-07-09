<script setup>
import { useI18n } from 'vue-i18n'

// 动态路由模式下前端无法区分「无权限」与「不存在」（M2 规划决策点 2），
// 非 super 账号命中 catch-all 统一进本页。
const { t } = useI18n()
const router = useRouter()
</script>

<template>
  <div class="h-full min-h-100 flex-center">
    <NResult status="403" title="403" :description="t('exception.403.desc')">
      <template #footer>
        <NButton type="primary" @click="router.replace('/')">
          {{ t('common.backHome') }}
        </NButton>
      </template>
    </NResult>
  </div>
</template>
