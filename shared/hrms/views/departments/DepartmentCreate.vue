<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.departments.new')" back-to="/hrms/departments"
        :breadcrumb="[
          { label: t('erp.departments.title'), to: '/hrms/departments' },
          { label: t('common.create') },
        ]">
        <template #actions>
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-48" />
          <HeaderSaveActions
            cancel-to="/hrms/departments"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.departments.create')"
            @save="save"
          />
        </template>
      </PageHeader>

      <FormCard :title="t('erp.departments.new')" :icon="BuildingOfficeIcon" icon-color="primary">
        <div class="space-y-4">

          <FormField name="code" :label="t('erp.departments.code')" :errors="fieldErrors">
            <template #default="{ id }">
              <input v-if="!autoCode.enabled.value" :id="id" ref="codeInputRef" v-model="form.code" type="text"
                placeholder="e.g. DEP0001" class="input font-mono" />
              <input v-else :id="id" :value="autoCode.preview.value" type="text" readonly
                class="input bg-[#F7F9FC] text-[#637381] font-mono cursor-not-allowed" />
              <label class="mt-1 flex items-center gap-2 text-xs text-[#637381] cursor-pointer select-none">
                <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" />
                {{ t('erp.common.autoGenerate') }}
              </label>
            </template>
          </FormField>

          <FormField name="name" :label="t('erp.departments.name')" :errors="fieldErrors"
            v-model="form.name" placeholder="e.g. Engineering" required />

          <FormField name="description" :label="t('erp.departments.description')" :errors="fieldErrors"
            v-model="form.description" textarea :rows="3"
            placeholder="Describe the functions of this department…" />

          <div class="grid grid-cols-2 gap-4">
            <FormField name="activeFrom" :label="t('erp.common.activeFrom')" :errors="fieldErrors">
              <template #default>
                <DateInput v-model="form.activeFrom" class="input" />
              </template>
            </FormField>
            <FormField name="activeTo" :label="t('erp.common.activeTo')" :errors="fieldErrors">
              <template #default>
                <DateInput v-model="form.activeTo" class="input" />
              </template>
            </FormField>
          </div>

          <div>
            <FieldLabel :text="t('erp.departments.status')" />
            <SearchSelect v-model="form.isActive" :options="STATUS_OPTIONS" :allow-empty="false" placeholder="— Select —" />
          </div>

        </div>
      </FormCard>

      <ErrorBanner :message="error" />

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { BuildingOfficeIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useFormShortcuts } from '@/composables/useShortcuts'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { useAutoCode } from '@/composables/useAutoCode'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router       = useRouter()
const codeInputRef = ref(null)
const autoCode     = useAutoCode('DEP')

const { shortcuts } = useFormShortcuts({
  save: () => save(),
  cancel: () => router.push('/hrms/departments'),
  cancelLabel: 'Back to list',
})

onMounted(async () => {
  await nextTick()
  codeInputRef.value?.focus()
})
const saving   = ref(false)
const error    = ref('')
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

const STATUS_OPTIONS = computed(() => [
  { id: true,  name: t('common.active') },
  { id: false, name: t('common.inactive') },
])

const form = ref({
  name:        '',
  code:        '',
  description: '',
  isActive:    true,
  activeFrom:  '',
  activeTo:    '',
})

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.departments.name') })); return }

  saving.value = true
  try {
    const payload = { ...form.value }
    if (autoCode.enabled.value) { payload.autoCode = true; payload.code = null }
    await api.post('/hrms/departments', payload)
    router.push('/hrms/departments')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to create department')
  } finally {
    saving.value = false
  }
}
</script>
