<template>
  <div v-if="show"
    class="mb-4 flex flex-wrap items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-sm">
    <svg class="w-5 h-5 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.34 16a2 2 0 001.73 3z" />
    </svg>
    <span class="flex-1">{{ t('auth.unverifiedBanner') }}</span>
    <button @click="resend" :disabled="loading || sent"
      class="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition">
      {{ sent ? t('auth.resentOk') : (loading ? t('auth.sending') : t('auth.resendVerification')) }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const { t } = useI18n()
const auth = useAuthStore()

const loading = ref(false)
const sent    = ref(false)

const show = computed(() =>
  auth.isAuthenticated && auth.user && !auth.user.emailVerifiedAt
)

async function resend() {
  loading.value = true
  try {
    await api.post('/auth/resend-verification', { email: auth.user.email })
    sent.value = true
  } catch {
    // The endpoint always returns success-shaped to avoid leaking accounts.
    // Show "sent" optimistically; rate-limit errors are still visible via toast/console.
    sent.value = true
  } finally {
    loading.value = false
  }
}
</script>
