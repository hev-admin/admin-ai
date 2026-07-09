<script setup>
import { toNaiveLocale } from '@/locales/naive'
import { useTheme } from '@/theme'
import { updateDocumentTitle } from '@/utils/title'
import { applyLocale } from '@/locales'

const route = useRoute()
const appStore = useAppStore()
const { isDark, naiveTheme, naiveThemeOverrides } = useTheme()

// 同步 UnoCSS 的 class 暗色模式（dark: 变体依赖 html.dark）
watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDark.value)
})

// 语言接线（#22）：app store 的 locale（持久化）→ i18n 实例 + 文档标题 + 组件库 locale
watch(() => appStore.locale, (value) => {
  applyLocale(value)
  updateDocumentTitle(route.meta)
}, { immediate: true })

const naiveLocale = computed(() => toNaiveLocale(appStore.locale))
</script>

<template>
  <!-- 全局 Provider 仅出现在应用入口一处（REQUIREMENTS §9.1）；locale 映射收敛在 locales/naive.js（§10） -->
  <NConfigProvider
    class="h-full"
    :theme="naiveTheme"
    :theme-overrides="naiveThemeOverrides"
    :locale="naiveLocale.locale"
    :date-locale="naiveLocale.dateLocale"
  >
    <NGlobalStyle />
    <RouterView />
  </NConfigProvider>
</template>
