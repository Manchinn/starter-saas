<template>
  <div :class="wrapperClass">
    <label v-if="label || $slots.label" :for="fieldId" :class="labelClass">
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <div v-if="$slots.default || $slots.prefix || $slots.suffix" class="relative">
      <div v-if="$slots.prefix" class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
        <slot name="prefix" />
      </div>
      <slot :id="fieldId" :hasError="hasError" :errorClass="hasError ? 'input-error' : ''">
        <input
          :id="fieldId"
          :type="type"
          :value="modelValue"
          v-bind="$attrs"
          @input="onInput"
          @blur="$emit('blur', $event)"
          :placeholder="placeholder"
          :autocomplete="autocomplete"
          :disabled="disabled"
          :readonly="readonly"
          :class="[
            'input',
            $slots.prefix && 'pl-10',
            $slots.suffix && 'pr-10',
            hasError && 'input-error',
            inputClass,
          ]"
        />
      </slot>
      <div v-if="$slots.suffix" class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
        <slot name="suffix" />
      </div>
    </div>

    <p v-if="hint && !errorMessage" class="mt-1 text-[11.5px] text-[#9BA7B0]">{{ hint }}</p>

    <FieldError :error="errorMessage" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import FieldError from './FieldError.vue'

const props = defineProps({
  name:         { type: String, required: true },
  modelValue:   { default: '' },
  label:        { type: String, default: '' },
  type:         { type: String, default: 'text' },
  placeholder:  { type: String, default: '' },
  autocomplete: { type: String, default: '' },
  required:     { type: Boolean, default: false },
  disabled:     { type: Boolean, default: false },
  readonly:     { type: Boolean, default: false },
  hint:         { type: String, default: '' },
  errors:       { type: Object, default: () => ({}) },
  wrapperClass: { type: String, default: '' },
  labelClass:   { type: String, default: 'label' },
  inputClass:   { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'blur'])

let _uid = 0
const fieldId = computed(() => `ff-${props.name}-${++_uid || ''}`.replace(/\W+/g, '-'))

const errorMessage = computed(() => (props.name ? props.errors?.[props.name] || '' : ''))
const hasError = computed(() => !!errorMessage.value)

function onInput(e) {
  let value = e.target.value
  if (props.type === 'number' && value !== '') {
    const n = Number(value)
    if (!Number.isNaN(n)) value = n
  }
  emit('update:modelValue', value)
}

defineOptions({ inheritAttrs: false })
</script>
