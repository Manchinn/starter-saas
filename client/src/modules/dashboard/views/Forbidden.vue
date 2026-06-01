<template>
  <div class="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-[#F7F9FC]">
    <div class="select-none mb-0">
      <p class="text-[160px] font-black leading-none text-gradient tracking-tighter">403</p>
    </div>
    <div class="w-16 h-1 bg-gradient-to-r from-primary-400 to-violet-400 mb-6 -mt-2" />
    <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('forbidden.heading') }}</h1>
    <p class="text-[#637381] mt-2 text-sm max-w-xs leading-relaxed">{{ t('forbidden.desc') }}</p>
    <RouterLink to="/" class="btn-primary mt-8 gap-2">
      <HomeIcon class="w-4 h-4" />
      {{ t('forbidden.goHome') }}
    </RouterLink>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { HomeIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
</script>
