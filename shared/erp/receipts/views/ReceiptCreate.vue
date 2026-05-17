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
              <SearchSelect v-model="form.customerId" :options="customers" :invalid="!!errors.customerId" placeholder="— Select customer —">
                <template #option="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
              </SearchSelect>
              <p v-if="errors.customerId" class="mt-1 text-xs text-red-500">{{ errors.customerId }}</p>

              <CustomerChip :customer="selectedCustomer" />
            </div>

            <!-- Receipt Date -->
            <div>
              <FieldLabel :text="t('erp.receipts.receiptDate')" required />
              <DateInput v-model="form.receiptDate"
                :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                         'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                         errors.receiptDate ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
              <p v-if="errors.receiptDate" class="mt-1 text-xs text-red-500">{{ errors.receiptDate }}</p>
            </div>

            <!-- Reference Invoice -->
            <div>
              <FieldLabel :text="t('erp.receipts.referenceInvoice')" />
              <SearchSelect v-model="form.invoiceId" :options="invoices" label-key="invoiceNumber" placeholder="— None —">
                <template #option="{ option }">{{ option.invoiceNumber }} · {{ fmtMoney(option.total) }}</template>
                <template #singleLabel="{ option }">{{ option.invoiceNumber }} · {{ fmtMoney(option.total) }}</template>
              </SearchSelect>
            </div>

            <!-- Notes -->
            <div class="col-span-2">
              <FieldLabel :text="t('erp.common.notes')" />
              <textarea v-model="form.notes" rows="2" placeholder="Additional notes…"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                       transition-colors resize-none placeholder-[#CBD5E1]" />
            </div>

          </div>
        </FormCard>

        <!-- Section 2: Payment -->
        <FormCard :title="t('erp.receipts.paymentMethod')" :icon="BanknotesIcon" icon-color="green">
          <div class="grid grid-cols-2 gap-x-6 gap-y-5">

            <!-- Payment Method -->
            <div>
              <FieldLabel :text="t('erp.receipts.paymentMethod')" required />
              <select v-model="form.paymentMethod"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm bg-white text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors">
                <option value="">— Select —</option>
                <option v-for="m in paymentMethods" :key="m.id" :value="m.code || m.name">{{ m.name }}</option>
              </select>
            </div>

            <!-- Amount -->
            <div>
              <FieldLabel :text="t('erp.receipts.amountReceived')" required />
              <input v-model.number="form.amount" type="number" min="0.01" step="0.01" placeholder="0.00"
                :class="['w-full px-3.5 py-2.5 border text-sm text-right tabular-nums transition-colors',
                         'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                         errors.amount ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
              <p v-if="errors.amount" class="mt-1 text-xs text-red-500">{{ errors.amount }}</p>
            </div>

            <!-- Reference No. -->
            <div class="col-span-2">
              <FieldLabel :text="t('erp.receipts.referenceNo')" />
              <input v-model="form.reference" type="text" placeholder="Cheque no., transfer ref…"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                       transition-colors placeholder-[#CBD5E1]" />
            </div>

          </div>
        </FormCard>

        <ErrorBanner :message="globalError" />

        <!-- Summary + Actions -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  CheckIcon,
  ArrowPathIcon, UserIcon, BanknotesIcon, CalculatorIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import StatusPill from '@/components/form/StatusPill.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import CustomerChip from '@/components/form/CustomerChip.vue'
import DocFooterBar from '@/components/form/DocFooterBar.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'
import { useMasterDataStore } from '@/stores/masterData'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router           = useRouter()
const masterDataStore  = useMasterDataStore()
const customers        = ref([])
const invoices         = ref([])
const paymentMethods   = ref([])
const saving           = ref(false)
const globalError      = ref('')
const errors           = ref({})

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
    globalError.value = parseApiError(err, 'Failed to create receipt')
  } finally {
    saving.value = false
  }
}
</script>
