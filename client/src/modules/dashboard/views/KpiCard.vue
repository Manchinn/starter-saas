<template>
  <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-5">
    <div class="flex items-start justify-between gap-3 mb-3">
      <div :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', toneClass.bg]">
        <component :is="icon" :class="['w-5 h-5', toneClass.fg]" />
      </div>
      <span v-if="trend !== null && trend !== undefined" :class="trendBadge" class="badge text-[11px]">
        <component :is="trendIcon" class="w-3 h-3" />
        {{ trend > 0 ? '+' : '' }}{{ trend }}%
      </span>
    </div>
    <p class="text-2xl font-bold text-[#1C2434] tabular leading-none">
      <span v-if="loading" class="inline-block w-16 h-6 bg-[#F1F5F9] rounded animate-pulse align-middle"></span>
      <template v-else>{{ value }}</template>
    </p>
    <div class="mt-2 flex items-center justify-between gap-2">
      <p class="text-[12.5px] font-medium text-[#637381] truncate">{{ label }}</p>
      <span v-if="trendLabel && trend !== null && trend !== undefined" class="text-[10.5px] text-[#9BA7B0] whitespace-nowrap">{{ trendLabel }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  label:      { type: String, required: true },
  value:      { type: [String, Number], required: true },
  icon:       { type: [Function, Object], required: true },
  tone:       { type: String, default: 'primary' },
  trend:      { type: Number, default: null },
  trendLabel: { type: String, default: '' },
  loading:    { type: Boolean, default: false },
})

const TONES = {
  primary: { bg: 'bg-primary-50',  fg: 'text-primary-600' },
  violet:  { bg: 'bg-violet-50',   fg: 'text-violet-600'  },
  emerald: { bg: 'bg-emerald-50',  fg: 'text-emerald-600' },
  amber:   { bg: 'bg-amber-50',    fg: 'text-amber-600'   },
}
const toneClass = computed(() => TONES[props.tone] || TONES.primary)

const trendBadge = computed(() => {
  if (props.trend === null || props.trend === undefined) return ''
  if (props.trend > 0)  return 'badge-green'
  if (props.trend < 0)  return 'badge-red'
  return 'bg-[#F1F5F9] text-[#637381]'
})
const trendIcon = computed(() => {
  if (props.trend === null || props.trend === undefined) return MinusIcon
  if (props.trend > 0) return ArrowTrendingUpIcon
  if (props.trend < 0) return ArrowTrendingDownIcon
  return MinusIcon
})
</script>
