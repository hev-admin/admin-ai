<script setup>
// 统一图标组件（REQUIREMENTS §9.1）：基于 UnoCSS preset-icons / Iconify，
// 不依赖任何 UI 库的图标包；icon 传图标类名（如 i-carbon-dashboard）。
// 注意：来自数据库等运行时数据的图标名需加入 uno.config.js 的 safelist。
const props = defineProps({
  icon: { type: String, required: true },
  size: { type: [Number, String], default: 18 },
})

const style = computed(() => ({
  fontSize: typeof props.size === 'number' ? `${props.size}px` : props.size,
}))
</script>

<template>
  <span class="inline-block align-middle" :class="icon" :style="style" />
</template>
