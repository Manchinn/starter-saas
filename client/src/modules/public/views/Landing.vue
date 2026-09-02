<template>
  <div class="min-h-screen flex flex-col bg-[#0A0F1E] relative overflow-hidden">

    <!-- ── Background layers ─────────────────────────────────────────────────── -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute inset-0"
        style="background: radial-gradient(ellipse 80% 60% at 110% -10%, #1b2d6b 0%, transparent 60%),
                           radial-gradient(ellipse 60% 50% at -10% 110%, #18106a 0%, transparent 55%),
                           #0A0F1E;" />
      <div class="absolute inset-0 opacity-[0.045]"
        style="background-image: linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
               linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px);
               background-size: 44px 44px;" />
      <div class="absolute top-[-100px] right-[-80px] w-[500px] h-[500px] blur-[120px]"
        style="background: radial-gradient(circle, rgba(70,95,255,0.2) 0%, transparent 70%)" />
      <div class="absolute bottom-[-80px] left-[-60px] w-[400px] h-[400px] blur-[100px]"
        style="background: radial-gradient(circle, rgba(70,95,255,0.12) 0%, transparent 70%)" />
    </div>

    <!-- ── Top nav ────────────────────────────────────────────────────────────── -->
    <nav class="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5">
      <BrandMark
        mark-class="w-8 h-8 shadow-[0_0_0_1px_rgba(70,95,255,0.4)]"
        name-class="text-[17px] font-bold text-white tracking-[-0.3px]"
      />
      <div class="flex items-center gap-4">
        <RouterLink to="/login"
          class="text-[13px] font-medium text-[#94A3B8] hover:text-white transition-colors">
          {{ t('landing.ctaLogin') }}
        </RouterLink>
        <RouterLink to="/register"
          class="px-4 py-2 text-[13px] font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-colors">
          {{ t('landing.ctaRegister') }}
        </RouterLink>
      </div>
    </nav>

    <!-- ── Hero ───────────────────────────────────────────────────────────────── -->
    <div class="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
      <div class="max-w-2xl">

        <!-- Badge -->
        <div class="inline-flex items-center gap-2 px-3 py-1.5 w-fit mb-7"
          style="background: rgba(70,95,255,0.12); border: 1px solid rgba(70,95,255,0.28);">
          <span class="w-1.5 h-1.5 bg-primary-400 animate-pulse flex-shrink-0" />
          <span class="text-[11px] font-semibold text-primary-300 tracking-widest uppercase">
            {{ t('landing.badge') }}
          </span>
        </div>

        <h1 class="text-[40px] sm:text-[52px] font-bold leading-[1.08] tracking-[-1.5px] text-[#F1F5F9]">
          {{ t('landing.heroTitle') }}
        </h1>
        <p class="mt-5 text-[15px] sm:text-[16px] leading-relaxed text-[#8FA0B8] max-w-[600px] mx-auto">
          {{ t('landing.heroSub') }}
        </p>

        <!-- CTAs -->
        <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            @click="loginWithLine"
            :disabled="lineLoading"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 text-[14px] font-semibold text-white
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
            <span>{{ lineLoading ? t('auth.lineSigningIn') : t('landing.ctaLine') }}</span>
          </button>

          <RouterLink to="/register"
            class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-[14px] font-semibold text-white
                   bg-primary-500 hover:bg-primary-600 transition-all duration-150">
            {{ t('landing.ctaRegister') }}
          </RouterLink>
        </div>

        <!-- LINE / fallback notice -->
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0">
          <div v-if="lineError"
            class="mt-6 inline-flex items-start gap-2.5 px-4 py-3 text-left bg-red-500/10 border border-red-400/30 text-red-300 text-[13px]">
            <svg class="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{{ lineError }}</span>
          </div>
        </transition>
      </div>
    </div>

    <!-- ── What you can try ───────────────────────────────────────────────────── -->
    <div class="relative z-10 px-6 sm:px-10 pb-14">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-[18px] font-bold text-[#F1F5F9] tracking-[-0.3px] mb-5">
          {{ t('landing.whatTitle') }}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            v-for="item in items" :key="item.title"
            class="px-5 py-5 text-left"
            style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
            <div class="flex items-center gap-2.5 mb-2">
              <span class="w-1.5 h-1.5 bg-primary-400 flex-shrink-0" />
              <h3 class="text-[14px] font-semibold text-white">{{ item.title }}</h3>
            </div>
            <p class="text-[13px] leading-relaxed text-[#8FA0B8]">{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Footer ─────────────────────────────────────────────────────────────── -->
    <footer class="relative z-10 px-6 sm:px-10 py-6 border-t border-white/[0.06]">
      <div class="max-w-5xl mx-auto flex items-center justify-between text-[12px] text-[#64748B]">
        <span>© {{ new Date().getFullYear() }} {{ brand.name }}</span>
        <span>{{ t('landing.footer') }}</span>
      </div>
    </footer>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import BrandMark from '@/components/BrandMark.vue'
import { brand } from '@/config/brand'
import { useLineAuth } from '@/composables/useLineAuth'

const { t } = useI18n()
const { lineLoading, lineError, loginWithLine } = useLineAuth()

const items = computed(() => [
  { title: t('landing.item1Title'), desc: t('landing.item1Desc') },
  { title: t('landing.item2Title'), desc: t('landing.item2Desc') },
  { title: t('landing.item3Title'), desc: t('landing.item3Desc') },
])
</script>
