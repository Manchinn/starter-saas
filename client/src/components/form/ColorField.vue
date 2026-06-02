<template>
  <div :class="wrapperClass">
    <label v-if="label" class="label">{{ label }}</label>
    <div class="flex items-center gap-3">
      <input type="color" :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        class="h-9 w-16 border border-[#E2E8F0] cursor-pointer p-0.5" />
      <span class="text-sm font-mono text-[#637381]">{{ modelValue }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue:   { type: String, default: '#6366f1' },
  label:        { type: String, default: '' },
  wrapperClass: { type: String, default: '' },
})

defineEmits(['update:modelValue'])
</script>
