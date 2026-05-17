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
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                       bg-amber-50 text-amber-600 border border-amber-200">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            {{ t('erp.common.draft') }}
          </span>
        </template>
        <template #actions>
          <RouterLink to="/erp/billing/credit-notes" class="btn-secondary">{{ t('common.cancel') }}</RouterLink>
          <button @click="save" :disabled="saving" class="btn-primary gap-2">
            <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
            <CheckIcon v-else class="w-4 h-4" />
            {{ saving ? t('erp.common.creating') : t('erp.creditNotes.create') }}
          </button>
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
              <SearchSelect v-model="form.customerId" :options="customers" :invalid="!!errors.customerId" placeholder="— Select customer —" @change="onCustomerChange">
                <template #option="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
              </SearchSelect>
              <p v-if="errors.customerId" class="mt-1 text-xs text-red-500">{{ errors.customerId }}</p>
            </div>

            <!-- Date -->
            <div>
              <FieldLabel :text="t('erp.common.date')" required />
              <input v-model="form.date" type="date"
                :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                         'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                         errors.date ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
              <p v-if="errors.date" class="mt-1 text-xs text-red-500">{{ errors.date }}</p>
            </div>

            <!-- Invoice (optional) - kept inline because the label has a secondary "(optional)" hint -->
            <div class="col-span-2 lg:col-span-1">
              <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                {{ t('erp.creditNotes.linkedInvoice') }} <span class="text-[#9BA7B0] normal-case font-normal text-[10px]">(optional)</span>
              </label>
              <SearchSelect v-model="form.invoiceId" :options="invoices" label-key="invoiceNumber" :disabled="!form.customerId || loadingInvoices" :loading="loadingInvoices" placeholder="— No invoice —">
                <template #option="{ option }">{{ option.invoiceNumber }} · {{ fmtMoney(option.total) }}</template>
                <template #singleLabel="{ option }">{{ option.invoiceNumber }} · {{ fmtMoney(option.total) }}</template>
              </SearchSelect>
            </div>

            <!-- Amount -->
            <div>
              <FieldLabel :text="t('erp.creditNotes.colAmount')" required />
              <input v-model="form.amount" type="number" min="0.01" step="0.01" placeholder="0.00"
                :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                         'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                         errors.amount ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
              <p v-if="errors.amount" class="mt-1 text-xs text-red-500">{{ errors.amount }}</p>
            </div>

            <!-- Reason -->
            <div class="col-span-2">
              <FieldLabel :text="t('erp.creditNotes.colReason')" required />
              <input v-model="form.reason" type="text" :placeholder="t('erp.creditNotes.reasonPh')"
                :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                         'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                         errors.reason ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
              <p v-if="errors.reason" class="mt-1 text-xs text-red-500">{{ errors.reason }}</p>
            </div>

            <!-- Notes -->
            <div class="col-span-2">
              <FieldLabel :text="t('erp.common.notes')" />
              <textarea v-model="form.notes" rows="2" :placeholder="t('erp.creditNotes.notesPh')"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                       transition-colors resize-none placeholder-[#CBD5E1]" />
            </div>

          </div>
        </FormCard>

        <!-- Global error -->
        <ErrorBanner :message="globalError" />

        <!-- Summary -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
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
              <span class="text-sm font-semibold text-[#1C2434]">{{ form.date || '—' }}</span>
            </div>
          </div>
          <div class="px-6 py-5 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('erp.creditNotes.creditAmount') }}</p>
              <p class="text-3xl font-extrabold text-green-600 tabular-nums leading-none">{{ fmtMoney(form.amount || 0) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <RouterLink to="/erp/billing/credit-notes"
                class="px-5 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
                {{ t('common.discard') }}
              </RouterLink>
              <button @click="save" :disabled="saving"
                class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold
                       bg-primary-500 text-white rounded-xl hover:bg-primary-600 shadow-sm
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
                <CheckIcon v-else class="w-4 h-4" />
                {{ saving ? t('erp.common.creating') : t('erp.creditNotes.create') }}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  CheckIcon, ArrowPathIcon, ArrowTrendingDownIcon, CalculatorIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'
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
    globalError.value = parseApiError(err, t('erp.creditNotes.errCreate'))
  } finally {
    saving.value = false
  }
}
</script>
