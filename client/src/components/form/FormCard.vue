<template>
  <div class="bg-white border border-[#E2E8F0] shadow-card overflow-hidden">
    <div v-if="title || $slots.header || $slots.actions"
      class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
      <div class="flex items-center gap-3 min-w-0">
        <div v-if="icon" :class="['w-8 h-8 flex items-center justify-center flex-shrink-0', iconBg]">
          <component :is="icon" :class="['w-4 h-4', iconText]" />
        </div>
        <div class="min-w-0">
          <h2 v-if="title" class="text-sm font-semibold text-[#1C2434] truncate">{{ title }}</h2>
          <p v-if="subtitle" class="text-[11px] text-[#9BA7B0] truncate">{{ subtitle }}</p>
        </div>
        <slot name="header" />
      </div>
      <div v-if="$slots.actions" class="flex-shrink-0">
        <slot name="actions" />
      </div>
    </div>

    <div v-if="padded" class="px-6 py-5">
      <slot />
    </div>
    <slot v-else />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title:    { type: String, default: '' },
  subtitle: { type: String, default: '' },
  icon:     { type: [Object, Function], default: null },
  // Tailwind color name: 'primary' | 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'slate'
  iconColor: { type: String, default: 'primary' },
  padded:    { type: Boolean, default: true },
})

const COLORS = {
  primary: { bg: 'bg-primary-50', text: 'text-primary-500' },
  green:   { bg: 'bg-green-50',   text: 'text-green-600' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600' },
  red:     { bg: 'bg-red-50',     text: 'text-red-600' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-600' },
  slate:   { bg: 'bg-slate-50',   text: 'text-slate-600' },
}
const iconBg   = computed(() => (COLORS[props.iconColor] || COLORS.primary).bg)
const iconText = computed(() => (COLORS[props.iconColor] || COLORS.primary).text)
</script>
