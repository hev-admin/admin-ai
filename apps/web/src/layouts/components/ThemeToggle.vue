<script setup>
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/AppIcon.vue'

// 主题模式切换（#21）：亮 / 暗 / 跟随系统三态下拉，触发按钮图标反映当前选择

const MODES = ['light', 'dark', 'auto']
const MODE_ICONS = {
  light: 'i-carbon-sun',
  dark: 'i-carbon-moon',
  auto: 'i-carbon-laptop',
}

const { t } = useI18n()
const appStore = useAppStore()

const options = computed(() => MODES.map(mode => ({
  key: mode,
  label: mode === appStore.themeMode ? `${t(`layout.theme.${mode}`)} ✓` : t(`layout.theme.${mode}`),
  icon: () => h(AppIcon, { icon: MODE_ICONS[mode] }),
})))
</script>

<template>
  <NDropdown :options="options" trigger="click" @select="mode => appStore.setThemeMode(mode)">
    <NButton quaternary circle :title="t(`layout.theme.${appStore.themeMode}`)">
      <template #icon>
        <AppIcon :icon="MODE_ICONS[appStore.themeMode]" />
      </template>
    </NButton>
  </NDropdown>
</template>
