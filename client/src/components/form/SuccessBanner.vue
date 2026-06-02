<template>
  <div v-if="message"
    class="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800
           text-sm px-4 py-3.5">
    <CheckCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
    <span>{{ message }}</span>
  </div>
</template>

<script setup>
import { CheckCircleIcon } from '@heroicons/vue/24/outline'

defineProps({
  message: { type: String, default: '' },
})
</script>
