<template>
  <AppLayout>
    <div class="w-full space-y-6">

      <PageHeader :title="t('erp.fiscalYears.new')" back-to="/erp/accounting/fiscal-years"
        :breadcrumb="[
          { label: t('erp.fiscalYears.title'), to: '/erp/accounting/fiscal-years' },
          { label: t('common.create') },
        ]">
        <template #actions>
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
          <HeaderSaveActions
            cancel-to="/erp/accounting/fiscal-years"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.fiscalYears.createFiscalYear')"
            @save="save"
          />
        </template>
      </PageHeader>

      <FormCard :title="t('erp.fiscalYears.details')" :icon="CalendarDaysIcon" icon-color="purple">
        <div class="space-y-5">

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <FormField name="name" :label="t('erp.fiscalYears.colName')" :errors="mergedErrors"
              v-model="form.name" :placeholder="t('erp.fiscalYears.namePh')" required />
            <FormField name="startDate" :label="t('erp.fiscalYears.colStartDate')" :errors="mergedErrors" required>
              <template #default="{ hasError }">
                <DateInput v-model="form.startDate" :class="['input', hasError && 'input-error']" />
              </template>
            </FormField>
            <FormField name="endDate" :label="t('erp.fiscalYears.colEndDate')" :errors="mergedErrors" required>
              <template #default="{ hasError }">
                <DateInput v-model="form.endDate" :class="['input', hasError && 'input-error']" />
              </template>
            </FormField>
          </div>

          <p v-if="duration" class="text-xs text-[#637381]">
            {{ t('erp.fiscalYears.period') }}: <span class="font-semibold text-[#1C2434]">{{ duration }}</span>
          </p>

          <FormField name="notes" :label="t('erp.common.notes')" :errors="mergedErrors"
            v-model="form.notes" textarea :rows="3" :placeholder="t('erp.fiscalYears.notesPh')" />

        </div>
      </FormCard>

      <ErrorBanner :message="globalError" />

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { CalendarDaysIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import { useFormShortcuts } from '@/composables/useShortcuts'
import api from '@/api'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router      = useRouter()

const { shortcuts } = useFormShortcuts({
  save: () => save(),
  cancel: () => router.push('/erp/accounting/fiscal-years'),
  saveLabel: 'Create',
  cancelLabel: 'Back to list',
})
const saving      = ref(false)
const globalError = ref('')
const errors      = ref({})
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

const mergedErrors = computed(() => ({ ...errors.value, ...fieldErrors.value }))

const form = ref({
  name:      '',
  startDate: '',
  endDate:   '',
  notes:     '',
})

const duration = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return ''
  const ms = new Date(form.value.endDate) - new Date(form.value.startDate)
  if (ms <= 0) return ''
  const days = Math.round(ms / 86_400_000) + 1
  return `${form.value.startDate} → ${form.value.endDate} (${t('erp.fiscalYears.daysCount', { n: days })})`
})

function validate() {
  const e = {}
  if (!form.value.name?.trim())  e.name      = t('erp.fiscalYears.errName')
  if (!form.value.startDate)     e.startDate = t('erp.fiscalYears.errStartDate')
  if (!form.value.endDate)       e.endDate   = t('erp.fiscalYears.errEndDate')
  if (form.value.startDate && form.value.endDate && form.value.startDate >= form.value.endDate)
    e.endDate = t('erp.fiscalYears.errEndAfterStart')
  errors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  globalError.value = ''
  resetErrors()
  if (!validate()) return
  saving.value = true
  try {
    const { data } = await api.post('/erp/accounting/fiscal-years', {
      name:      form.value.name,
      startDate: form.value.startDate,
      endDate:   form.value.endDate,
      notes:     form.value.notes || undefined,
    })
    router.push(`/erp/accounting/fiscal-years/${data.data.fiscalYear.id}`)
  } catch (err) {
    const had = setFromError(err)
    if (!had) globalError.value = parseApiError(err, t('erp.fiscalYears.errCreate'))
  } finally {
    saving.value = false
  }
}
</script>
