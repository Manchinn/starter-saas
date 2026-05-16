<template>
  <span v-if="currency" class="inline-flex items-center gap-1.5">
    <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-100 text-slate-700">
      {{ currency }}
    </span>
    <span v-if="!isBase && baseCode && total != null" class="text-[11px] text-[#9BA7B0] tabular-nums">
      ≈ {{ baseCode }} {{ fmt(baseAmount) }}
      <span v-if="showRate" class="text-[10px]">@ {{ rateNum.toLocaleString(undefined, { maximumFractionDigits: 4 }) }}</span>
    </span>
  </span>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useCurrencies } from '@/composables/useCurrencies'

const props = defineProps({
  currency:     { type: String, default: '' },
  exchangeRate: { type: [Number, String], default: 1 },
  total:        { type: [Number, String], default: null },
  showRate:     { type: Boolean, default: true },
})

const { load, baseCurrency } = useCurrencies()
onMounted(load)

const baseCode  = computed(() => baseCurrency()?.code || '')
const rateNum   = computed(() => Number(props.exchangeRate) || 1)
const isBase    = computed(() => !!props.currency && baseCode.value && props.currency === baseCode.value)
const baseAmount = computed(() => (Number(props.total) || 0) * rateNum.value)

function fmt(n) {
  return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>
