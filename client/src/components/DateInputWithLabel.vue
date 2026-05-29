<template>
  <div :class="wrapperClass">
    <label :class="labelClass">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>
    <DateInput
      :model-value="modelValue"
      :class="['input', inputClass]"
      @update:model-value="$emit('update:modelValue', $event)"
      @change="$emit('change', $event)"
    />
  </div>
</template>

<script setup>
import DateInput from './DateInput.vue'

defineProps({
  modelValue:   { type: String, default: '' },
  label:        { type: String, default: '' },
  required:     { type: Boolean, default: false },
  wrapperClass: { type: String, default: '' },
  labelClass:   { type: String, default: 'label' },
  inputClass:   { type: String, default: '' },
})

defineEmits(['update:modelValue', 'change'])
</script>
