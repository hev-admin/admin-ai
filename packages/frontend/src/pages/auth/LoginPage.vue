<script setup>
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const authStore = useAuthStore()

const form = ref({
  username: '',
  password: '',
})
const loading = ref(false)

async function handleSubmit() {
  if (!form.value.username || !form.value.password) {
    message.warning('请填写用户名和密码')
    return
  }

  loading.value = true

  try {
    await authStore.login(form.value)
    message.success('登录成功')
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  }
  catch (e) {
    message.error(e.message || '登录失败')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div min-h-screen flex items-center justify-center bg-gray-100>
    <n-card title="Admin AI" style="width: 400px">
      <n-form @submit.prevent="handleSubmit">
        <n-form-item label="用户名">
          <n-input v-model:value="form.username" placeholder="请输入用户名" />
        </n-form-item>
        <n-form-item label="密码">
          <n-input
            v-model:value="form.password"
            type="password"
            placeholder="请输入密码"
            show-password-on="click"
          />
        </n-form-item>
        <n-button type="primary" block :loading="loading" attr-type="submit">
          登录
        </n-button>
      </n-form>
      <div text-center mt-4>
        <span text-gray-500>没有账号？</span>
        <RouterLink to="/register">
          <n-button text type="primary">
            立即注册
          </n-button>
        </RouterLink>
      </div>
    </n-card>
  </div>
</template>
