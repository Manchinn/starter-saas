<template>
  <div class="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-6 py-12">
    <div class="w-full max-w-[420px]">
      <div class="flex items-center gap-2.5 mb-8 justify-center">
        <div class="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0"
          style="background: linear-gradient(135deg, #465fff 0%, #3641f5 100%);">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span class="text-[15px] font-bold text-[#1C2434]">Starter SaaS</span>
      </div>

      <div class="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-8 text-center">
        <div v-if="state === 'pending'" class="py-6">
          <svg class="w-8 h-8 mx-auto text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p class="mt-4 text-[14px] text-[#64748B]">{{ t('auth.verifying') }}</p>
        </div>

        <div v-else-if="state === 'success'" class="py-4">
          <div class="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 class="text-[20px] font-bold text-[#0F172A] mb-1.5">{{ t('auth.verifiedTitle') }}</h1>
          <p class="text-[13px] text-[#64748B] mb-6">{{ t('auth.verifiedDesc') }}</p>
          <RouterLink :to="auth.isAuthenticated ? '/dashboard' : '/login'"
            class="inline-block py-2.5 px-6 text-[14px] font-semibold text-white bg-primary-500 hover:bg-primary-600 transition">
            {{ auth.isAuthenticated ? t('nav.dashboard') : t('auth.signIn') }}
          </RouterLink>
        </div>

        <div v-else class="py-4">
          <div class="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 class="text-[20px] font-bold text-[#0F172A] mb-1.5">{{ t('auth.verifyFailedTitle') }}</h1>
          <p class="text-[13px] text-[#64748B] mb-6">{{ error || t('auth.verifyFailedDesc') }}</p>
          <RouterLink to="/login"
            class="inline-block py-2.5 px-6 text-[14px] font-semibold text-white bg-primary-500 hover:bg-primary-600 transition">
            {{ t('auth.backToSignIn') }}
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const { t } = useI18n()
const route = useRoute()
const auth  = useAuthStore()
const state = ref('pending') // pending | success | failed
const error = ref('')

onMounted(async () => {
  try {
    await api.get(`/auth/verify-email/${route.params.token}`)
    state.value = 'success'
    if (auth.isAuthenticated) await auth.fetchMe()
  } catch (err) {
    error.value = err.response?.data?.message || ''
    state.value = 'failed'
  }
})
</script>
