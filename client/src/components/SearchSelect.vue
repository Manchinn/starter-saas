<template>
  <Multiselect
    :model-value="selectedObject"
    @update:model-value="onSelect"
    :options="options"
    :track-by="trackBy"
    :label="labelKey"
    :placeholder="placeholder || '— Select —'"
    :searchable="true"
    :allow-empty="allowEmpty"
    :show-labels="false"
    :disabled="disabled"
    :loading="loading"
    :group-values="groupValues || undefined"
    :group-label="groupLabel || undefined"
    :group-select="false"
    :max-height="maxHeight"
    :option-height="optionHeight"
    :class="['ss', { 'ss--invalid': invalid }]"
    :select-label="''"
    :deselect-label="''"
    :selected-label="''"
  >
    <template #noResult>{{ noResult || 'No results' }}</template>
    <template #noOptions>{{ noOptions || 'No options' }}</template>
    <template v-if="$slots.option" #option="props">
      <slot name="option" v-bind="props" />
    </template>
    <template v-if="$slots.singleLabel" #singleLabel="props">
      <slot name="singleLabel" v-bind="props" />
    </template>
  </Multiselect>
</template>

<script setup>
import { computed } from 'vue'
import Multiselect from 'vue-multiselect'

const props = defineProps({
  modelValue: { type: [String, Number, null], default: '' },
  options:    { type: Array, required: true },
  trackBy:    { type: String, default: 'id' },
  labelKey:   { type: String, default: 'name' },
  placeholder:{ type: String, default: '' },
  allowEmpty: { type: Boolean, default: true },
  disabled:   { type: Boolean, default: false },
  loading:    { type: Boolean, default: false },
  invalid:    { type: Boolean, default: false },
  noResult:   { type: String, default: '' },
  noOptions:  { type: String, default: '' },
  groupValues:{ type: String, default: '' },
  groupLabel: { type: String, default: '' },
  // Limit the popup height so only ~10 items show; the rest scrolls.
  maxHeight:  { type: Number, default: 320 }, // ~10 × 32px
  optionHeight: { type: Number, default: 32 },
})
const emit = defineEmits(['update:modelValue', 'change'])

const selectedObject = computed(() => {
  if (props.modelValue === '' || props.modelValue == null) return null
  const match = (arr) => arr.find(o => String(o?.[props.trackBy]) === String(props.modelValue))
  if (props.groupValues) {
    for (const group of props.options) {
      const hit = match(group?.[props.groupValues] || [])
      if (hit) return hit
    }
    return null
  }
  return match(props.options) || null
})

function onSelect(obj) {
  const v = obj ? obj[props.trackBy] : ''
  emit('update:modelValue', v)
  emit('change', v, obj)
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>
<style scoped>
/* Style overrides to match the existing form inputs */
.ss :deep(.multiselect__tags) {
  border-color: #E2E8F0;
  min-height: 36px;
  padding: 6px 36px 0 10px;
  font-size: 13px;
  border-radius: 0;
}
.ss :deep(.multiselect__single),
.ss :deep(.multiselect__input),
.ss :deep(.multiselect__placeholder) {
  font-size: 13px;
  color: #1C2434;
  margin-bottom: 6px;
  padding: 2px 0;
}
.ss :deep(.multiselect__placeholder) { color: #9BA7B0; }
.ss :deep(.multiselect__option) { font-size: 13px; padding: 8px 12px; min-height: auto; }
.ss :deep(.multiselect__option--highlight),
.ss :deep(.multiselect__option--highlight::after) { background: rgb(99 102 241); }
.ss :deep(.multiselect__option--selected) { background: #F1F5F9; color: #1C2434; font-weight: 600; }
.ss :deep(.multiselect__option--selected::after) { display: none; }
.ss :deep(.multiselect--active .multiselect__tags) {
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  border-color: rgb(129 140 248);
}
.ss--invalid :deep(.multiselect__tags) { border-color: #FCA5A5; background: #FEF2F2; }
.ss :deep(.multiselect__select::before) { border-color: #9BA7B0 transparent transparent; }
</style>
