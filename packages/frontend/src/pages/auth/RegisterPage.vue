<script setup>
import { authApi } from '@/api/auth.js'

const router = useRouter()
const message = useMessage()

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})
const loading = ref(false)

async function handleSubmit() {
  if (!form.value.username || !form.value.email || !form.value.password) {
    message.warning('请填写所有必填项')
    return
  }
  if (form.value.password !== form.value.confirmPassword) {
    message.warning('两次密码输入不一致')
    return
  }

  loading.value = true

  try {
    await authApi.register({
      username: form.value.username,
      email: form.value.email,
      password: form.value.password,
    })
    message.success('注册成功，请登录')
    router.push('/login')
  }
  catch (e) {
    message.error(e.message || '注册失败')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div min-h-screen flex items-center justify-center bg-gray-100>
    <n-card title="注册账号" style="width: 400px">
      <n-form @submit.prevent="handleSubmit">
        <n-form-item label="用户名">
          <n-input v-model:value="form.username" placeholder="请输入用户名" />
        </n-form-item>
        <n-form-item label="邮箱">
          <n-input v-model:value="form.email" placeholder="请输入邮箱" />
        </n-form-item>
        <n-form-item label="密码">
          <n-input
            v-model:value="form.password"
            type="password"
            placeholder="请输入密码"
            show-password-on="click"
          />
        </n-form-item>
        <n-form-item label="确认密码">
          <n-input
            v-model:value="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password-on="click"
          />
        </n-form-item>
        <n-button type="primary" block :loading="loading" attr-type="submit">
          注册
        </n-button>
      </n-form>
      <div text-center mt-4>
        <span text-gray-500>已有账号？</span>
        <RouterLink to="/login">
          <n-button text type="primary">
            立即登录
          </n-button>
        </RouterLink>
      </div>
    </n-card>
  </div>
</template>
