<template>
  <div :class="['flex flex-col items-center justify-center text-center', paddingClass]">
    <div class="w-14 h-14 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mb-4">
      <component :is="icon" class="w-7 h-7 text-[#CBD5E1]" />
    </div>
    <p class="text-sm font-semibold text-[#637381]">{{ title }}</p>
    <p v-if="subtitle" class="text-xs text-[#9BA7B0] mt-1 mb-4">{{ subtitle }}</p>
    <button v-if="actionLabel" @click="$emit('action')" type="button"
      class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-500
             bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
      <PlusIcon class="w-4 h-4" />
      {{ actionLabel }}
    </button>
    <p v-if="errorMessage" class="mt-3 text-xs text-red-500">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  icon:         { type: [Object, Function], required: true },
  title:        { type: String, required: true },
  subtitle:     { type: String, default: '' },
  actionLabel:  { type: String, default: '' },
  errorMessage: { type: String, default: '' },
  padding:      { type: String, default: 'lg' }, // sm | md | lg | xl
})

defineEmits(['action'])

const paddingClass = computed(() => ({
  sm: 'py-8',
  md: 'py-12',
  lg: 'py-16',
  xl: 'py-20',
}[props.padding] || 'py-16'))
</script>
