<template>
  <div class="min-h-screen flex">

    <!-- ── Left branding panel ──────────────────────────────────────────────── -->
    <div class="hidden lg:flex lg:w-[540px] xl:w-[600px] flex-shrink-0 relative overflow-hidden
                bg-[#0A0F1E] flex-col">

      <!-- Background layers -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute inset-0"
          style="background: radial-gradient(ellipse 80% 60% at 110% -10%, #1b2d6b 0%, transparent 60%),
                             radial-gradient(ellipse 60% 50% at -10% 110%, #18106a 0%, transparent 55%),
                             #0A0F1E;" />
        <div class="absolute inset-0 opacity-[0.045]"
          style="background-image: linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px);
                 background-size: 44px 44px;" />
        <div class="absolute top-[-100px] right-[-80px] w-[500px] h-[500px] rounded-full blur-[120px]"
          style="background: radial-gradient(circle, rgba(70,95,255,0.2) 0%, transparent 70%)" />
        <div class="absolute bottom-[-80px] left-[-60px] w-[400px] h-[400px] rounded-full blur-[100px]"
          style="background: radial-gradient(circle, rgba(70,95,255,0.12) 0%, transparent 70%)" />
        <div class="absolute top-[45%] left-[55%] w-[260px] h-[260px] rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2"
          style="background: radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)" />
      </div>

      <!-- Content -->
      <div class="relative z-10 flex flex-col h-full px-12 py-10">

        <!-- Logo -->
        <div class="flex items-center gap-3 flex-shrink-0">
          <div class="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style="background: linear-gradient(135deg, #465fff 0%, #3641f5 100%);
                   box-shadow: 0 0 0 1px rgba(70,95,255,0.4), 0 4px 16px rgba(70,95,255,0.35);">
            <svg class="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span class="text-[17px] font-bold text-white tracking-[-0.3px]">Starter SaaS</span>
        </div>

        <!-- Center content -->
        <div class="flex-1 flex flex-col justify-center py-10">
          <div class="space-y-9 max-w-[360px]">

            <!-- Badge -->
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full w-fit"
              style="background: rgba(70,95,255,0.12); border: 1px solid rgba(70,95,255,0.28);">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span class="text-[11px] font-semibold text-primary-300 tracking-widest uppercase">
                {{ t('auth.setupTitle') }}
              </span>
            </div>

            <!-- Headline -->
            <div class="space-y-4">
              <h1 class="text-[36px] xl:text-[40px] font-bold leading-[1.12] tracking-[-1px] text-[#F1F5F9]">
                {{ t('auth.installSubtitle') }}
              </h1>
              <p class="text-[14px] leading-relaxed text-[#7D8FA8]">
                {{ t('auth.setupDesc') }}
              </p>
            </div>

            <!-- What gets set up -->
            <ul class="space-y-3">
              <li v-for="(item, i) in setupItems" :key="i" class="flex items-center gap-3">
                <div class="w-6 h-6 flex items-center justify-center flex-shrink-0"
                  style="background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3);">
                  <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="text-[13px] leading-snug text-[#94A3B8]">{{ item }}</span>
              </li>
            </ul>

            <!-- Step indicators -->
            <div class="rounded-2xl p-5 space-y-3"
              style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);">
              <p class="text-[11px] font-semibold text-[#475569] uppercase tracking-widest">Quick setup — 3 steps</p>
              <div v-for="(step, i) in steps" :key="i" class="flex items-center gap-3">
                <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                  :style="i === 0
                    ? 'background: linear-gradient(135deg,#465fff,#3641f5); color:#fff; box-shadow:0 2px 8px rgba(70,95,255,0.4)'
                    : 'background: rgba(255,255,255,0.06); color:#475569; border:1px solid rgba(255,255,255,0.08)'">
                  {{ i + 1 }}
                </div>
                <span class="text-[13px]" :class="i === 0 ? 'text-[#E2E8F0] font-medium' : 'text-[#475569]'">
                  {{ step }}
                </span>
              </div>
            </div>

          </div>
        </div>

        <!-- Footer note -->
        <div class="flex-shrink-0 flex items-center gap-2 text-[11px] text-[#334155]">
          <svg class="w-3.5 h-3.5 text-[#475569]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>This setup runs only once. Revisiting this page after completion will be blocked.</span>
        </div>

      </div>
    </div>

    <!-- ── Right form panel ─────────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col bg-[#F8FAFC]">

      <!-- Top bar -->
      <div class="flex items-center justify-between px-8 pt-6 pb-2 flex-shrink-0">
        <div class="flex items-center gap-2.5 lg:hidden">
          <div class="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0"
            style="background: linear-gradient(135deg, #465fff 0%, #3641f5 100%);">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span class="text-[15px] font-bold text-[#1C2434]">Starter SaaS</span>
        </div>
        <div class="hidden lg:block" />
        <RouterLink to="/login"
          class="text-[13px] font-medium text-[#64748B] hover:text-primary-600 transition-colors">
          {{ t('auth.signInLink') }} →
        </RouterLink>
      </div>

      <!-- Form area -->
      <div class="flex-1 flex items-center justify-center px-6 py-4">
        <div class="w-full max-w-[420px]">

          <!-- Heading -->
          <div class="mb-8">
            <h2 class="text-[26px] font-bold text-[#0F172A] tracking-[-0.5px] mb-1.5">
              Create your workspace
            </h2>
            <p class="text-[14px] text-[#64748B]">{{ t('auth.setupDesc') }}</p>
          </div>

          <form @submit.prevent="handleInstall" class="space-y-5">

            <!-- Organization -->
            <div>
              <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                {{ t('auth.orgName') }}
              </label>
              <div class="relative">
                <div class="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  :class="form.name ? 'text-primary-500' : 'text-[#94A3B8]'">
                  <svg class="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  autocomplete="organization"
                  :placeholder="t('auth.orgNamePh')"
                  :class="[
                    'w-full pl-10 pr-4 py-3 bg-white border text-[14px] text-[#0F172A]',
                    'placeholder-[#CBD5E1] shadow-xs',
                    'focus:outline-none focus:ring-2 focus:border-primary-400 hover:border-[#C7D2E0] transition-all duration-150',
                    errorOf('name')
                      ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500 focus:ring-red-200/60'
                      : 'border-[#E2E8F0] focus:ring-primary-500/20',
                  ]"
                />
              </div>
              <FieldError name="name" :errors="fieldErrors" />
            </div>

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
                  :placeholder="t('auth.adminEmailPh')"
                  :class="[
                    'w-full pl-10 pr-4 py-3 bg-white border text-[14px] text-[#0F172A]',
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
              <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                {{ t('auth.password') }}
              </label>
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
                  autocomplete="new-password"
                  :placeholder="t('auth.passwordMinPh')"
                  :class="[
                    'w-full pl-10 pr-11 py-3 bg-white border text-[14px] text-[#0F172A]',
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

            <!-- Confirm Password -->
            <div>
              <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                {{ t('auth.confirmPassword') }}
              </label>
              <div class="relative">
                <div class="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  :class="form.confirmPassword ? 'text-primary-500' : 'text-[#94A3B8]'">
                  <svg class="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <input
                  v-model="form.confirmPassword"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  autocomplete="new-password"
                  :placeholder="t('auth.repeatPh')"
                  :class="[
                    'w-full pl-10 pr-4 py-3 bg-white border text-[14px] text-[#0F172A]',
                    'placeholder-[#CBD5E1] shadow-xs',
                    'focus:outline-none focus:ring-2 focus:border-primary-400 hover:border-[#C7D2E0] transition-all duration-150',
                    confirmMismatch
                      ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500 focus:ring-red-200/60'
                      : 'border-[#E2E8F0] focus:ring-primary-500/20',
                  ]"
                />
              </div>
              <FieldError :error="confirmMismatch ? t('auth.passwordsNoMatch') : ''" />
            </div>

            <!-- Setup options -->
            <div class="space-y-2.5">
              <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider">Setup options</p>

              <label class="flex items-start gap-3 cursor-pointer select-none rounded-xl border border-[#E2E8F0] bg-white px-4 py-3.5 hover:border-primary-300 hover:bg-primary-50/30 transition-all duration-150"
                :class="seedSequences ? 'border-primary-300 bg-primary-50/30' : ''">
                <div class="relative flex-shrink-0 mt-0.5">
                  <input v-model="seedSequences" type="checkbox" class="sr-only" />
                  <div class="w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-all duration-150"
                    :class="seedSequences ? 'bg-primary-500 border-primary-500' : 'bg-white border-[#CBD5E1]'">
                    <svg v-if="seedSequences" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p class="text-[13px] font-semibold text-[#374151] leading-snug">Seed sequence numbers</p>
                  <p class="text-[12px] text-[#94A3B8] mt-0.5 leading-relaxed">
                    Set up default auto-number sequences for orders, customers, products, employees, and more.
                  </p>
                </div>
              </label>

              <label class="flex items-start gap-3 cursor-pointer select-none rounded-xl border border-[#E2E8F0] bg-white px-4 py-3.5 hover:border-primary-300 hover:bg-primary-50/30 transition-all duration-150"
                :class="seedDemo ? 'border-primary-300 bg-primary-50/30' : ''">
                <div class="relative flex-shrink-0 mt-0.5">
                  <input v-model="seedDemo" type="checkbox" class="sr-only" />
                  <div class="w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-all duration-150"
                    :class="seedDemo ? 'bg-primary-500 border-primary-500' : 'bg-white border-[#CBD5E1]'">
                    <svg v-if="seedDemo" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p class="text-[13px] font-semibold text-[#374151] leading-snug">Seed demo data</p>
                  <p class="text-[12px] text-[#94A3B8] mt-0.5 leading-relaxed">
                    Populate your workspace with sample products, customers, vendors, employees, and master data.
                  </p>
                </div>
              </label>
            </div>

            <!-- Error -->
            <transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0">
              <div v-if="errors.length"
                class="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-xl">
                <svg class="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div class="space-y-0.5">
                  <p v-for="e in errors" :key="e">{{ e }}</p>
                </div>
              </div>
            </transition>

            <!-- Submit -->
            <button type="submit" :disabled="loading"
              class="w-full py-3 px-6 text-[14px] font-semibold text-white
                     bg-primary-500 hover:bg-primary-600 active:bg-primary-700
                     disabled:opacity-60 disabled:cursor-not-allowed
                     shadow-[0_4px_16px_rgba(70,95,255,0.3)] hover:shadow-[0_6px_24px_rgba(70,95,255,0.4)]
                     transition-all duration-150 flex items-center justify-center gap-2.5">
              <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>{{ loading ? loadingPhase : t('auth.createAdmin') }}</span>
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

        </div>
      </div>

      <!-- Bottom bar -->
      <div class="flex-shrink-0 px-8 py-4 flex items-center justify-between border-t border-[#F1F5F9]">
        <p class="text-[11px] text-[#CBD5E1]">© {{ new Date().getFullYear() }} Starter SaaS</p>
        <div class="flex items-center gap-3 text-[11px] text-[#CBD5E1]">
          <a href="#" class="hover:text-[#64748B] transition-colors">Privacy</a>
          <span>·</span>
          <a href="#" class="hover:text-[#64748B] transition-colors">Terms</a>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { resetInstallCache } from '@/router'
import api from '@/api'
import { useFieldErrors } from '@/composables/useFieldErrors'
import FieldError from '@/components/form/FieldError.vue'

const auth   = useAuthStore()
const router = useRouter()
const { t }  = useI18n()

const form         = ref({ name: '', email: '', password: '', confirmPassword: '' })
const loading      = ref(false)
const loadingPhase = ref('')
const errors       = ref([])
const showPassword = ref(false)
const seedSequences = ref(false)
const seedDemo      = ref(false)
const confirmMismatch = ref(false)
const { fieldErrors, setFromError, reset: resetFieldErrors, errorOf } = useFieldErrors()

const setupItems = computed(() => [
  'Administrator account with full access',
  'Default roles & permission sets',
  'System master data & lookup values',
  'Module configurations & settings',
])

const steps = computed(() => [
  'Fill in your organization & admin credentials',
  'System initializes roles, permissions & master data',
  'You\'re redirected to your dashboard',
])

async function handleInstall() {
  errors.value = []
  confirmMismatch.value = false
  resetFieldErrors()
  if (form.value.password !== form.value.confirmPassword) {
    confirmMismatch.value = true
    return
  }
  loading.value = true
  loadingPhase.value = t('auth.installing')
  try {
    await auth.install(form.value.name, form.value.email, form.value.password)
    if (seedSequences.value) {
      loadingPhase.value = 'Seeding sequence numbers…'
      await api.post('/erp/settings/demo-data/seed-sequences')
    }
    if (seedDemo.value) {
      loadingPhase.value = 'Seeding demo data…'
      await api.post('/erp/settings/demo-data/seed')
    }
    resetInstallCache()
    router.push('/dashboard')
  } catch (err) {
    const had = setFromError(err)
    if (!had) errors.value = [err.response?.data?.message || t('auth.installationFailed')]
  } finally {
    loading.value = false
    loadingPhase.value = ''
  }
}
</script>
