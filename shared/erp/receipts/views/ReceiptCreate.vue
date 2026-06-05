<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.receipts.new')" back-to="/erp/receipts"
        :breadcrumb="[
          { label: t('erp.receipts.title'), to: '/erp/receipts' },
          { label: t('common.create') },
        ]">
        <template #badge>
          <StatusPill :label="t('erp.common.draft')" />
        </template>
        <template #actions>
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-48" />
          <HeaderSaveActions
            cancel-to="/erp/receipts"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.receipts.create')"
            @save="save"
          />
        </template>
      </PageHeader>

      <!-- Vertical single-column layout -->
      <div class="space-y-5">

        <!-- Section 1: Customer & Receipt Info -->
        <FormCard :title="t('erp.receipts.info')" :icon="UserIcon" icon-color="primary">
          <div class="grid grid-cols-2 gap-x-6 gap-y-5">

            <!-- Customer -->
            <div class="col-span-2">
              <FieldLabel :text="t('erp.common.customer')" required />
              <SearchSelect ref="customerSelectRef" v-model="form.customerId" :options="customers" :invalid="!!mergedErrors.customerId" placeholder="— Select customer —">
                <template #option="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
              </SearchSelect>
              <FieldError name="customerId" :errors="mergedErrors" />
              <CustomerChip :customer="selectedCustomer" />
            </div>

            <!-- Receipt Date -->
            <FormField name="receiptDate" :label="t('erp.receipts.receiptDate')" :errors="mergedErrors" required>
              <template #default="{ hasError }">
                <DateInput v-model="form.receiptDate" :class="['input', hasError && 'input-error']" />
              </template>
            </FormField>

            <!-- Reference Invoice -->
            <div>
              <FieldLabel :text="t('erp.receipts.referenceInvoice')" />
              <SearchSelect v-model="form.invoiceId" :options="invoices" label-key="invoiceNumber" placeholder="— None —">
                <template #option="{ option }">{{ option.invoiceNumber }} · {{ fmtMoney(option.total) }}</template>
                <template #singleLabel="{ option }">{{ option.invoiceNumber }} · {{ fmtMoney(option.total) }}</template>
              </SearchSelect>
            </div>

            <!-- Notes -->
            <FormField name="notes" :label="t('erp.common.notes')" :errors="mergedErrors"
              v-model="form.notes" textarea :rows="2" placeholder="Additional notes…"
              input-class="resize-none" wrapper-class="col-span-2" />

          </div>
        </FormCard>

        <!-- Section 2: Payment -->
        <FormCard :title="t('erp.receipts.paymentMethod')" :icon="BanknotesIcon" icon-color="green">
          <div class="grid grid-cols-2 gap-x-6 gap-y-5">

            <!-- Payment Method -->
            <div>
              <FieldLabel :text="t('erp.receipts.paymentMethod')" required />
              <SearchSelect v-model="form.paymentMethod" :options="paymentMethodOptions" placeholder="— Select —" :invalid="!!mergedErrors.paymentMethod" />
              <FieldError name="paymentMethod" :errors="mergedErrors" />
            </div>

            <!-- Amount -->
            <FormField name="amount" :label="t('erp.receipts.amountReceived')" :errors="mergedErrors"
              v-model="form.amount" type="number" min="0.01" step="0.01" placeholder="0.00" required
              input-class="text-right tabular-nums" />

            <!-- Reference No. -->
            <FormField name="reference" :label="t('erp.receipts.referenceNo')" :errors="mergedErrors"
              v-model="form.reference" placeholder="Cheque no., transfer ref…"
              wrapper-class="col-span-2" />

          </div>
        </FormCard>

        <ErrorBanner :message="globalError" />

        <!-- Summary + Actions -->
        <div class="bg-white border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5">
            <CalculatorIcon class="w-4 h-4 text-[#9BA7B0]" />
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.receipts.receiptSummary') }}</h2>
          </div>

          <div class="px-6 py-4 grid grid-cols-3 gap-4">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.common.customer') }}</span>
              <span class="text-sm font-semibold text-[#1C2434] truncate">{{ selectedCustomer?.name || '—' }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.receipts.colMethod') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">{{ methodLabel(form.paymentMethod) }}</span>
            </div>
            <div v-if="form.invoiceId" class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.receipts.referenceInvoice') }}</span>
              <span class="text-sm font-semibold text-[#1C2434] font-mono">
                {{ invoices.find(i => i.id === form.invoiceId)?.invoiceNumber || '—' }}
              </span>
            </div>
          </div>

          <DocFooterBar
            :total-label="t('erp.receipts.amountReceived')"
            :total="fmtMoney(form.amount || 0)"
            discard-to="/erp/receipts"
            :discard-label="t('common.discard')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.receipts.create')"
            @save="save"
          />
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  CheckIcon,
  ArrowPathIcon, UserIcon, BanknotesIcon, CalculatorIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useFormShortcuts } from '@/composables/useShortcuts'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import StatusPill from '@/components/form/StatusPill.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import CustomerChip from '@/components/form/CustomerChip.vue'
