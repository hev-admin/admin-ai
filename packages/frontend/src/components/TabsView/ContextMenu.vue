<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
  tab: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:visible'])

const menuRef = ref(null)

// 调整位置，防止超出屏幕
const adjustedPosition = ref({ x: 0, y: 0 })

watch(
  () => [props.visible, props.position],
  () => {
    if (props.visible) {
      // 等待 DOM 更新后计算位置
      requestAnimationFrame(() => {
        const menu = menuRef.value
        if (!menu)
          return

        const rect = menu.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        let x = props.position.x
        let y = props.position.y

        // 防止右侧超出
        if (x + rect.width > viewportWidth) {
          x = viewportWidth - rect.width - 8
        }

        // 防止底部超出
        if (y + rect.height > viewportHeight) {
          y = viewportHeight - rect.height - 8
        }

        adjustedPosition.value = { x, y }
      })
    }
  },
  { immediate: true },
)

// 点击外部关闭
function handleClickOutside(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    close()
  }
}

function close() {
  emit('update:visible', false)
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('contextmenu', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('contextmenu', handleClickOutside)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="menu">
      <div
        v-if="visible"
        ref="menuRef"
        class="context-menu"
        fixed z-9999 py-1 rounded-lg shadow-lg border min-w-36
        bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700
        :style="{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
        }"
      >
        <slot :close="close" :tab="tab" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.context-menu {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.menu-enter-active,
.menu-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
