<script setup>
const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div min-h-screen flex flex-col items-center justify-center bg-gray-100>
    <n-result status="404" title="404" description="页面不存在">
      <template #footer>
        <n-button type="primary" @click="goHome">
          返回首页
        </n-button>
      </template>
    </n-result>
  </div>
</template>
