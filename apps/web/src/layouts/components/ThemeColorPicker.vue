<script setup>
import { useI18n } from 'vue-i18n'
import { themePresets } from '@/theme'

// 主题色选择器（#21）：预设色板（theme/tokens.js），选中即全局生效并持久化

const { t } = useI18n()
const appStore = useAppStore()
</script>

<template>
  <NPopover trigger="click">
    <template #trigger>
      <NButton quaternary circle :title="t('layout.theme.color')">
        <template #icon>
          <AppIcon icon="i-carbon-color-palette" />
        </template>
      </NButton>
    </template>
    <div>
      <div class="mb-2 text-sm font-medium">
        {{ t('layout.theme.color') }}
      </div>
      <div class="flex gap-2">
        <NTooltip v-for="preset in themePresets" :key="preset.key">
          <template #trigger>
            <button
              type="button"
              class="h-6 w-6 flex-center cursor-pointer border-none rounded-full outline-none"
              :style="{ backgroundColor: preset.color }"
              @click="appStore.setPrimaryColor(preset.color)"
            >
              <AppIcon
                v-if="appStore.primaryColor === preset.color"
                icon="i-carbon-checkmark"
                :size="14"
                class="text-white"
              />
            </button>
          </template>
          {{ t(`layout.themeColor.${preset.key}`) }}
        </NTooltip>
      </div>
    </div>
  </NPopover>
</template>
