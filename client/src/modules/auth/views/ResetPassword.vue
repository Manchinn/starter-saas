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
        <h1 class="text-[22px] font-bold text-[#0F172A] tracking-[-0.5px] mb-1.5">{{ t('auth.resetTitle') }}</h1>
        <p class="text-[13px] text-[#64748B] mb-6">{{ t('auth.resetDesc') }}</p>

        <form v-if="!done" @submit.prevent="submit" class="space-y-5">
          <div>
            <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
              {{ t('auth.newPassword') }}
            </label>
            <input v-model="newPassword" type="password" required minlength="8" autocomplete="new-password"
              :placeholder="t('auth.passwordMinPh')"
              class="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[14px] text-[#0F172A]
                     placeholder-[#CBD5E1] shadow-xs
                     focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition" />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
              {{ t('auth.confirmPassword') }}
            </label>
            <input v-model="confirm" type="password" required minlength="8" autocomplete="new-password"
              :placeholder="t('auth.repeatPh')"
              class="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[14px] text-[#0F172A]
                     placeholder-[#CBD5E1] shadow-xs
                     focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition" />
          </div>

          <div v-if="error" class="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-xl">
            <span>{{ error }}</span>
          </div>

          <button type="submit" :disabled="loading || !canSubmit"
            class="w-full py-3 px-6 rounded-xl text-[14px] font-semibold text-white
                   bg-primary-500 hover:bg-primary-600 active:bg-primary-700
                   disabled:opacity-60 disabled:cursor-not-allowed transition">
            {{ loading ? t('auth.resetting') : t('auth.resetPasswordBtn') }}
          </button>
        </form>

        <div v-else class="space-y-4">
          <div class="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] rounded-xl">
            {{ t('auth.resetDone') }}
          </div>
          <RouterLink to="/login"
            class="block text-center py-3 px-6 rounded-xl text-[14px] font-semibold text-white bg-primary-500 hover:bg-primary-600 transition">
            {{ t('auth.signIn') }}
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '@/api'

const { t } = useI18n()
const route = useRoute()
const newPassword = ref('')
const confirm     = ref('')
const loading     = ref(false)
const error       = ref('')
const done        = ref(false)

const canSubmit = computed(() => newPassword.value.length >= 8 && newPassword.value === confirm.value)

async function submit() {
  error.value = ''
  if (newPassword.value !== confirm.value) {
    error.value = t('auth.passwordsNoMatch')
    return
  }
  loading.value = true
  try {
    await api.post('/auth/reset-password', { token: route.params.token, newPassword: newPassword.value })
    done.value = true
  } catch (err) {
    error.value = err.response?.data?.message || t('auth.resetFailed')
  } finally {
    loading.value = false
  }
}
</script>
