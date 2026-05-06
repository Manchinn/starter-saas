<template>
  <input
    :type="isFocused || modelValue ? 'date' : 'text'"
    :value="modelValue || ''"
    @focus="isFocused = true"
    @blur="isFocused = false"
    @change="$emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
import { ref } from 'vue'
defineProps({ modelValue: { type: String, default: '' } })
defineEmits(['update:modelValue'])
const isFocused = ref(false)
</script>
