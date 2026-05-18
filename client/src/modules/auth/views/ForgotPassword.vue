<template>
  <div class="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-6 py-12">
    <div class="w-full max-w-[420px]">
      <div class="flex items-center gap-2.5 mb-8">
        <div class="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0"
          style="background: linear-gradient(135deg, #465fff 0%, #3641f5 100%);">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span class="text-[15px] font-bold text-[#1C2434]">Starter SaaS</span>
      </div>

      <div class="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-8">
        <h1 class="text-[22px] font-bold text-[#0F172A] tracking-[-0.5px] mb-1.5">{{ t('auth.forgotTitle') }}</h1>
        <p class="text-[13px] text-[#64748B] mb-6">{{ t('auth.forgotDesc') }}</p>

        <form v-if="!sent" @submit.prevent="submit" class="space-y-5">
          <div>
            <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
              {{ t('auth.email') }}
            </label>
            <input v-model="email" type="email" required autocomplete="email"
              :placeholder="t('auth.emailPh')"
              class="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[14px] text-[#0F172A]
                     placeholder-[#CBD5E1] shadow-xs
                     focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition" />
          </div>

          <div v-if="error" class="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-xl">
            <span>{{ error }}</span>
          </div>

          <button type="submit" :disabled="loading"
            class="w-full py-3 px-6 rounded-xl text-[14px] font-semibold text-white
                   bg-primary-500 hover:bg-primary-600 active:bg-primary-700
                   disabled:opacity-60 disabled:cursor-not-allowed transition">
            {{ loading ? t('auth.sending') : t('auth.sendResetLink') }}
          </button>
        </form>

        <div v-else class="space-y-4">
          <div class="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] rounded-xl">
            {{ t('auth.forgotSent') }}
          </div>
          <button @click="sent = false" class="text-[13px] font-medium text-primary-600 hover:text-primary-700">
            {{ t('auth.sendAgain') }}
          </button>
        </div>

        <div class="mt-6 text-center">
          <RouterLink to="/login" class="text-[13px] font-medium text-primary-600 hover:text-primary-700">
            ← {{ t('auth.backToSignIn') }}
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '@/api'

const { t } = useI18n()
const email   = ref('')
const loading = ref(false)
const error   = ref('')
const sent    = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await api.post('/auth/forgot-password', { email: email.value })
    sent.value = true
  } catch (err) {
    error.value = err.response?.data?.message || t('auth.forgotFailed')
  } finally {
    loading.value = false
  }
}
</script>
