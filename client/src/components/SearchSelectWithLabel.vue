<template>
  <div :class="wrapperClass">
    <label :class="labelClass">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>
    <SearchSelect v-bind="$attrs" />
  </div>
</template>

<script setup>
import SearchSelect from './SearchSelect.vue'

defineProps({
  label:        { type: String, default: '' },
  required:     { type: Boolean, default: false },
  wrapperClass: { type: String, default: '' },
  labelClass:   { type: String, default: 'label' },
})

defineOptions({ inheritAttrs: false })
</script>
