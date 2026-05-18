<template>
  <input
    :type="isFocused ? 'date' : 'text'"
    :value="isFocused ? pickerValue : displayText"
    @focus="isFocused = true"
    @blur="isFocused = false"
    @change="onChange"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit  = defineEmits(['update:modelValue', 'change'])

const settings  = useSettingsStore()
const isFocused = ref(false)

const BE_OFFSET = 543

function ceToBe(s) {
  if (!s) return s
  const [y, m, d] = s.split('-')
  return [String(Number(y) + BE_OFFSET), m, d].join('-')
}

function beToCe(s) {
  if (!s) return s
  const [y, m, d] = s.split('-')
  const ceYear = Number(y) - BE_OFFSET
  return [String(ceYear < 1 ? 1 : ceYear).padStart(4, '0'), m, d].join('-')
}

const isBE       = computed(() => settings.calendar?.system === 'BE')
const dateFormat = computed(() => settings.calendar?.dateFormat || 'dd/mm/yyyy')

// Value passed to the native date picker (BE-adjusted YYYY-MM-DD if needed)
const pickerValue = computed(() =>
  isBE.value && props.modelValue ? ceToBe(props.modelValue) : (props.modelValue || '')
)

// Formatted text shown when the input is not focused
const displayText = computed(() => {
  if (!props.modelValue) return ''
  const parts = props.modelValue.split('-')
  if (parts.length < 3) return props.modelValue
  let year = Number(parts[0])
  if (isBE.value) year += BE_OFFSET
  return dateFormat.value
    .replace('dd',   parts[2].padStart(2, '0'))
    .replace('mm',   parts[1].padStart(2, '0'))
    .replace('yyyy', String(year))
})

function onChange(e) {
  const raw = e.target.value
  if (!raw) { emit('update:modelValue', ''); emit('change', ''); return }
  const ce = isBE.value ? beToCe(raw) : raw
  emit('update:modelValue', ce)
  emit('change', ce)
}
</script>
