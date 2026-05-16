<template>
  <div class="inline-flex items-center gap-1.5">
    <select :value="modelValue || baseCode" @change="onChange($event.target.value)"
      class="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
      <option v-for="c in options" :key="c.code" :value="c.code">{{ c.code }}</option>
    </select>
    <span v-if="showRate && rateNum !== 1" class="text-[11px] text-[#9BA7B0] tabular-nums">
      @ {{ Number(rateNum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) }} {{ baseCode }}
    </span>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useCurrencies } from '@/composables/useCurrencies'

const props = defineProps({
  modelValue:   { type: String, default: '' },
  exchangeRate: { type: [Number, String], default: 1 },
  asOfDate:     { type: String, default: '' },
  showRate:     { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue', 'update:exchangeRate'])

const { currencies, load, baseCurrency, activeCurrencies, getRateOn } = useCurrencies()

const baseCode = computed(() => baseCurrency()?.code || '')
const options  = computed(() => activeCurrencies())
const rateNum  = computed(() => Number(props.exchangeRate) || 1)

onMounted(load)

async function refreshRate(code) {
  const rate = await getRateOn(code, props.asOfDate)
  emit('update:exchangeRate', rate)
}

async function onChange(code) {
  emit('update:modelValue', code)
  await refreshRate(code)
}

// When asOfDate changes and we have a non-base currency, refresh the rate
watch(() => props.asOfDate, async (d) => {
  if (!d) return
  if (!props.modelValue || props.modelValue === baseCode.value) return
  await refreshRate(props.modelValue)
})
</script>
