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

<style scoped>
.tab-item {
  background-color: #e5e7eb;
  color: #6b7280;
  border-radius: 8px 8px 0 0;
  margin: 0 1px;
  min-width: 80px;
  height: 32px;
  z-index: 1;
}

.tab-item:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.tab-item.active {
  background-color: #ffffff;
  color: #111827;
  z-index: 2;
}

/* Chrome 风格圆角 */
.corner-left,
.corner-right {
  background: transparent;
}

.corner-left::before,
.corner-right::before {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #e5e7eb;
}

.corner-left::after,
.corner-right::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #ffffff;
}

.corner-left::before {
  bottom: 0;
  right: 0;
}

.corner-left::after {
  bottom: 0;
  right: 0;
  border-radius: 0 0 8px 0;
}

.corner-right::before {
  bottom: 0;
  left: 0;
}

.corner-right::after {
  bottom: 0;
  left: 0;
  border-radius: 0 0 0 8px;
}

.close-btn:hover {
  background-color: #e5e7eb;
}

/* 暗色模式 */
:deep(.dark) .tab-item {
  background-color: #374151;
  color: #9ca3af;
}

:deep(.dark) .tab-item:hover {
  background-color: #4b5563;
  color: #d1d5db;
}

:deep(.dark) .tab-item.active {
  background-color: #1f2937;
  color: #f3f4f6;
}

:deep(.dark) .corner-left::before,
:deep(.dark) .corner-right::before {
  background-color: #374151;
}

:deep(.dark) .corner-left::after,
:deep(.dark) .corner-right::after {
  background-color: #1f2937;
}

:deep(.dark) .close-btn:hover {
  background-color: #4b5563;
}
</style>
