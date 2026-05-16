<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Page Header -->
      <div class="flex items-start gap-4">
        <RouterLink to="/erp/receipts"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white border border-transparent
                 hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5">
            <h1 class="text-xl font-bold text-[#1C2434]">{{ t('erp.receipts.new') }}</h1>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                         bg-amber-50 text-amber-600 border border-amber-200">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              {{ t('erp.common.draft') }}
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/receipts" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">{{ t('erp.receipts.title') }}</RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ t('common.create') }}</span>
          </nav>
        </div>
        <div class="flex items-center gap-2.5 flex-shrink-0">
          <RouterLink to="/erp/receipts" class="btn-secondary">{{ t('common.cancel') }}</RouterLink>
          <button @click="save" :disabled="saving" class="btn-primary gap-2">
            <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
            <CheckIcon v-else class="w-4 h-4" />
            {{ saving ? t('erp.common.creating') : t('erp.receipts.create') }}
          </button>
        </div>
      </div>

      <!-- Vertical single-column layout -->
      <div class="space-y-5">

        <!-- Section 1: Customer & Receipt Info -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <UserIcon class="w-4 h-4 text-primary-500" />
            </div>
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.receipts.info') }}</h2>
          </div>
          <div class="px-6 py-5">
            <div class="grid grid-cols-2 gap-x-6 gap-y-5">

              <!-- Customer -->
              <div class="col-span-2">
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.common.customer') }} <span class="text-red-500 normal-case font-normal">*</span>
                </label>
                <SearchSelect v-model="form.customerId" :options="customers" :invalid="!!errors.customerId" placeholder="— Select customer —">
                  <template #option="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                  <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                </SearchSelect>
                <p v-if="errors.customerId" class="mt-1 text-xs text-red-500">{{ errors.customerId }}</p>

                <!-- Customer chip -->
                <div v-if="selectedCustomer"
                  class="mt-2.5 flex items-center gap-2.5 px-3 py-2 bg-primary-50 rounded-xl border border-primary-100">
                  <div class="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                    <span class="text-xs font-bold text-white uppercase">{{ selectedCustomer.name?.charAt(0) }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-primary-800 truncate">{{ selectedCustomer.name }}</p>
                    <p v-if="selectedCustomer.company" class="text-xs text-primary-500 truncate">{{ selectedCustomer.company }}</p>
                  </div>
                </div>
              </div>

              <!-- Receipt Date -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.receipts.receiptDate') }} <span class="text-red-500 normal-case font-normal">*</span>
                </label>
                <DateInput v-model="form.receiptDate"
                  :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                           'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                           errors.receiptDate ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
                <p v-if="errors.receiptDate" class="mt-1 text-xs text-red-500">{{ errors.receiptDate }}</p>
              </div>

              <!-- Reference Invoice -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">{{ t('erp.receipts.referenceInvoice') }}</label>
                <SearchSelect v-model="form.invoiceId" :options="invoices" label-key="invoiceNumber" placeholder="— None —">
                  <template #option="{ option }">{{ option.invoiceNumber }} · {{ fmtMoney(option.total) }}</template>
                  <template #singleLabel="{ option }">{{ option.invoiceNumber }} · {{ fmtMoney(option.total) }}</template>
                </SearchSelect>
              </div>

              <!-- Notes -->
              <div class="col-span-2">
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">{{ t('erp.common.notes') }}</label>
                <textarea v-model="form.notes" rows="2" placeholder="Additional notes…"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors resize-none placeholder-[#CBD5E1]" />
              </div>

            </div>
          </div>
        </div>

        <!-- Section 2: Payment -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <BanknotesIcon class="w-4 h-4 text-green-600" />
            </div>
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.receipts.paymentMethod') }}</h2>
          </div>
          <div class="px-6 py-5">
            <div class="grid grid-cols-2 gap-x-6 gap-y-5">

              <!-- Payment Method -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.receipts.paymentMethod') }} <span class="text-red-500 normal-case font-normal">*</span>
                </label>
                <select v-model="form.paymentMethod"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm bg-white text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors">
                  <option value="">— Select —</option>
                  <option v-for="m in paymentMethods" :key="m.id" :value="m.code || m.name">{{ m.name }}</option>
                </select>
              </div>

              <!-- Amount -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.receipts.amountReceived') }} <span class="text-red-500 normal-case font-normal">*</span>
                </label>
                <input v-model.number="form.amount" type="number" min="0.01" step="0.01" placeholder="0.00"
                  :class="['w-full px-3.5 py-2.5 border text-sm text-right tabular-nums transition-colors',
                           'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                           errors.amount ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
                <p v-if="errors.amount" class="mt-1 text-xs text-red-500">{{ errors.amount }}</p>
              </div>

              <!-- Reference No. -->
              <div class="col-span-2">
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.receipts.referenceNo') }}
                </label>
                <input v-model="form.reference" type="text" placeholder="Cheque no., transfer ref…"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors placeholder-[#CBD5E1]" />
              </div>

            </div>
          </div>
        </div>

        <!-- Global error -->
        <div v-if="globalError"
          class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700
                 text-sm px-4 py-3.5 rounded-xl">
          <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{{ globalError }}</span>
        </div>

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

          <div class="px-6 py-5 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('erp.receipts.amountReceived') }}</p>
              <p class="text-3xl font-extrabold text-primary-500 tabular-nums">{{ fmtMoney(form.amount || 0) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <RouterLink to="/erp/receipts"
                class="px-5 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
                {{ t('common.discard') }}
              </RouterLink>
              <button @click="save" :disabled="saving"
                class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold
                       bg-primary-500 text-white rounded-xl hover:bg-primary-600 shadow-sm
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
                <CheckIcon v-else class="w-4 h-4" />
                {{ saving ? t('erp.common.creating') : t('erp.receipts.create') }}
              </button>
            </div>
          </div>
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
  ArrowLeftIcon, ChevronRightIcon, CheckIcon, ExclamationCircleIcon,
  ArrowPathIcon, UserIcon, BanknotesIcon, CalculatorIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'
import { useMasterDataStore } from '@/stores/masterData'

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
    const d = err.response?.data
    globalError.value = d?.errors?.map(e => e.message).join(', ') || d?.message || 'Failed to create receipt'
  } finally {
    saving.value = false
  }
}
</script>
