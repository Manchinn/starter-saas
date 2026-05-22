<template>
  <div v-if="message"
    class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700
           text-sm px-4 py-3.5">
    <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
    <span>{{ message }}</span>
  </div>
</template>

<script setup>
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

defineProps({
  message: { type: String, default: '' },
})
</script>