import DocFooterBar from '@/components/form/DocFooterBar.vue'
import FieldError from '@/components/form/FieldError.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'
import { useMasterDataStore } from '@/stores/masterData'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router           = useRouter()
const masterDataStore  = useMasterDataStore()

const { shortcuts } = useFormShortcuts({
  save: () => save(),
  cancel: () => router.push('/erp/receipts'),
  cancelLabel: 'Back to list',
})
const customerSelectRef = ref(null)
const customers        = ref([])
const invoices         = ref([])
const paymentMethods   = ref([])
const paymentMethodOptions = computed(() => paymentMethods.value.map(m => ({ id: m.code || m.name, name: m.name })))
const saving           = ref(false)
const globalError      = ref('')
const errors           = ref({})
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

const mergedErrors = computed(() => ({ ...errors.value, ...fieldErrors.value }))

const today = new Date().toISOString().slice(0, 10)
const form  = ref({
  customerId:    '',
  invoiceId:     '',
  receiptDate:   today,
  paymentMethod: 'cash',
  amount:        null,
  reference:     '',
  notes:         '',
})

const selectedCustomer = computed(() =>
  form.value.customerId ? customers.value.find(c => c.id === form.value.customerId) : null
)

onMounted(async () => {
  const [customersRes, invoicesRes] = await Promise.allSettled([
    api.get('/erp/customers', { params: { limit: 200 } }),
    api.get('/erp/invoices',  { params: { limit: 500, status: 'sent' } }),
  ])
  if (customersRes.status === 'fulfilled') customers.value = customersRes.value.data.data.customers
  if (invoicesRes.status === 'fulfilled')  invoices.value  = invoicesRes.value.data.data.invoices
  paymentMethods.value = await masterDataStore.getValues('payment-methods')
  if (paymentMethods.value.length && !form.value.paymentMethod) {
    form.value.paymentMethod = paymentMethods.value[0].code || paymentMethods.value[0].name
  }
  await nextTick()
  customerSelectRef.value?.focus()
})

function methodLabel(m) {
  const found = paymentMethods.value.find(p => (p.code || p.name) === m)
  return found ? found.name : m
}

function validate() {
  const e = {}
  if (!form.value.customerId)                       e.customerId  = t('erp.receipts.customerRequired')
  if (!form.value.receiptDate)                      e.receiptDate = t('erp.receipts.dateRequired')
  if (!form.value.amount || form.value.amount <= 0) e.amount      = t('erp.receipts.amountRequired')
  errors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  globalError.value = ''
  resetErrors()
  if (!validate()) return
  saving.value = true
  try {
    const payload = {
      ...form.value,
      invoiceId: form.value.invoiceId || null,
      reference: form.value.reference || null,
    }
    const { data } = await api.post('/erp/receipts', payload)
    router.push(`/erp/receipts/${data.data.receipt.id}`)
  } catch (err) {
    const had = setFromError(err)
    if (!had) globalError.value = parseApiError(err, 'Failed to create receipt')
  } finally {
    saving.value = false
  }
}
</script>
