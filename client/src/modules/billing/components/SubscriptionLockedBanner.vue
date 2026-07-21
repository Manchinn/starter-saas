<template>
  <div v-if="auth.locked"
    class="flex items-start gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-lg">
    <LockClosedIcon class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-amber-900">{{ t('billing.lockedTitle') }}</p>
      <p class="text-sm text-amber-800 mt-0.5">{{ t('billing.lockedDesc') }}</p>
    </div>
    <RouterLink v-if="showAction" to="/billing"
      class="btn-primary flex-shrink-0 whitespace-nowrap">
      {{ t('billing.choosePlan') }}
    </RouterLink>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { LockClosedIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'

defineProps({
  // Hide the "Choose a plan" button on the plan picker itself.
  showAction: { type: Boolean, default: true },
})

const { t } = useI18n()
const auth = useAuthStore()
</script>
