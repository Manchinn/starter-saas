<template>
  <div class="min-h-screen flex bg-white">

    <!-- ── Brand panel ─────────────────────────────────────────────────────── -->
    <div class="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-shrink-0 flex-col
                bg-[#1C2434] relative overflow-hidden">

      <!-- Subtle grid pattern -->
      <div class="absolute inset-0 opacity-[0.04]"
           style="background-image: linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px); background-size: 40px 40px;" />

      <!-- Gradient overlays -->
      <div class="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#1C2434] to-transparent pointer-events-none" />
      <div class="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div class="absolute bottom-1/4 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-[60px] pointer-events-none" />

      <!-- Content -->
      <div class="relative z-10 flex flex-col h-full p-10">

        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <svg class="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span class="text-[17px] font-bold text-white tracking-tight">Starter SaaS</span>
        </div>

        <div class="flex-1" />

        <!-- Tagline block -->
        <div class="space-y-6">
          <div class="space-y-3">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/15 border border-primary-400/20">
              <span class="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse"></span>
              <span class="text-xs font-medium text-primary-300">Production-ready starter kit</span>
            </div>
            <h1 class="text-[32px] xl:text-[36px] font-bold text-white leading-tight tracking-tight">
              {{ t('auth.brandTagline') }}
            </h1>
            <p class="text-[#8D9BB4] text-[14px] leading-relaxed max-w-[300px]">
              {{ t('auth.brandDesc') }}
            </p>
          </div>

          <!-- Feature pills -->
          <div class="flex flex-wrap gap-2">
            <span v-for="f in features" :key="f"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                     bg-white/[0.06] border border-white/[0.10] text-[12px] font-medium text-[#DEE4EE]">
              <span class="w-1 h-1 rounded-full bg-primary-400"></span>
              {{ f }}
            </span>
          </div>

          <!-- Stats row -->
          <div class="flex items-center gap-5 pt-4 border-t border-white/[0.08]">
            <div>
              <p class="text-[17px] font-bold text-white tabular">100%</p>
              <p class="text-[12px] text-[#637381] mt-0.5">{{ t('auth.openSource') }}</p>
            </div>
            <div class="w-px h-7 bg-white/[0.10]" />
            <div>
              <p class="text-[17px] font-bold text-white">MIT</p>
              <p class="text-[12px] text-[#637381] mt-0.5">{{ t('auth.license') }}</p>
            </div>
            <div class="w-px h-7 bg-white/[0.10]" />
            <div>
              <p class="text-[17px] font-bold text-white">Vue 3</p>
              <p class="text-[12px] text-[#637381] mt-0.5">{{ t('auth.frontend') }}</p>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Form panel ──────────────────────────────────────────────────────────── -->
    <div class="flex-1 flex items-center justify-center px-6 py-12 bg-[#F1F5F9]">
      <div class="w-full max-w-[400px]">

        <!-- Mobile logo -->
        <div class="flex items-center gap-2.5 lg:hidden mb-8">
          <div class="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span class="text-[17px] font-bold text-[#1C2434] tracking-tight">Starter SaaS</span>
        </div>

        <!-- Form card -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card-lg p-8">
          <div class="mb-7">
            <h2 class="text-[22px] font-bold text-[#1C2434] tracking-tight">{{ subtitle }}</h2>
            <p class="mt-1 text-[13px] text-[#637381]">{{ t('auth.continueDetails') }}</p>
          </div>
          <slot />
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({ subtitle: { type: String, default: '' } })

const { t } = useI18n()

const features = [
  'Multi-tenant', 'RBAC', 'Module system', 'Vue 3 + Vite', 'ExpressJS',
]
</script>
