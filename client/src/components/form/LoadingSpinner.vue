<template>
  <div :class="['flex items-center justify-center', paddingClass]">
    <ArrowPathIcon :class="['text-[#9BA7B0] animate-spin', sizeClass]" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  size:    { type: String, default: 'md' },     // sm | md | lg
  padding: { type: String, default: 'lg' },     // sm | md | lg | xl
})

const sizeClass = computed(() => ({
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}[props.size] || 'w-6 h-6'))

const paddingClass = computed(() => ({
  sm: 'py-8',
  md: 'py-16',
  lg: 'py-24',
  xl: 'py-32',
}[props.padding] || 'py-24'))
</script>
