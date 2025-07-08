<script setup>
import { settingApi } from '@/api/setting.js'

const message = useMessage()

const settings = ref({
  siteName: '',
  siteDescription: '',
  logo: '',
  copyright: '',
})

const loading = ref(false)

async function fetchSettings() {
  const res = await settingApi.getAll()
  res.data.forEach((s) => {
    if (Object.prototype.hasOwnProperty.call(settings.value, s.key)) {
      settings.value[s.key] = s.value
    }
  })
}

async function handleSave() {
  loading.value = true
  try {
    const data = Object.entries(settings.value).map(([key, value]) => ({
      key,
      value,
      group: 'system',
    }))
    await settingApi.save(data)
    message.success('保存成功')
  }
  catch (e) {
    message.error(e.message || '保存失败')
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchSettings)
</script>

<template>
  <div>
    <h1 text-2xl font-bold mb-6>
      系统设置
    </h1>

    <n-card style="max-width: 600px">
      <n-form label-placement="left" label-width="80">
        <n-form-item label="网站名称">
          <n-input v-model:value="settings.siteName" placeholder="请输入网站名称" />
        </n-form-item>
        <n-form-item label="网站描述">
          <n-input v-model:value="settings.siteDescription" placeholder="请输入网站描述" />
        </n-form-item>
        <n-form-item label="Logo URL">
          <n-input v-model:value="settings.logo" placeholder="请输入Logo地址" />
        </n-form-item>
        <n-form-item label="版权信息">
          <n-input v-model:value="settings.copyright" placeholder="请输入版权信息" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" :loading="loading" @click="handleSave">
            保存设置
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>
