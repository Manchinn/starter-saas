<template>
  <div>
    <p v-if="!roles.length" class="text-sm text-[#9BA7B0]">{{ t('team.noAssignableRoles') }}</p>
    <div v-else class="flex flex-wrap gap-2">
      <label
        v-for="r in roles" :key="r.id"
        class="inline-flex items-center gap-2 px-2.5 py-1.5 border cursor-pointer transition-colors text-[13px]"
        :class="isChecked(r.id)
          ? 'border-primary-500 bg-primary-50 text-primary-700'
          : 'border-[#E2E8F0] text-[#637381] hover:bg-[#F7F9FC]'"
      >
        <input type="checkbox" class="hidden" :checked="isChecked(r.id)" @change="toggle(r.id)" />
        <span class="w-2 h-2 flex-shrink-0" :style="{ backgroundColor: r.color || '#6366f1' }"></span>
        {{ r.name }}
      </label>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  roles:      { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const isChecked = (id) => props.modelValue.includes(id)

function toggle(id) {
  const next = isChecked(id)
    ? props.modelValue.filter((x) => x !== id)
    : [...props.modelValue, id]
  emit('update:modelValue', next)
}
</script>
