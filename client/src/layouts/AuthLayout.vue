<template>
  <div class="min-h-screen flex bg-[#07111f] relative overflow-hidden">

    <!-- ── Left branding panel (Landing-style) ──────────────────────────────── -->
    <div class="hidden lg:flex lg:w-[540px] xl:w-[600px] flex-shrink-0 relative overflow-hidden
                bg-[#07111f] flex-col border-r border-white/10">

      <!-- Background layers -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute inset-0"
          style="background: radial-gradient(ellipse 80% 60% at 110% -10%, #1b2d6b 0%, transparent 60%),
                             radial-gradient(ellipse 60% 50% at -10% 110%, #18106a 0%, transparent 55%),
                             #07111f;" />
        <!-- Grid -->
        <div class="absolute inset-0 opacity-[0.045]"
          style="background-image: linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px);
                 background-size: 44px 44px;" />
        <!-- Orbs -->
        <div class="absolute top-[-100px] right-[-80px] w-[500px] h-[500px] blur-[120px]"
          style="background: radial-gradient(circle, rgba(70,95,255,0.2) 0%, transparent 70%)" />
        <div class="absolute bottom-[-80px] left-[-60px] w-[400px] h-[400px] blur-[100px]"
          style="background: radial-gradient(circle, rgba(70,95,255,0.12) 0%, transparent 70%)" />
        <div class="absolute top-[45%] left-[55%] w-[260px] h-[260px] blur-[80px] -translate-x-1/2 -translate-y-1/2"
          style="background: radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)" />
      </div>

      <!-- Content -->
      <div class="relative z-10 flex flex-col h-full px-12 py-10">

        <!-- Logo -->
        <BrandMark
          class="flex-shrink-0"
          mark-class="w-9 h-9 shadow-[0_0_0_1px_rgba(70,95,255,0.4),0_4px_16px_rgba(70,95,255,0.35)]"
          name-class="text-[17px] font-bold text-white tracking-[-0.3px]"
        />

        <!-- Center content -->
        <div class="flex-1 flex flex-col justify-center py-10">
          <div class="space-y-9 max-w-[360px]">

            <!-- Badge -->
            <div class="inline-flex items-center gap-2 px-3 py-1.5 w-fit"
              style="background: rgba(70,95,255,0.12); border: 1px solid rgba(70,95,255,0.28);">
              <span class="w-1.5 h-1.5 bg-primary-400 animate-pulse flex-shrink-0" />
              <span class="text-[11px] font-semibold text-primary-300 tracking-widest uppercase">
                {{ t('auth.brandBadge') }}
              </span>
            </div>

            <!-- Headline -->
            <div class="space-y-4">
              <h1 class="text-[36px] xl:text-[40px] font-bold leading-[1.12] tracking-[-1px] text-[#F1F5F9]">
                {{ t('auth.brandTagline') }}
              </h1>
              <p class="text-[14px] leading-relaxed text-[#7D8FA8]">
                {{ t('auth.brandDesc') }}
              </p>
            </div>

            <!-- Stats row -->
            <div class="grid grid-cols-3 gap-3">
              <div v-for="stat in stats" :key="stat.label"
                class="px-3 py-3"
                style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);">
                <div class="text-[19px] font-bold text-white tracking-tight">{{ stat.value }}</div>
                <div class="text-[11px] mt-0.5 text-[#475569]">{{ stat.label }}</div>
              </div>
            </div>

            <!-- Feature list -->
            <ul class="space-y-3">
              <li v-for="(feat, i) in features" :key="i" class="flex items-start gap-3">
                <div class="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5"
                  style="background: rgba(70,95,255,0.15); border: 1px solid rgba(70,95,255,0.28);">
                  <svg class="w-2.5 h-2.5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="text-[13px] leading-snug text-[#94A3B8]">{{ feat }}</span>
              </li>
            </ul>

          </div>
        </div>

      </div>
    </div>

    <!-- ── Right form panel ─────────────────────────────────────────────────── -->
    <div class="relative flex-1 flex flex-col bg-[#f4f7fb]">

      <!-- Top bar -->
      <div class="flex items-center justify-between px-8 pt-6 pb-2 flex-shrink-0 relative z-10">
        <!-- Mobile logo (hidden on large) -->
        <BrandMark
          class="lg:hidden"
          gap-class="gap-2.5"
          mark-class="w-8 h-8"
          name-class="text-[15px] font-bold text-[#1C2434]"
        />
        <div class="hidden lg:block" />
        <p v-if="altText" class="text-[13px] text-[#64748B]">
          {{ altText }}
          <RouterLink :to="altTo"
            class="font-semibold text-primary-600 hover:text-primary-700 transition-colors ml-1">
            {{ altLabel }}
          </RouterLink>
        </p>
      </div>

      <!-- Form area -->
      <div class="flex-1 flex items-center justify-center px-6 py-10 relative">
        <div class="absolute w-[520px] h-[520px] rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
        <div class="w-full max-w-[420px] relative rounded-[28px] border border-white/80 bg-white/75 backdrop-blur-xl shadow-[0_24px_80px_rgba(15,23,42,0.12)] px-7 py-8 sm:px-9">

          <!-- Heading -->
          <div class="mb-8">
            <h2 class="text-[26px] font-bold text-[#0F172A] tracking-[-0.5px] mb-1.5">
              {{ subtitle }}
            </h2>
            <p class="text-[14px] text-[#64748B]">{{ noteLine }}</p>
          </div>

          <slot />

        </div>
      </div>

      <!-- Bottom bar -->
      <div class="flex-shrink-0 px-8 py-4 flex items-center justify-between border-t border-[#F1F5F9]">
        <p class="text-[11px] text-[#CBD5E1]">© {{ new Date().getFullYear() }} {{ brand.name }}</p>
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
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BrandMark from '@/components/BrandMark.vue'
import { brand } from '@/config/brand'

const props = defineProps({
  // Card heading (h2) — e.g. "Welcome back" / "Create your account"
  subtitle: { type: String, default: '' },
  // Card heading note (p) — defaults to the generic "enter your details" line
  note: { type: String, default: '' },
  // Optional top-right switch link (e.g. "No account? → Register")
  altText: { type: String, default: '' },
  altTo: { type: String, default: '/register' },
  altLabel: { type: String, default: '' },
})

const { t } = useI18n()

const noteLine = computed(() => props.note || t('auth.continueDetails'))

const features = computed(() => [
  t('auth.feature1'),
  t('auth.feature2'),
  t('auth.feature3'),
  t('auth.feature4'),
])

const stats = computed(() => [
  { value: t('auth.stat1Value'), label: t('auth.stat1Label') },
  { value: t('auth.stat2Value'), label: t('auth.stat2Label') },
  { value: t('auth.stat3Value'), label: t('auth.stat3Label') },
])
</script>
