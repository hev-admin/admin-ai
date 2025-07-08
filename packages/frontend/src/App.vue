<script setup>
import { darkTheme, dateEnUS, dateZhCN, enUS, zhCN } from 'naive-ui'
import { useLocaleStore } from '@/stores/locale.js'
import { useThemeStore } from '@/stores/theme.js'

const themeStore = useThemeStore()
const localeStore = useLocaleStore()

const naiveTheme = computed(() => themeStore.theme === 'dark' ? darkTheme : null)
const naiveLocale = computed(() => localeStore.locale === 'zh-CN' ? zhCN : enUS)
const naiveDateLocale = computed(() => localeStore.locale === 'zh-CN' ? dateZhCN : dateEnUS)
</script>

<template>
  <n-config-provider :theme="naiveTheme" :locale="naiveLocale" :date-locale="naiveDateLocale" h-full>
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <n-loading-bar-provider>
            <RouterView />
          </n-loading-bar-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>
