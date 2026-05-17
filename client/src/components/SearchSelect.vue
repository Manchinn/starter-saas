<template>
  <div ref="hostEl" class="ss-host">
    <Multiselect
      :model-value="selectedObject"
      @update:model-value="onSelect"
      @open="onOpen"
      @close="onClose"
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
      open-direction="below"
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
  </div>
</template>

<script setup>
import { computed, ref, nextTick, onBeforeUnmount } from 'vue'
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
  maxHeight:  { type: Number, default: 320 }, // ~10 × 32px
  optionHeight: { type: Number, default: 32 },
  // Minimum popup width — when the trigger is narrow (e.g. inline pickers),
  // the popup grows to this width so options stay readable.
  popupMinWidth: { type: Number, default: 220 },
})
const emit = defineEmits(['update:modelValue', 'change'])

const hostEl = ref(null)

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

// ─── Float the popup with position: fixed so it escapes any parent overflow ───
let popupEl = null
let triggerEl = null

function findEls() {
  if (!hostEl.value) return
  popupEl   = hostEl.value.querySelector('.multiselect__content-wrapper')
  triggerEl = hostEl.value.querySelector('.multiselect__tags')
}

function reposition() {
  if (!popupEl || !triggerEl) findEls()
  if (!popupEl || !triggerEl) return
  const rect = triggerEl.getBoundingClientRect()
  // Always anchor below the trigger — no upward flip even if it overflows the viewport
  const width = Math.max(rect.width, props.popupMinWidth)
  // Keep the popup inside the viewport horizontally
  const maxLeft = window.innerWidth - width - 8
  const left = Math.min(rect.left, Math.max(8, maxLeft))
  // Order matters: pin an explicit width BEFORE switching to position: fixed.
  // vue-multiselect's CSS sets width: 100% on the popup; once position becomes
  // fixed, that 100% resolves against the viewport for one frame and the popup
  // flashes full-screen-wide until our inline width overrides it.
  popupEl.style.width     = `${width}px`
  popupEl.style.top       = `${rect.bottom}px`
  popupEl.style.left      = `${left}px`
  popupEl.style.maxHeight = `${props.maxHeight}px`
  popupEl.style.zIndex    = '9999'
  popupEl.style.bottom    = 'auto'
  popupEl.style.position  = 'fixed'
}

function onOpen() {
  nextTick(() => {
    reposition()
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
  })
}

function onClose() {
  window.removeEventListener('scroll', reposition, true)
  window.removeEventListener('resize', reposition)
  if (popupEl) {
    // Reverse order from reposition(): drop fixed positioning first so the
    // explicit width does not get reinterpreted against the viewport.
    popupEl.style.position = ''
    popupEl.style.top      = ''
    popupEl.style.left     = ''
    popupEl.style.width    = ''
    popupEl.style.maxHeight = ''
    popupEl.style.zIndex   = ''
    popupEl.style.bottom   = ''
  }
  popupEl = null
  triggerEl = null
}

onBeforeUnmount(onClose)
</script>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>
<style scoped>
.ss-host { position: relative; }
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
.ss :deep(.multiselect__content-wrapper) {
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
  background: white;
}
.ss--invalid :deep(.multiselect__tags) { border-color: #FCA5A5; background: #FEF2F2; }
.ss :deep(.multiselect__select::before) { border-color: #9BA7B0 transparent transparent; }
</style>
