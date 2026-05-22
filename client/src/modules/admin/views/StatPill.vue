<template>
  <div class="bg-white border border-[#E2E8F0] shadow-card px-4 py-3 flex items-center gap-3">
    <div :class="['w-9 h-9 flex items-center justify-center flex-shrink-0', toneClass.bg]">
      <component :is="icon" :class="['w-4 h-4', toneClass.fg]" />
    </div>
    <div class="min-w-0">
      <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider truncate">{{ label }}</p>
      <p class="text-lg font-bold text-[#1C2434] tabular leading-tight">{{ value }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], required: true },
  icon:  { type: [Function, Object], required: true },
  tone:  { type: String, default: 'primary' },
})

const TONES = {
  primary: { bg: 'bg-primary-50',  fg: 'text-primary-600' },
  violet:  { bg: 'bg-violet-50',   fg: 'text-violet-600'  },
  emerald: { bg: 'bg-emerald-50',  fg: 'text-emerald-600' },
  amber:   { bg: 'bg-amber-50',    fg: 'text-amber-600'   },
  rose:    { bg: 'bg-rose-50',     fg: 'text-rose-600'    },
}
const toneClass = computed(() => TONES[props.tone] || TONES.primary)
</script>
