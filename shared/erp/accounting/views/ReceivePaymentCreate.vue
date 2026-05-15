<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-start gap-4">
        <RouterLink to="/erp/billing/receive-payments"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white border border-transparent
                 hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5">
            <h1 class="text-xl font-bold text-[#1C2434]">Receive Payment</h1>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                         bg-amber-50 text-amber-600 border border-amber-200">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Draft
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/billing/receive-payments" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">Receive Payments</RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">Create</span>
          </nav>
        </div>
        <div class="flex items-center gap-2.5 flex-shrink-0">
          <RouterLink to="/erp/billing/receive-payments" class="btn-secondary">Cancel</RouterLink>
          <button @click="save" :disabled="saving" class="btn-primary gap-2">
            <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
            <CheckIcon v-else class="w-4 h-4" />
            {{ saving ? 'Creating…' : 'Create Payment' }}
          </button>
        </div>
      </div>

      <div class="space-y-5">

        <!-- Section 1: Payment Info -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <BanknotesIcon class="w-4 h-4 text-green-600" />
            </div>
            <h2 class="text-sm font-semibold text-[#1C2434]">Payment Information</h2>
          </div>
          <div class="px-6 py-5">
            <div class="grid grid-cols-2 gap-x-6 gap-y-5">

              <!-- Customer -->
              <div class="col-span-2 lg:col-span-1">
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  Customer <span class="text-red-500 normal-case font-normal">*</span>
                </label>
                <select v-model="form.customerId" @change="onCustomerChange"
                  :class="['w-full px-3.5 py-2.5 border text-sm bg-white transition-colors',
                           'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                           errors.customerId ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']">
                  <option value="">— Select customer —</option>
                  <option v-for="c in customers" :key="c.id" :value="c.id">
                    {{ c.name }}{{ c.company ? ` · ${c.company}` : '' }}
                  </option>
                </select>
                <p v-if="errors.customerId" class="mt-1 text-xs text-red-500">{{ errors.customerId }}</p>
              </div>

              <!-- Date -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  Date <span class="text-red-500 normal-case font-normal">*</span>
                </label>
                <input v-model="form.date" type="date"
                  :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                           'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                           errors.date ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
                <p v-if="errors.date" class="mt-1 text-xs text-red-500">{{ errors.date }}</p>
              </div>

              <!-- Payment Method -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  Payment Method <span class="text-red-500 normal-case font-normal">*</span>
                </label>
                <select v-model="form.paymentMethod"
                  :class="['w-full px-3.5 py-2.5 border text-sm bg-white transition-colors',
                           'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                           errors.paymentMethod ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']">
                  <option value="">— Select —</option>
                  <option v-for="m in paymentMethods" :key="m.id" :value="m.name">{{ m.name }}</option>
                </select>
                <p v-if="errors.paymentMethod" class="mt-1 text-xs text-red-500">{{ errors.paymentMethod }}</p>
              </div>

              <!-- Reference -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  Reference <span class="text-[#9BA7B0] normal-case font-normal text-[10px]">(cheque #, transfer ref…)</span>
                </label>
                <input v-model="form.reference" type="text" placeholder="Optional reference number"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
              </div>

              <!-- Notes -->
              <div class="col-span-2">
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">Notes</label>
                <textarea v-model="form.notes" rows="2" placeholder="Remarks…"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors resize-none placeholder-[#CBD5E1]" />
              </div>

            </div>
          </div>
        </div>

        <!-- Section 2: Select Invoices -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <ClipboardDocumentListIcon class="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 class="text-sm font-semibold text-[#1C2434]">Outstanding Invoices</h2>
              <p v-if="form.invoiceIds.length" class="text-[11px] text-[#9BA7B0]">
                {{ form.invoiceIds.length }} selected
              </p>
            </div>
          </div>

          <!-- No customer -->
          <div v-if="!form.customerId" class="flex flex-col items-center justify-center py-14 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mb-4">
              <UserIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">Select a customer first</p>
            <p class="text-xs text-[#9BA7B0] mt-1">Outstanding invoices will appear here</p>
          </div>

          <!-- Loading -->
          <div v-else-if="loadingInvoices" class="flex items-center justify-center py-14">
            <div class="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <!-- No invoices -->
          <div v-else-if="!availableInvoices.length" class="flex flex-col items-center justify-center py-14 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mb-4">
              <ClipboardDocumentListIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">No outstanding invoices</p>
            <p class="text-xs text-[#9BA7B0] mt-1">This customer has no unpaid invoices</p>
            <p v-if="errors.invoiceIds" class="mt-3 text-xs text-red-500">{{ errors.invoiceIds }}</p>
          </div>

          <!-- Invoice table -->
          <div v-else>
            <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]
                        text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider"
              style="grid-template-columns: 2rem 1fr 6rem 6rem 7rem 5rem">
              <div class="flex items-center justify-center">
                <input type="checkbox" :checked="allSelected" @change="toggleAll"
                  class="w-4 h-4 rounded border-[#CBD5E1] text-primary-500 focus:ring-primary-400 cursor-pointer" />
              </div>
              <div>Invoice #</div>
              <div>Date</div>
              <div>Due Date</div>
              <div class="text-right">Total</div>
              <div>Status</div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <div v-for="inv in availableInvoices" :key="inv.id"
                @click="toggleInvoice(inv.id)"
                :class="['grid items-center gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-[#F7F9FC]',
                         form.invoiceIds.includes(inv.id) ? 'bg-primary-50/40' : '']"
                style="grid-template-columns: 2rem 1fr 6rem 6rem 7rem 5rem">
                <div class="flex items-center justify-center">
                  <input type="checkbox" :checked="form.invoiceIds.includes(inv.id)"
                    @click.stop="toggleInvoice(inv.id)"
                    class="w-4 h-4 rounded border-[#CBD5E1] text-primary-500 focus:ring-primary-400 cursor-pointer" />
                </div>
                <span class="font-mono text-sm font-medium text-[#1C2434]">{{ inv.invoiceNumber }}</span>
                <span class="text-xs text-[#637381]">{{ inv.invoiceDate }}</span>
                <span class="text-xs text-[#637381]">{{ inv.dueDate || '—' }}</span>
                <span class="text-sm font-semibold text-[#1C2434] tabular-nums text-right">{{ fmtMoney(inv.total) }}</span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize
                             bg-blue-50 text-blue-700">{{ inv.status }}</span>
              </div>
            </div>

            <p v-if="errors.invoiceIds" class="px-5 py-2 text-xs text-red-500 bg-red-50 border-t border-red-100">
              {{ errors.invoiceIds }}
            </p>
          </div>
        </div>

        <!-- Global error -->
        <div v-if="globalError"
          class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl">
          <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{{ globalError }}</span>
        </div>

        <!-- Summary -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5">
            <CalculatorIcon class="w-4 h-4 text-[#9BA7B0]" />
            <h2 class="text-sm font-semibold text-[#1C2434]">Summary</h2>
          </div>
          <div class="px-6 py-4 grid grid-cols-3 gap-6">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Customer</span>
              <span class="text-sm font-semibold text-[#1C2434]">
                {{ customers.find(c => c.id === form.customerId)?.name || '—' }}
              </span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Invoices</span>
              <span class="text-sm font-semibold text-[#1C2434]">{{ form.invoiceIds.length }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Method</span>
              <span class="text-sm font-semibold text-[#1C2434]">{{ form.paymentMethod || '—' }}</span>
            </div>
          </div>
          <div class="px-6 py-5 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">Total Payment</p>
              <p class="text-3xl font-extrabold text-green-600 tabular-nums leading-none">{{ fmtMoney(grandTotal) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <RouterLink to="/erp/billing/receive-payments"
                class="px-5 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
                Discard
              </RouterLink>
              <button @click="save" :disabled="saving"
                class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold
                       bg-primary-500 text-white rounded-xl hover:bg-primary-600 shadow-sm
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
                <CheckIcon v-else class="w-4 h-4" />
                {{ saving ? 'Creating…' : 'Create Payment' }}
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
import {
  ArrowLeftIcon, ChevronRightIcon, CheckIcon, ExclamationCircleIcon,
  BanknotesIcon, ArrowPathIcon, ClipboardDocumentListIcon, CalculatorIcon, UserIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const router            = useRouter()
const customers         = ref([])
const paymentMethods    = ref([])
const availableInvoices = ref([])
const loadingInvoices   = ref(false)
const saving            = ref(false)
const globalError       = ref('')
const errors            = ref({})

const today = new Date().toISOString().slice(0, 10)
const form  = ref({
  customerId:    '',
  date:          today,
  paymentMethod: '',
  reference:     '',
  notes:         '',
  invoiceIds:    [],
})

onMounted(async () => {
  const [custRes, pmRes] = await Promise.all([
    api.get('/erp/customers', { params: { limit: 200 } }),
    api.get('/erp/master-data/by-name/Payment Methods'),
  ])
  customers.value      = custRes.data.data.customers
  paymentMethods.value = pmRes.data.data.values
  if (paymentMethods.value.length) form.value.paymentMethod = paymentMethods.value[0].name
})

async function onCustomerChange() {
  form.value.invoiceIds = []
  availableInvoices.value = []
  if (!form.value.customerId) return
  loadingInvoices.value = true
  try {
    const { data } = await api.get('/erp/billing/receive-payments/available-invoices', {
      params: { customerId: form.value.customerId },
    })
    availableInvoices.value = data.data.invoices
  } finally {
    loadingInvoices.value = false
  }
}

function toggleInvoice(id) {
  const idx = form.value.invoiceIds.indexOf(id)
  if (idx === -1) form.value.invoiceIds.push(id)
  else form.value.invoiceIds.splice(idx, 1)
}

const allSelected = computed(() =>
  availableInvoices.value.length > 0 &&
  availableInvoices.value.every(inv => form.value.invoiceIds.includes(inv.id))
)
function toggleAll() {
  if (allSelected.value) form.value.invoiceIds = []
  else form.value.invoiceIds = availableInvoices.value.map(inv => inv.id)
}

const grandTotal = computed(() =>
  availableInvoices.value
    .filter(inv => form.value.invoiceIds.includes(inv.id))
    .reduce((s, inv) => s + Number(inv.total), 0)
)

function validate() {
  const e = {}
  if (!form.value.customerId)         e.customerId    = 'Customer is required'
  if (!form.value.date)               e.date          = 'Date is required'
  if (!form.value.paymentMethod)      e.paymentMethod = 'Payment method is required'
  if (!form.value.invoiceIds.length)  e.invoiceIds    = 'Select at least one invoice'
  errors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  globalError.value = ''
  if (!validate()) return
  saving.value = true
  try {
    const { data } = await api.post('/erp/billing/receive-payments', {
      customerId:    form.value.customerId,
      date:          form.value.date,
      paymentMethod: form.value.paymentMethod,
      reference:     form.value.reference || undefined,
      notes:         form.value.notes     || undefined,
      invoiceIds:    form.value.invoiceIds,
    })
    router.push(`/erp/billing/receive-payments/${data.data.receivePayment.id}`)
  } catch (err) {
    const d = err.response?.data
    globalError.value = d?.errors?.map(e => e.message).join(', ') || d?.message || 'Failed to create payment'
  } finally {
    saving.value = false
  }
}
</script>
