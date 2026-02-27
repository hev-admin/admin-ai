<script setup>
import { settingApi } from '@/api/setting.js'

const message = useMessage()

const settings = ref([])
const loading = ref(false)
const saving = ref(false)

async function fetchSettings() {
  loading.value = true
  try {
    const res = await settingApi.getAll()
    if (res.data.length) {
      settings.value = res.data.map(s => ({ ...s }))
    }
    else {
      // Default settings if none exist
      settings.value = [
        { key: 'siteName', value: '', group: 'system' },
        { key: 'siteDescription', value: '', group: 'system' },
        { key: 'logo', value: '', group: 'system' },
        { key: 'copyright', value: '', group: 'system' },
      ]
    }
  }
  finally {
    loading.value = false
  }
}

// 设置项的中文标签
const labelMap = {
  siteName: '网站名称',
  siteDescription: '网站描述',
  logo: 'Logo URL',
  copyright: '版权信息',
}

function getLabel(key) {
  return labelMap[key] || key
}

async function handleSave() {
  saving.value = true
  try {
    await settingApi.save(settings.value.map(s => ({
      key: s.key,
      value: s.value,
      group: s.group || 'system',
    })))
    message.success('保存成功')
  }
  catch (e) {
    message.error(e.message || '保存失败')
  }
  finally {
    saving.value = false
  }
}

onMounted(fetchSettings)
</script>

<template>
  <div>
    <h1 text-2xl font-bold mb-6>
      系统设置
    </h1>

    <n-spin :show="loading">
      <n-card style="max-width: 600px">
        <n-form label-placement="left" label-width="80">
          <n-form-item v-for="item in settings" :key="item.key" :label="getLabel(item.key)">
            <n-input v-model:value="item.value" :placeholder="`请输入${getLabel(item.key)}`" />
          </n-form-item>
          <n-form-item>
            <n-button type="primary" :loading="saving" @click="handleSave">
              保存设置
            </n-button>
          </n-form-item>
        </n-form>
        <n-empty v-if="!loading && settings.length === 0" description="暂无设置项" />
      </n-card>
    </n-spin>
  </div>
</template>
