<template>
  <div class="grid grid-cols-2 gap-4">
    <FormField v-model="form.title" name="title" :label="t('erp.alerts.titleField')" :placeholder="t('erp.alerts.titleField')" required :errors="errors" wrapper-class="col-span-2" />
    <FormField v-model="form.body" name="body" textarea :rows="3" :label="t('erp.alerts.body')" :placeholder="t('erp.alerts.body')" :errors="errors" wrapper-class="col-span-2" />

    <SearchSelectWithLabel v-model="form.severity" :label="t('erp.alerts.severity')" :options="severityOptions" :allow-empty="false" />
    <SearchSelectWithLabel v-model="form.scope" :label="t('erp.alerts.scope')" :options="scopeOptions" :allow-empty="false" />

    <SearchSelectWithLabel
      v-if="form.scope === 'module'"
      v-model="form.moduleSlug" :label="t('erp.alerts.module')" :options="moduleOptions"
      :placeholder="t('erp.alerts.module')" wrapper-class="col-span-2"
    />
    <SearchSelectWithLabel
      v-if="form.scope === 'department'"
      v-model="form.departmentId" :label="t('erp.alerts.department')" :options="options.departments || []"
      :placeholder="t('erp.alerts.department')" wrapper-class="col-span-2"
    />

    <FormField v-model="form.link" name="link" :label="t('erp.alerts.link')" placeholder="/erp/…" :errors="errors" wrapper-class="col-span-2 sm:col-span-1" />
    <DateInputWithLabel v-model="form.expiresAt" :label="t('erp.alerts.expiresAt')" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FormField from '@/components/form/FormField.vue'
import SearchSelectWithLabel from '@/components/SearchSelectWithLabel.vue'
import DateInputWithLabel from '@/components/DateInputWithLabel.vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
  options:    { type: Object, default: () => ({ modules: [], departments: [] }) },
  errors:     { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const form = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const severityOptions = computed(() => [
  { id: 'info',     name: t('erp.alerts.sevInfo') },
  { id: 'success',  name: t('erp.alerts.sevSuccess') },
  { id: 'warning',  name: t('erp.alerts.sevWarning') },
  { id: 'critical', name: t('erp.alerts.sevCritical') },
])

const scopeOptions = computed(() => [
  { id: 'global',     name: t('erp.alerts.scopeGlobal') },
  { id: 'module',     name: t('erp.alerts.scopeModule') },
  { id: 'department', name: t('erp.alerts.scopeDepartment') },
])

const moduleOptions = computed(() => (props.options.modules || []).map((m) => ({ id: m.slug, name: m.name })))
</script>
