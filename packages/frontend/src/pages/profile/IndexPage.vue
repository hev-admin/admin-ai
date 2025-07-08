<script setup>
import { authApi } from '@/api/auth.js'
import { uploadApi } from '@/api/upload.js'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()
const message = useMessage()
const fileInput = ref(null)
const avatarPreview = ref('')

const profileForm = ref({
  nickname: '',
  phone: '',
  avatar: '',
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const profileLoading = ref(false)
const passwordLoading = ref(false)

async function loadProfile() {
  const user = authStore.user
  if (user) {
    profileForm.value.nickname = user.nickname || ''
    profileForm.value.phone = user.phone || ''
    profileForm.value.avatar = user.avatar || ''
    avatarPreview.value = user.avatar || ''
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleAvatarChange(event) {
  const file = event.target.files?.[0]
  if (!file)
    return

  // Preview
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.value = e.target.result
  }
  reader.readAsDataURL(file)

  // Upload
  try {
    const res = await uploadApi.uploadAvatar(file)
    profileForm.value.avatar = res.data.url
    message.success('头像上传成功')
  }
  catch (e) {
    message.error(e.message || '上传失败')
    avatarPreview.value = profileForm.value.avatar
  }
}

async function handleUpdateProfile() {
  profileLoading.value = true
  try {
    await authApi.updateProfile(profileForm.value)
    await authStore.fetchUser()
    message.success('个人信息更新成功')
  }
  catch (e) {
    message.error(e.message || '更新失败')
  }
  finally {
    profileLoading.value = false
  }
}

async function handleChangePassword() {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    message.warning('两次密码输入不一致')
    return
  }
  if (passwordForm.value.newPassword.length < 6) {
    message.warning('新密码至少6位')
    return
  }

  passwordLoading.value = true
  try {
    await authApi.updatePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword,
    })
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    message.success('密码修改成功')
  }
  catch (e) {
    message.error(e.message || '修改失败')
  }
  finally {
    passwordLoading.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <div>
    <h1 text-2xl font-bold mb-6>
      个人中心
    </h1>

    <div grid grid-cols-1 lg:grid-cols-2 gap-6>
      <!-- 个人信息 -->
      <n-card title="个人信息">
        <n-form label-placement="left" label-width="80">
          <!-- 头像上传 -->
          <n-form-item label="头像">
            <n-space align="center">
              <n-avatar
                :src="avatarPreview"
                :size="80"
                round
                style="cursor: pointer"
                @click="triggerFileInput"
              />
              <div>
                <n-button size="small" @click="triggerFileInput">
                  更换头像
                </n-button>
                <p text-xs text-gray-500 mt-1>
                  支持 JPG、PNG、GIF、WEBP
                </p>
              </div>
              <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                hidden
                @change="handleAvatarChange"
              >
            </n-space>
          </n-form-item>

          <n-form-item label="用户名">
            <n-input :value="authStore.user?.username" disabled />
          </n-form-item>
          <n-form-item label="邮箱">
            <n-input :value="authStore.user?.email" disabled />
          </n-form-item>
          <n-form-item label="昵称">
            <n-input v-model:value="profileForm.nickname" placeholder="请输入昵称" />
          </n-form-item>
          <n-form-item label="手机号">
            <n-input v-model:value="profileForm.phone" placeholder="请输入手机号" />
          </n-form-item>
          <n-form-item>
            <n-button type="primary" :loading="profileLoading" @click="handleUpdateProfile">
              保存修改
            </n-button>
          </n-form-item>
        </n-form>
      </n-card>

      <!-- 修改密码 -->
      <n-card title="修改密码">
        <n-form label-placement="left" label-width="80">
          <n-form-item label="原密码">
            <n-input
              v-model:value="passwordForm.oldPassword"
              type="password"
              placeholder="请输入原密码"
              show-password-on="click"
            />
          </n-form-item>
          <n-form-item label="新密码">
            <n-input
              v-model:value="passwordForm.newPassword"
              type="password"
              placeholder="请输入新密码"
              show-password-on="click"
            />
          </n-form-item>
          <n-form-item label="确认密码">
            <n-input
              v-model:value="passwordForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              show-password-on="click"
            />
          </n-form-item>
          <n-form-item>
            <n-button type="primary" :loading="passwordLoading" @click="handleChangePassword">
              修改密码
            </n-button>
          </n-form-item>
        </n-form>
      </n-card>
    </div>
  </div>
</template>
