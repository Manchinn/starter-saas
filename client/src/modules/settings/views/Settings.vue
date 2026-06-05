<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Page header -->
      <div>
        <h1 class="page-title">{{ t('settings.title') }}</h1>
        <p class="page-subtitle">{{ t('settings.subtitle') }}</p>
      </div>

      <!-- Tab bar -->
      <div class="border-b border-[#E2E8F0]">
        <nav class="flex gap-1 -mb-px" role="tablist">
          <button
            v-for="tab in tabs" :key="tab.id"
            type="button"
            role="tab"
            :aria-selected="active === tab.id"
            @click="active = tab.id"
            :class="[
              'inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors',
              active === tab.id
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-[#637381] hover:text-[#1C2434] hover:border-[#CBD5E1]',
            ]"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ t(tab.labelKey) }}
          </button>
        </nav>
      </div>

      <!-- Active tab -->
      <component :is="current.component" />

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, markRaw } from 'vue'
import { useI18n } from 'vue-i18n'
import { EnvelopeIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import EmailSettings from './EmailSettings.vue'

const { t } = useI18n()

// Data-driven so new settings tabs are a one-line addition.
const tabs = [
  { id: 'email', labelKey: 'settings.tabs.email', icon: EnvelopeIcon, component: markRaw(EmailSettings) },
]

const active = ref('email')
const current = computed(() => tabs.find((tb) => tb.id === active.value) || tabs[0])
</script>
