<template>
  <AuthLayout
    :subtitle="t('auth.welcomeBack')"
    :note="t('auth.loginSubtitle')"
    :alt-text="t('auth.noAccount')"
    alt-to="/register"
    :alt-label="t('auth.register')"
  >

    <!-- Continue with LINE -->
    <div class="mb-5">
      <button
        type="button"
        @click="handleLine"
        :disabled="lineLoading"
        class="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl text-[14px] font-semibold text-white
               bg-[#06C755] hover:bg-[#05B04B] active:bg-[#05A046]
               disabled:opacity-60 disabled:cursor-not-allowed
               shadow-[0_4px_16px_rgba(6,199,85,0.35)] transition-all duration-150">
        <svg v-if="lineLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18 2.5H6C3.24 2.5 1 4.74 1 7.5v6.53c0 2.76 2.24 5 5 5h5.5l5.5 3.5v-3.5H18c2.76 0 5-2.24 5-5V7.5c0-2.76-2.24-5-5-5z" />
        </svg>
        <span>{{ lineLoading ? t('auth.lineSigningIn') : t('auth.lineContinue') }}</span>
      </button>

      <!-- LINE / fallback notice (e.g. LINE not configured → 501) -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="lineError"
          class="mt-3 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-[13px]">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ lineError }}</span>
        </div>
      </transition>
    </div>

    <!-- Divider -->
    <div class="relative flex items-center mb-6">
      <span class="absolute inset-0 flex items-center">
        <span class="w-full border-t border-[#E2E8F0]"></span>
      </span>
      <span class="relative pr-2 bg-[#F8FAFC] text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
        {{ t('auth.orEmail') }}
      </span>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleLogin" class="space-y-5">

      <!-- Email -->
      <div>
        <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
          {{ t('auth.email') }}
        </label>
        <div class="relative">
          <div class="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            :class="form.email ? 'text-primary-500' : 'text-[#94A3B8]'">
            <svg class="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <input
            v-model="form.email"
            type="email"
            required
            autocomplete="email"
            :placeholder="t('auth.emailPh')"
            :class="[
              'w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/80 border text-[14px] text-[#0F172A]',
              'placeholder-[#CBD5E1] shadow-xs',
              'focus:outline-none focus:ring-2 focus:border-primary-400 hover:border-[#C7D2E0] transition-all duration-150',
              errorOf('email')
                ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500 focus:ring-red-200/60'
                : 'border-[#E2E8F0] focus:ring-primary-500/20',
            ]"
          />
        </div>
        <FieldError name="email" :errors="fieldErrors" />
      </div>

      <!-- Password -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider">
            {{ t('auth.password') }}
          </label>
          <RouterLink to="/forgot-password" tabindex="-1"
            class="text-[12px] font-medium text-primary-600 hover:text-primary-700 transition-colors">
            {{ t('auth.forgotPassword') }}
          </RouterLink>
        </div>
        <div class="relative">
          <div class="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            :class="form.password ? 'text-primary-500' : 'text-[#94A3B8]'">
            <svg class="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            required
            autocomplete="current-password"
            :placeholder="t('auth.passwordPh')"
            :class="[
              'w-full pl-10 pr-11 py-3.5 rounded-xl bg-white/80 border text-[14px] text-[#0F172A]',
              'placeholder-[#CBD5E1] shadow-xs',
              'focus:outline-none focus:ring-2 focus:border-primary-400 hover:border-[#C7D2E0] transition-all duration-150',
              errorOf('password')
                ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500 focus:ring-red-200/60'
                : 'border-[#E2E8F0] focus:ring-primary-500/20',
            ]"
          />
          <button type="button" @click="showPassword = !showPassword" tabindex="-1"
            class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors p-0.5">
            <svg v-if="showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
        <FieldError name="password" :errors="fieldErrors" />
      </div>

      <!-- Remember me -->
      <label class="flex items-center gap-2.5 cursor-pointer select-none w-fit group">
        <div class="relative flex-shrink-0">
          <input v-model="remember" type="checkbox" class="sr-only peer" />
          <div class="w-4 h-4 border-[1.5px] border-[#CBD5E1] bg-white
                      peer-checked:bg-primary-500 peer-checked:border-primary-500
                      flex items-center justify-center transition-all duration-150">
            <svg v-if="remember" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <span class="text-[13px] text-[#64748B] group-hover:text-[#374151] transition-colors">
          {{ t('auth.rememberMe') }}
        </span>
      </label>

      <!-- Error banner -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="error"
          class="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-[13px]">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ error }}</span>
        </div>
      </transition>

      <!-- Submit -->
      <button type="submit" :disabled="loading"
        class="w-full py-3.5 px-6 rounded-2xl text-[14px] font-semibold text-white
               bg-primary-500 hover:bg-primary-600 active:bg-primary-700
               disabled:opacity-60 disabled:cursor-not-allowed
               shadow-[0_4px_16px_rgba(70,95,255,0.3)] hover:shadow-[0_6px_24px_rgba(70,95,255,0.4)]
               transition-all duration-150 flex items-center justify-center gap-2.5">
        <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>{{ loading ? t('auth.signingIn') : t('auth.signIn') }}</span>
      </button>

    </form>

    <!-- Trust line -->
    <div class="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-[#94A3B8]">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      <span>{{ t('auth.secureNote') }}</span>
    </div>

  </AuthLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useFieldErrors } from '@/composables/useFieldErrors'
import { useLineAuth } from '@/composables/useLineAuth'
import FieldError from '@/components/form/FieldError.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

const auth   = useAuthStore()
const router = useRouter()
const { t }  = useI18n()
const { lineLoading, lineError, loginWithLine } = useLineAuth()

const form         = ref({ email: '', password: '' })
const remember     = ref(true)
const loading      = ref(false)
const error        = ref('')
const showPassword = ref(false)
const { fieldErrors, setFromError, reset: resetErrors, errorOf } = useFieldErrors()

onMounted(() => {
  const saved = localStorage.getItem('rememberedEmail')
  if (saved) form.value.email = saved
  // Surface a one-time notice left by a forced logout (e.g. inactive subscription).
  const notice = sessionStorage.getItem('authNotice')
  if (notice) {
    error.value = notice
    sessionStorage.removeItem('authNotice')
  }
})

async function handleLogin() {
  error.value = ''
  resetErrors()
  loading.value = true
  try {
    await auth.login(form.value.email, form.value.password, remember.value)
    if (remember.value) {
      localStorage.setItem('rememberedEmail', form.value.email)
    } else {
      localStorage.removeItem('rememberedEmail')
    }
    router.push(auth.homeRoute())
  } catch (err) {
    const hadFieldErrors = setFromError(err)
    if (!hadFieldErrors) {
      error.value = err.response?.data?.message || t('auth.loginFailed')
    }
  } finally {
    loading.value = false
  }
}

// LINE login — keeps the email form as a fallback on any failure (incl. 501).
function handleLine() {
  loginWithLine()
}
</script>
