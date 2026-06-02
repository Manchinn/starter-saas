<template>
  <div class="flex justify-end gap-3">
    <slot name="start" />
    <RouterLink :to="cancelTo" class="btn-secondary">{{ cancelLabel }}</RouterLink>
    <button @click="$emit('save')" :disabled="saving || disabled"
      :title="disabled && disabledHint ? disabledHint : ''" type="button" class="btn-primary gap-2">
      <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
      <CheckIcon v-else class="w-4 h-4" />
      {{ saving ? savingLabel : saveLabel }}
    </button>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { ArrowPathIcon, CheckIcon } from '@heroicons/vue/24/outline'

defineProps({
  cancelTo:     { type: [String, Object], required: true },
  cancelLabel:  { type: String, default: 'Cancel' },
  saveLabel:    { type: String, required: true },
  savingLabel:  { type: String, default: 'Saving…' },
  saving:       { type: Boolean, default: false },
  disabled:     { type: Boolean, default: false },
  disabledHint: { type: String, default: '' },
})

defineEmits(['save'])
</script>
