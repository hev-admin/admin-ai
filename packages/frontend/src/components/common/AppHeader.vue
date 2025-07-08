<script setup>
import { useAuthStore } from '@/stores/auth.js'
import { useLocaleStore } from '@/stores/locale.js'
import { useThemeStore } from '@/stores/theme.js'

defineProps({
  collapsed: Boolean,
})

const emit = defineEmits(['toggle'])

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const localeStore = useLocaleStore()

const dropdownOptions = computed(() => [
  { label: t('menu.profile'), key: 'profile' },
  { type: 'divider' },
  { label: t('auth.logout'), key: 'logout' },
])

async function handleDropdownSelect(key) {
  if (key === 'profile') {
    router.push('/profile')
  }
  else if (key === 'logout') {
    await authStore.logout()
    router.push('/login')
  }
}
</script>

<template>
  <header h-14 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-4>
    <div flex items-center gap-4>
      <n-button quaternary @click="emit('toggle')">
        <template #icon>
          <span class="i-lucide-menu" />
        </template>
      </n-button>
    </div>
    <n-space align="center">
      <!-- 语言切换按钮 -->
      <n-button quaternary @click="localeStore.toggleLocale">
        <template #icon>
          <span class="i-lucide-languages" />
        </template>
        {{ localeStore.locale === 'zh-CN' ? '中' : 'EN' }}
      </n-button>
      <!-- 主题切换按钮 -->
      <n-button quaternary @click="themeStore.toggleTheme">
        <template #icon>
          <span v-if="themeStore.theme === 'light'" class="i-lucide-moon" />
          <span v-else class="i-lucide-sun" />
        </template>
      </n-button>
      <n-dropdown :options="dropdownOptions" @select="handleDropdownSelect">
        <n-button quaternary>
          {{ authStore.user?.nickname || authStore.user?.username }}
        </n-button>
      </n-dropdown>
    </n-space>
  </header>
</template>
