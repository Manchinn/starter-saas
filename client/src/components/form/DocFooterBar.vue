<template>
  <div class="px-6 py-5 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center justify-between">
    <div>
      <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ totalLabel }}</p>
      <p :class="['text-3xl font-extrabold tabular-nums leading-none', colorClass]">{{ total }}</p>
    </div>
    <div class="flex items-center gap-3">
      <RouterLink :to="discardTo"
        class="px-5 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
        {{ discardLabel }}
      </RouterLink>
      <button @click="$emit('save')" :disabled="saving" type="button"
        class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold
               bg-primary-500 text-white hover:bg-primary-600 shadow-sm
               disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
        <CheckIcon v-else class="w-4 h-4" />
        {{ saving ? savingLabel : saveLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CheckIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  totalLabel:   { type: String, required: true },
  total:        { type: [String, Number], default: '' },
  totalColor:   { type: String, default: 'primary' }, // primary | orange | green | red | slate
  discardTo:    { type: [String, Object], required: true },
  discardLabel: { type: String, default: 'Discard' },
  saveLabel:    { type: String, required: true },
  savingLabel:  { type: String, default: 'Saving…' },
  saving:       { type: Boolean, default: false },
})

defineEmits(['save'])

const COLORS = {
  primary: 'text-primary-500',
  orange:  'text-orange-500',
  green:   'text-green-600',
  red:     'text-red-600',
  slate:   'text-slate-600',
}
const colorClass = computed(() => COLORS[props.totalColor] || COLORS.primary)
</script>
