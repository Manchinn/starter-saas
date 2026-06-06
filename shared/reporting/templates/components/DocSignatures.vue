<template>
  <div class="grid gap-8 mt-12 px-2" :class="gridColsClass">
    <div v-for="(sig, i) in signatures" :key="'sig' + i" class="text-center">
      <div class="border-b border-dotted border-[#1C2434] h-8"></div>
      <p class="text-[11px] text-[#637381] mt-1.5">{{ sig }}</p>
      <p class="text-[10px] text-[#9BA7B0] mt-2">{{ dateLabel }} ......./......./.......</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Signature captions; one column is rendered per entry.
  signatures: { type: Array,  required: true },
  // Leading word on the date line (e.g. "Date" or its localised form).
  dateLabel:  { type: String, default: 'Date' },
})

// Static class strings so Tailwind's JIT keeps the column utilities.
const GRID_COLS = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }
const gridColsClass = computed(() => GRID_COLS[props.signatures.length] || 'grid-cols-3')
</script>
