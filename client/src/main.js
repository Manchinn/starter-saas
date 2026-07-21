import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n/index.js'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { vCan } from '@/directives/can'
import DateInput from '@/components/DateInput.vue'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)

// Restore session BEFORE the router starts navigating.
// This ensures auth.user is populated on the first beforeEach call,
// preventing a spurious redirect to /login on page refresh.
const auth = useAuthStore()
if (auth.accessToken) {
  try {
    await auth.fetchMe()
  } catch {
    auth.clearSession()
  }
}

// Skip ERP settings for locked (billing-only) tenants — blocked in that mode.
const settings = useSettingsStore()
if (auth.accessToken && !auth.locked) await settings.load()

app.use(router)
app.directive('can', vCan)
app.component('DateInput', DateInput)
app.mount('#app')
