<template>
  <AuthLayout :subtitle="t('auth.loginSubtitle')">
    <form @submit.prevent="handleLogin" class="space-y-4">

      <div>
        <label class="label">{{ t('auth.email') }}</label>
        <input
          v-model="form.email"
          type="email"
          required
          autocomplete="email"
          class="input-lg"
          :placeholder="t('auth.emailPh')"
        />
      </div>

      <div>
        <label class="label">{{ t('auth.password') }}</label>
        <input
          v-model="form.password"
          type="password"
          required
          autocomplete="current-password"
          class="input-lg"
          :placeholder="t('auth.passwordPh')"
        />
      </div>

      <div class="flex items-center justify-between pt-1">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input
            v-model="remember"
            type="checkbox"
            class="w-4 h-4 rounded-md border-[#E2E8F0] text-primary-500 focus:ring-primary-500"
          />
          <span class="text-[13px] text-[#637381]">{{ t('auth.rememberMe') }}</span>
        </label>
      </div>

      <div v-if="error"
           class="flex items-start gap-2.5 px-4 py-3 bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-sm rounded-xl">
        <svg class="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
        </svg>
        {{ error }}
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="btn-primary w-full py-3 text-[15px] mt-2"
      >
        {{ loading ? t('auth.signingIn') : t('auth.signIn') }}
      </button>

      <p class="text-center text-[13px] text-[#637381]">
        {{ t('auth.noAccount') }}
        <RouterLink to="/register" class="font-semibold text-primary-500 hover:text-primary-600">{{ t('auth.register') }}</RouterLink>
      </p>

    </form>
  </AuthLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const router = useRouter()
const { t }  = useI18n()

const form     = ref({ email: '', password: '' })
const remember = ref(true)
const loading  = ref(false)
const error    = ref('')

onMounted(() => {
  const saved = localStorage.getItem('rememberedEmail')
  if (saved) form.value.email = saved
})

async function handleLogin() {
  error.value   = ''
  loading.value = true
  try {
    await auth.login(form.value.email, form.value.password, remember.value)
    if (remember.value) {
      localStorage.setItem('rememberedEmail', form.value.email)
    } else {
      localStorage.removeItem('rememberedEmail')
    }
    router.push(auth.user?.defaultPage || '/dashboard')
  } catch (err) {
    error.value = err.response?.data?.message || t('auth.loginFailed')
  } finally {
    loading.value = false
  }
}
</script>
