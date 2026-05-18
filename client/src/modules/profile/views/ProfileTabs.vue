<template>
  <div class="card overflow-hidden">
    <div class="border-b border-[#E2E8F0] px-2">
      <nav class="flex gap-1">
        <RouterLink
          v-for="tab in tabs" :key="tab.name"
          :to="tab.to"
          class="px-4 py-3 text-[13px] font-medium text-[#637381] hover:text-[#1C2434] transition-colors
                 border-b-2 border-transparent -mb-px"
          active-class="!text-primary-600 !border-primary-500"
        >
          {{ t(tab.label) }}
        </RouterLink>
      </nav>
    </div>
    <div class="p-6">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const tabs = [
  { name: 'general',  label: 'profile.tabGeneral',  to: '/profile/general' },
  { name: 'password', label: 'profile.tabPassword', to: '/profile/password' },
  { name: 'sessions', label: 'profile.tabSessions', to: '/profile/sessions' },
]
</script>
