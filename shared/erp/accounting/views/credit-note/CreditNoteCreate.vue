<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Page Header -->
      <PageHeader :title="t('erp.creditNotes.new')" back-to="/erp/billing/credit-notes"
        :breadcrumb="[
          { label: t('erp.creditNotes.title'), to: '/erp/billing/credit-notes' },
          { label: t('common.create') },
        ]">
        <template #badge>
          <StatusPill :label="t('erp.common.draft')" />
        </template>
        <template #actions>
          <HeaderSaveActions
            cancel-to="/erp/billing/credit-notes"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.creditNotes.create')"
            @save="save"
          />
        </template>
      </PageHeader>

      <!-- Form -->
      <div class="space-y-5">

        <!-- Section: Credit Note Information -->
        <FormCard :title="t('erp.creditNotes.info')" :icon="ArrowTrendingDownIcon" icon-color="green">
          <div class="grid grid-cols-2 gap-x-6 gap-y-5">

            <!-- Customer -->
            <div class="col-span-2 lg:col-span-1">
              <FieldLabel :text="t('erp.common.customer')" required />
              <SearchSelect v-model="form.customerId" :options="customers" :invalid="!!mergedErrors.customerId" placeholder="— Select customer —" @change="onCustomerChange">
                <template #option="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
              </SearchSelect>
              <p v-if="errors.customerId" class="mt-1 text-xs text-red-500">{{ errors.customerId }}</p>
              <FieldError name="customerId" :errors="mergedErrors" />
            </div>

            <!-- Date -->
            <FormField name="date" :label="t('erp.common.date')" :errors="mergedErrors" required>
              <template #default="{ hasError }">
                <DateInput v-model="form.date" :class="['input', hasError && 'input-error']" />
              </template>
            </FormField>

            <!-- Invoice (optional) -->
            <div class="col-span-2 lg:col-span-1">
              <FieldLabel :text="t('erp.creditNotes.linkedInvoice')" />
              <SearchSelect v-model="form.invoiceId" :options="invoices" label-key="invoiceNumber" :disabled="!form.customerId || loadingInvoices" :loading="loadingInvoices" placeholder="— No invoice —">
                <template #option="{ option }">{{ option.invoiceNumber }} · {{ fmtMoney(option.total) }}</template>
                <template #singleLabel="{ option }">{{ option.invoiceNumber }} · {{ fmtMoney(option.total) }}</template>
              </SearchSelect>
            </div>

            <!-- Amount -->
            <FormField name="amount" :label="t('erp.creditNotes.colAmount')" :errors="mergedErrors"
              v-model="form.amount" type="number" min="0.01" step="0.01" placeholder="0.00" required />

            <!-- Reason -->
            <FormField name="reason" :label="t('erp.creditNotes.colReason')" :errors="mergedErrors"
              v-model="form.reason" :placeholder="t('erp.creditNotes.reasonPh')" required
              wrapper-class="col-span-2" />

            <!-- Notes -->
            <FormField name="notes" :label="t('erp.common.notes')" :errors="mergedErrors"
              v-model="form.notes" textarea :rows="2" :placeholder="t('erp.creditNotes.notesPh')"
              wrapper-class="col-span-2" />

          </div>
        </FormCard>

        <!-- Global error -->
        <ErrorBanner :message="globalError" />

        <!-- Summary -->
        <div class="bg-white border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5">
            <CalculatorIcon class="w-4 h-4 text-[#9BA7B0]" />
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.creditNotes.summary') }}</h2>
          </div>
          <div class="px-6 py-4 grid grid-cols-3 gap-6">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.common.customer') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">
                {{ customers.find(c => c.id === form.customerId)?.name || '—' }}
              </span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.creditNotes.colInvoice') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">
                {{ invoices.find(i => i.id === form.invoiceId)?.invoiceNumber || '—' }}
              </span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.common.date') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">{{ fmtDate(form.date) || '—' }}</span>
            </div>
          </div>
          <DocFooterBar
            :total-label="t('erp.creditNotes.creditAmount')"
            :total="fmtMoney(form.amount || 0)" total-color="green"
            discard-to="/erp/billing/credit-notes"
            :discard-label="t('common.discard')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.creditNotes.create')"
            @save="save"
          />
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  CheckIcon, ArrowPathIcon, ArrowTrendingDownIcon, CalculatorIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import FieldError from '@/components/form/FieldError.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import StatusPill from '@/components/form/StatusPill.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import DocFooterBar from '@/components/form/DocFooterBar.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { fmtDate } from '@/utils/fmt'
import { fmtMoney } from '@/utils/fmt'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router          = useRouter()
const customers       = ref([])
const invoices        = ref([])
const loadingInvoices = ref(false)
const saving          = ref(false)
const globalError     = ref('')
const errors          = ref({})
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

const mergedErrors = computed(() => ({ ...errors.value, ...fieldErrors.value }))

const today = new Date().toISOString().slice(0, 10)
const form  = ref({
  customerId: '',
  invoiceId:  '',
  date:       today,
  reason:     '',
  amount:     '',
  notes:      '',
})

onMounted(async () => {
  const { data } = await api.get('/erp/customers', { params: { limit: 200 } })
  customers.value = data.data.customers
})

async function onCustomerChange() {
  form.value.invoiceId = ''
  invoices.value = []
  if (!form.value.customerId) return
  loadingInvoices.value = true
  try {
    const { data } = await api.get('/erp/billing/credit-notes/customer-invoices', {
      params: { customerId: form.value.customerId },
    })
    invoices.value = data.data.invoices
  } finally {
    loadingInvoices.value = false
  }
}

function validate() {
  const e = {}
  if (!form.value.customerId)              e.customerId = t('erp.creditNotes.errCustomer')
  if (!form.value.date)                    e.date       = t('erp.creditNotes.errDate')
  if (!form.value.reason?.trim())          e.reason     = t('erp.creditNotes.errReason')
  if (!form.value.amount || Number(form.value.amount) <= 0) e.amount = t('erp.creditNotes.errAmount')
  errors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  globalError.value = ''
  resetErrors()
  if (!validate()) return
  saving.value = true
  try {
    const { data } = await api.post('/erp/billing/credit-notes', {
      customerId: form.value.customerId,
      invoiceId:  form.value.invoiceId  || undefined,
      date:       form.value.date,
      reason:     form.value.reason,
      amount:     Number(form.value.amount),
      notes:      form.value.notes || undefined,
    })
    router.push(`/erp/billing/credit-notes/${data.data.creditNote.id}`)
  } catch (err) {
    const had = setFromError(err)
    if (!had) globalError.value = parseApiError(err, t('erp.creditNotes.errCreate'))
  } finally {
    saving.value = false
  }
}
</script>
