import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { setupPermissionDirective } from './directives/permission.js'
import i18n from './i18n/index.js'
import router from './router/index.js'
import 'virtual:uno.css'
import './assets/styles/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

setupPermissionDirective(app)

app.mount('#app')
