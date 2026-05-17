<template>
  <span :class="[
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
      tone.bg, tone.text, tone.border,
    ]">
    <span v-if="dot" :class="['w-1.5 h-1.5 rounded-full', tone.dot]"></span>
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label:   { type: String, default: '' },
  variant: { type: String, default: 'draft' }, // draft | success | danger | info | neutral
  dot:     { type: Boolean, default: true },
})

const TONES = {
  draft:   { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200',  dot: 'bg-amber-400' },
  success: { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500' },
  danger:  { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500'   },
  info:    { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500'  },
  neutral: { bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-200',  dot: 'bg-slate-400' },
}

const tone = computed(() => TONES[props.variant] || TONES.draft)
</script>
