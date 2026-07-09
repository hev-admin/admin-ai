<script setup>
import { useI18n } from 'vue-i18n'
import { changePasswordApi, updateProfileApi } from '@/api/auth'

// 个人中心（REQUIREMENTS §5.3 / #24）：基本资料修改（保存后重拉用户信息，顶栏即时同步）
// + 修改密码（旧密码校验 + 新密码二次确认，成功后强制重登，M3 决策点 7）。

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const { message } = useFeedback()

// ---- 基本资料 ----
const profileFormRef = ref(null)
const profileSaving = ref(false)
const profileModel = reactive({
  nickname: userStore.userInfo?.nickname ?? '',
  email: userStore.userInfo?.email ?? '',
  avatar: userStore.userInfo?.avatar ?? '',
})

const profileRules = computed(() => ({
  nickname: { required: true, message: t('profile.nicknameRequired'), trigger: 'blur' },
}))

async function handleProfileSave() {
  try {
    await profileFormRef.value?.validate()
  }
  catch {
    return
  }
  profileSaving.value = true
  try {
    await updateProfileApi({ ...profileModel })
    await userStore.fetchUserInfo()
    message.success(t('profile.saved'))
  }
  catch {
    // 错误提示已由请求层统一弹出
  }
  finally {
    profileSaving.value = false
  }
}

// ---- 修改密码 ----
const pwdFormRef = ref(null)
const pwdSaving = ref(false)
const pwdModel = reactive({ oldPassword: '', password: '', confirmPassword: '' })

const pwdRules = computed(() => ({
  oldPassword: { required: true, message: t('profile.oldPwdRequired'), trigger: 'blur' },
  password: [
    { required: true, message: t('profile.newPwdRequired'), trigger: 'blur' },
    { validator: (_, value) => !value || value.length >= 6, message: t('profile.pwdHint'), trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: t('profile.confirmPwdRequired'), trigger: 'blur' },
    { validator: (_, value) => !value || value === pwdModel.password, message: t('profile.pwdMismatch'), trigger: ['blur', 'input'] },
  ],
}))

async function handlePasswordSave() {
  try {
    await pwdFormRef.value?.validate()
  }
  catch {
    return
  }
  pwdSaving.value = true
  try {
    await changePasswordApi({ oldPassword: pwdModel.oldPassword, password: pwdModel.password })
    message.success(t('profile.pwdChanged'))
    // 强制重登（M3 决策点 7）：旧 token 服务端仍有效至自然过期，本地登录态即时清空
    userStore.reset()
    router.replace('/login')
  }
  catch {
    // 错误提示已由请求层统一弹出（如旧密码不正确）
  }
  finally {
    pwdSaving.value = false
  }
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <NCard :title="t('profile.basicInfo')" :bordered="false">
      <div class="mb-6 flex items-center gap-4">
        <NAvatar v-if="profileModel.avatar" :src="profileModel.avatar" round :size="64" />
        <NAvatar v-else round :size="64">
          <span class="text-xl">{{ (userStore.userInfo?.nickname || '?').slice(0, 1) }}</span>
        </NAvatar>
        <div>
          <div class="text-base font-medium">
            {{ userStore.userInfo?.username }}
          </div>
          <div class="mt-1 flex gap-1">
            <NTag v-for="role in userStore.roles" :key="role" size="small" round type="primary">
              {{ role }}
            </NTag>
          </div>
        </div>
      </div>

      <NForm
        ref="profileFormRef"
        :model="profileModel"
        :rules="profileRules"
        label-placement="left"
        :label-width="90"
      >
        <NFormItem :label="t('profile.username')">
          <NInput :value="userStore.userInfo?.username" disabled />
        </NFormItem>
        <NFormItem :label="t('profile.nickname')" path="nickname">
          <NInput v-model:value="profileModel.nickname" :placeholder="t('common.pleaseInput')" />
        </NFormItem>
        <NFormItem :label="t('profile.email')" path="email">
          <NInput v-model:value="profileModel.email" :placeholder="t('common.optional')" />
        </NFormItem>
        <NFormItem :label="t('profile.avatar')" path="avatar">
          <NInput v-model:value="profileModel.avatar" :placeholder="t('profile.avatarHint')" />
        </NFormItem>
        <div class="flex justify-end">
          <NButton type="primary" :loading="profileSaving" @click="handleProfileSave">
            {{ t('profile.save') }}
          </NButton>
        </div>
      </NForm>
    </NCard>

    <NCard :title="t('profile.changePwd')" :bordered="false" class="self-start">
      <NForm
        ref="pwdFormRef"
        :model="pwdModel"
        :rules="pwdRules"
        label-placement="left"
        :label-width="110"
      >
        <NFormItem :label="t('profile.oldPassword')" path="oldPassword">
          <NInput
            v-model:value="pwdModel.oldPassword"
            type="password"
            show-password-on="click"
            :placeholder="t('common.pleaseInput')"
          />
        </NFormItem>
        <NFormItem :label="t('profile.newPassword')" path="password">
          <NInput
            v-model:value="pwdModel.password"
            type="password"
            show-password-on="click"
            :placeholder="t('profile.pwdHint')"
          />
        </NFormItem>
        <NFormItem :label="t('profile.confirmPassword')" path="confirmPassword">
          <NInput
            v-model:value="pwdModel.confirmPassword"
            type="password"
            show-password-on="click"
            :placeholder="t('profile.confirmPwdRequired')"
          />
        </NFormItem>
        <div class="flex justify-end">
          <NButton type="primary" :loading="pwdSaving" @click="handlePasswordSave">
            {{ t('profile.changePwd') }}
          </NButton>
        </div>
      </NForm>
    </NCard>
  </div>
</template>
