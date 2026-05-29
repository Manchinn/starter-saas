<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to || undefined"
    :type="to ? undefined : type"
    :disabled="to ? undefined : (disabled || loading)"
    :class="`btn-${variant}`"
  >
    <ArrowPathIcon v-if="loading" class="w-4 h-4 animate-spin" />
    <slot />
  </component>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

defineProps({
  variant:  { type: String, default: 'primary' },
  to:       { type: [String, Object], default: '' },
  type:     { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  loading:  { type: Boolean, default: false },
})
</script>
