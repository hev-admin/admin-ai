import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

// Provide auto-import globals for stores that rely on unplugin-auto-import
// (e.g., locale.js uses `defineStore`, `ref` without explicit imports)
globalThis.defineStore = defineStore
globalThis.ref = ref
globalThis.computed = computed
globalThis.watch = watch
