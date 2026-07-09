<script setup>
import { useI18n } from 'vue-i18n'
import LangSwitch from '@/layouts/components/LangSwitch.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { message } = useFeedback()

const formRef = ref(null)
const loading = ref(false)
const model = reactive({
  username: 'super',
  password: '123456',
  remember: true,
})

const rules = computed(() => ({
  username: { required: true, message: t('login.usernameRequired'), trigger: 'blur' },
  password: { required: true, message: t('login.passwordRequired'), trigger: 'blur' },
}))

/** 种子演示账号（apps/server/seed/data.js，密码统一 123456） */
const seedAccounts = [
  { username: 'super', labelKey: 'login.demo.super' },
  { username: 'admin', labelKey: 'login.demo.admin' },
  { username: 'user', labelKey: 'login.demo.user' },
]

function fillAccount(username) {
  model.username = username
  model.password = '123456'
}

async function handleLogin() {
  try {
    await formRef.value?.validate()
  }
  catch {
    return
  }
  loading.value = true
  try {
    await userStore.login(model)
    message.success(t('login.success'))
    router.replace(route.query.redirect || '/')
  }
  catch {
    // 错误提示已由请求层统一弹出
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative h-screen flex-center bg-gradient-to-br from-blue-500 to-indigo-700">
    <div class="absolute right-4 top-4">
      <LangSwitch />
    </div>

    <NCard class="w-90 shadow-xl" :bordered="false">
      <div class="mb-6 text-center">
        <div class="text-2xl font-bold">
          admin-ai
        </div>
        <div class="mt-1 text-sm text-gray-400">
          {{ t('login.subtitle') }}
        </div>
      </div>

      <NForm ref="formRef" :model="model" :rules="rules" :show-label="false" size="large">
        <NFormItem path="username">
          <NInput v-model:value="model.username" :placeholder="t('login.username')" @keydown.enter="handleLogin">
            <template #prefix>
              <AppIcon icon="i-carbon-user" :size="16" class="text-gray-400" />
            </template>
          </NInput>
        </NFormItem>
        <NFormItem path="password">
          <NInput
            v-model:value="model.password"
            type="password"
            show-password-on="click"
            :placeholder="t('login.password')"
            @keydown.enter="handleLogin"
          >
            <template #prefix>
              <AppIcon icon="i-carbon-password" :size="16" class="text-gray-400" />
            </template>
          </NInput>
        </NFormItem>

        <div class="mb-4 flex items-center justify-between">
          <NCheckbox v-model:checked="model.remember">
            {{ t('login.remember') }}
          </NCheckbox>
        </div>

        <NButton type="primary" block size="large" :loading="loading" @click="handleLogin">
          {{ t('login.submit') }}
        </NButton>
      </NForm>

      <NDivider class="!text-xs !text-gray-400">
        {{ t('login.demoTitle') }}
      </NDivider>
      <div class="flex flex-wrap justify-center gap-2">
        <NTag
          v-for="account in seedAccounts"
          :key="account.username"
          size="small"
          round
          class="cursor-pointer"
          :type="model.username === account.username ? 'primary' : 'default'"
          @click="fillAccount(account.username)"
        >
          {{ t(account.labelKey) }}
        </NTag>
      </div>
    </NCard>
  </div>
</template>
