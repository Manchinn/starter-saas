import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'
import { vCan } from '@/directives/can'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

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

app.use(router)
app.directive('can', vCan)
app.mount('#app')
