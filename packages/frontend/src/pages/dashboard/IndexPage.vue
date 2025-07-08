<script setup>
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()

const stats = ref([
  { title: '用户总数', value: 0, icon: 'i-lucide-users' },
  { title: '角色数量', value: 0, icon: 'i-lucide-shield' },
  { title: '菜单数量', value: 0, icon: 'i-lucide-menu' },
  { title: '今日访问', value: 0, icon: 'i-lucide-eye' },
])

onMounted(async () => {
  if (!authStore.user) {
    await authStore.getProfile()
  }
})
</script>

<template>
  <div>
    <h1 text-2xl font-bold mb-6>
      仪表盘
    </h1>
    <n-grid :cols="4" :x-gap="16" :y-gap="16" mb-6>
      <n-gi v-for="stat in stats" :key="stat.title">
        <n-card>
          <n-statistic :label="stat.title" :value="stat.value">
            <template #prefix>
              <span :class="stat.icon" text-xl text-primary />
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
    </n-grid>
    <n-card title="欢迎回来">
      <p text-gray-600>
        您好，{{ authStore.user?.nickname || authStore.user?.username }}！欢迎使用 Admin AI 管理系统。
      </p>
    </n-card>
  </div>
</template>
