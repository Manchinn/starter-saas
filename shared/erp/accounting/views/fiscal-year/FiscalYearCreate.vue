<template>
  <AppLayout>
    <div class="w-full space-y-6">

      <PageHeader :title="t('erp.fiscalYears.new')" back-to="/erp/accounting/fiscal-years"
        :breadcrumb="[
          { label: t('erp.fiscalYears.title'), to: '/erp/accounting/fiscal-years' },
          { label: t('common.create') },
        ]">
        <template #actions>
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
            <div>
              <FieldLabel :text="t('erp.fiscalYears.colName')" required />
              <input v-model="form.name" type="text" :placeholder="t('erp.fiscalYears.namePh')"
                :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                         'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                         errors.name ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
              <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
            </div>
            <div>
              <FieldLabel :text="t('erp.fiscalYears.colStartDate')" required />
              <DateInput v-model="form.startDate"
                :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                         'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                         errors.startDate ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
              <p v-if="errors.startDate" class="mt-1 text-xs text-red-500">{{ errors.startDate }}</p>
            </div>
            <div>
              <FieldLabel :text="t('erp.fiscalYears.colEndDate')" required />
              <DateInput v-model="form.endDate"
                :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                         'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                         errors.endDate ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
              <p v-if="errors.endDate" class="mt-1 text-xs text-red-500">{{ errors.endDate }}</p>
            </div>
          </div>

          <p v-if="duration" class="text-xs text-[#637381]">
            {{ t('erp.fiscalYears.period') }}: <span class="font-semibold text-[#1C2434]">{{ duration }}</span>
          </p>

          <div>
            <FieldLabel :text="t('erp.common.notes')" />
            <textarea v-model="form.notes" rows="3" :placeholder="t('erp.fiscalYears.notesPh')"
              class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                     focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                     transition-colors resize-none placeholder-[#CBD5E1]" />
          </div>

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
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import api from '@/api'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router      = useRouter()
const saving      = ref(false)
const globalError = ref('')
const errors      = ref({})

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
    globalError.value = parseApiError(err, t('erp.fiscalYears.errCreate'))
  } finally {
    saving.value = false
  }
}
</script>
