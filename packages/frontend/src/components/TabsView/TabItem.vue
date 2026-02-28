<script setup>
defineProps({
  tab: {
    type: Object,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click', 'close', 'contextmenu'])
</script>

<template>
  <div
    class="tab-item group"
    :class="{ active }"
    relative flex items-center gap-1.5 px-3 py-1.5 cursor-pointer
    transition-all duration-200 whitespace-nowrap
    @click="$emit('click')"
    @contextmenu="$emit('contextmenu', $event)"
  >
    <!-- 左侧圆角装饰（Chrome 风格） -->
    <div
      v-if="active"
      class="corner-left"
      absolute bottom-0 left--2 w-2 h-2
    />

    <!-- 右侧圆角装饰（Chrome 风格） -->
    <div
      v-if="active"
      class="corner-right"
      absolute bottom-0 right--2 w-2 h-2
    />

    <!-- 图标 -->
    <span :class="tab.icon" text-sm flex-shrink-0 />

    <!-- 标题 -->
    <span text-sm max-w-32 truncate>{{ tab.title }}</span>

    <!-- 关闭按钮（固定 tab 不显示） -->
    <button
      v-if="!tab.affix"
      class="close-btn"
      ml-1 w-4 h-4 rounded-full flex-shrink-0
      flex items-center justify-center
      opacity-0 group-hover:opacity-100
      transition-opacity duration-150
      @click.stop="$emit('close')"
    >
      <span class="i-lucide-x" text-xs />
    </button>

    <!-- 固定图标 -->
    <span
      v-if="tab.affix"
      class="i-lucide-pin"
      ml-1 text-xs opacity-50 flex-shrink-0
    />
  </div>
</template>

<style>
/* 暗色模式变量覆盖 — 必须 unscoped 才能匹配 html.dark 祖先选择器 */
html.dark .tab-item {
  --tab-bg: #374151;
  --tab-bg-hover: #4b5563;
  --tab-bg-active: #111827;
  --tab-color: #9ca3af;
  --tab-color-hover: #d1d5db;
  --tab-color-active: #d1d5db;
  --tab-corner-active: #111827;
  --close-hover-bg: #4b5563;
}
</style>

<style scoped>
.tab-item {
  --tab-bg: #e5e7eb;
  --tab-bg-hover: #f3f4f6;
  --tab-bg-active: #ffffff;
  --tab-color: #6b7280;
  --tab-color-hover: #374151;
  --tab-color-active: #374151;
  --tab-corner-active: #ffffff;
  --close-hover-bg: #e5e7eb;

  background-color: var(--tab-bg);
  color: var(--tab-color);
  border-radius: 8px 8px 0 0;
  margin: 0 -4px;
  min-width: 80px;
  height: 32px;
  z-index: 1;
}

.tab-item:hover {
  background-color: var(--tab-bg-hover);
  color: var(--tab-color-hover);
  z-index: 3;
}

.tab-item.active {
  background-color: var(--tab-bg-active);
  color: var(--tab-color-active);
  z-index: 5;
}

/* Chrome 风格圆角 */
.corner-left {
  background: radial-gradient(circle at 0 0, transparent 8px, var(--tab-corner-active) 8px);
}

.corner-right {
  background: radial-gradient(circle at 100% 0, transparent 8px, var(--tab-corner-active) 8px);
}

.close-btn:hover {
  background-color: var(--close-hover-bg);
}
</style>
