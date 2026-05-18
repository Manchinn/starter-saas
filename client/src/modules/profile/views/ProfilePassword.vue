<template>
  <AppLayout>
    <div class="w-full space-y-5">
      <div>
        <h1 class="page-title">{{ t('profile.title') }}</h1>
        <p class="page-subtitle">{{ t('profile.subtitle') }}</p>
      </div>

      <ProfileTabs>
        <div class="space-y-1 mb-5">
          <h2 class="text-[15px] font-semibold text-[#1C2434]">{{ t('profile.passwordTitle') }}</h2>
          <p class="text-[13px] text-[#637381]">{{ t('profile.passwordDesc') }}</p>
        </div>

        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="label">{{ t('profile.currentPassword') }}</label>
            <input v-model="form.current" type="password" class="input" autocomplete="current-password"
                   :placeholder="t('profile.passwordPh')" />
          </div>
          <div>
            <label class="label">{{ t('profile.newPassword') }}</label>
            <input v-model="form.next" type="password" class="input" autocomplete="new-password"
                   :placeholder="t('profile.passwordPh')" />
            <p class="text-[12px] text-[#9BA7B0] mt-1.5">{{ t('profile.minChars') }}</p>
          </div>
          <div>
            <label class="label">{{ t('profile.confirmPassword') }}</label>
            <input v-model="form.confirm" type="password" class="input" autocomplete="new-password"
                   :placeholder="t('profile.passwordPh')" />
          </div>

          <div v-if="error" class="px-4 py-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg">
            {{ error }}
          </div>
          <div v-if="success" class="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg">
            {{ success }}
          </div>

          <div class="flex justify-end pt-2 border-t border-[#E2E8F0]">
            <button type="submit" :disabled="saving" class="btn-primary">
              {{ saving ? t('profile.changing') : t('profile.changePassword') }}
            </button>
          </div>
        </form>
      </ProfileTabs>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import ProfileTabs from './ProfileTabs.vue'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()

const form = ref({ current: '', next: '', confirm: '' })
const saving  = ref(false)
const error   = ref('')
const success = ref('')

async function submit() {
  error.value = ''
  success.value = ''
  if (form.value.next.length < 8) { error.value = t('profile.minChars'); return }
  if (form.value.next !== form.value.confirm) { error.value = t('profile.passwordMismatch'); return }
  saving.value = true
  try {
    await auth.changePassword(form.value.current, form.value.next)
    form.value = { current: '', next: '', confirm: '' }
    success.value = t('profile.passwordChanged')
  } catch (err) {
    error.value = err.response?.data?.message || t('profile.passwordFailed')
  } finally {
    saving.value = false
  }
}
</script>
