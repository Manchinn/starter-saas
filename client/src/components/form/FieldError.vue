<template>
  <p v-if="message" class="field-error">
    <ExclamationCircleIcon class="w-3.5 h-3.5 flex-shrink-0 mt-px" />
    <span>{{ message }}</span>
  </p>
</template>

<script setup>
import { computed } from 'vue'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  name:   { type: String, default: '' },
  errors: { type: Object, default: () => ({}) },
  error:  { type: String, default: '' },
})

const message = computed(() => props.error || (props.name && props.errors?.[props.name]) || '')
</script>
