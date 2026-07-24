import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n/index.js'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { vCan } from '@/directives/can'
import DateInput from '@/components/DateInput.vue'
import { brand } from '@/config/brand'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)

// Restore session BEFORE the router starts navigating, so auth.user is
// populated on the first beforeEach call and a page refresh doesn't bounce to
// /login. bootstrap() silently mints an access token from the httpOnly refresh
// cookie (no-op when there's no valid cookie).
const auth = useAuthStore()
await auth.bootstrap()

// Skip the ERP settings fetch for locked (billing-only) tenants — it's blocked
// in that mode and not needed on the billing pages.
const settings = useSettingsStore()
if (auth.isAuthenticated && !auth.locked) await settings.load()

app.use(router)
router.afterEach((to) => {
  document.title = to.meta?.title ? `${to.meta.title} · ${brand.name}` : brand.name
})
app.directive('can', vCan)
app.component('DateInput', DateInput)
app.mount('#app')
