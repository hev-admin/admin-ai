import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'
import App from './App.vue'
import { setupDirectives } from './directives'
import { i18n } from './locales'
import router from './router'
import { setupRouterGuards } from './router/guards'

// reset 用 tailwind-compat 版：完整版会把 button 背景重置为 transparent，
// [type='button'] 与 .n-button 同特异性、生效与否取决于样式表顺序（unocss#2127）。
// Naive UI 样式为运行时注入、恒晚于静态 CSS，此处只需保证 reset 先于 uno.css。
import '@unocss/reset/tailwind-compat.css'
import 'virtual:uno.css'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(i18n)
app.use(router)
setupRouterGuards(router)
setupDirectives(app)

app.mount('#app')
