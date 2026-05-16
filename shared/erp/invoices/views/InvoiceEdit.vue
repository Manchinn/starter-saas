<template>
  <AppLayout>
    <div v-if="loading" class="flex items-center justify-center py-24">
      <ArrowPathIcon class="w-6 h-6 text-[#9BA7B0] animate-spin" />
    </div>

    <div v-else-if="loadError" class="bg-white rounded-2xl border border-red-200 p-8 text-center">
      <ExclamationCircleIcon class="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p class="text-sm text-red-600 font-semibold mb-1">{{ loadError }}</p>
      <RouterLink to="/erp/invoices" class="text-xs text-primary-500 hover:underline">{{ t('common.backToList') }}</RouterLink>
    </div>

    <div v-else class="space-y-6">

      <!-- Page Header -->
      <div class="flex items-start gap-4">
        <RouterLink :to="`/erp/invoices/${invoiceId}`"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white border border-transparent
                 hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5">
            <h1 class="text-xl font-bold text-[#1C2434]">{{ t('common.edit') }} · {{ invoiceNumber }}</h1>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                         bg-amber-50 text-amber-600 border border-amber-200">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              {{ t('erp.common.draft') }}
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/invoices" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">{{ t('erp.invoices.title') }}</RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <RouterLink :to="`/erp/invoices/${invoiceId}`" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">{{ invoiceNumber }}</RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ t('common.edit') }}</span>
          </nav>
        </div>
        <div class="flex items-center gap-2.5 flex-shrink-0">
          <RouterLink :to="`/erp/invoices/${invoiceId}`" class="btn-secondary">{{ t('common.cancel') }}</RouterLink>
          <button @click="save" :disabled="saving" class="btn-primary gap-2">
            <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
            <CheckIcon v-else class="w-4 h-4" />
            {{ saving ? t('erp.common.saving') : t('common.save') }}
          </button>
        </div>
      </div>

      <!-- Sections -->
      <div class="space-y-5">

        <!-- Section 1: Invoice Info -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <DocumentTextIcon class="w-4 h-4 text-primary-500" />
            </div>
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.invoices.info') }}</h2>
          </div>
          <div class="px-6 py-5">
            <div class="grid grid-cols-2 gap-x-6 gap-y-5">

              <div class="col-span-2 lg:col-span-1">
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.common.customer') }} <span class="text-red-500 normal-case font-normal">*</span>
                </label>
                <SearchSelect v-model="form.customerId" :options="customers" :invalid="!!errors.customerId" placeholder="— Select customer —">
                  <template #option="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                  <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                </SearchSelect>
                <p v-if="errors.customerId" class="mt-1 text-xs text-red-500">{{ errors.customerId }}</p>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.invoices.invoiceDate') }} <span class="text-red-500 normal-case font-normal">*</span>
                </label>
                <DateInput v-model="form.invoiceDate"
                  :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                           'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                           errors.invoiceDate ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
                <p v-if="errors.invoiceDate" class="mt-1 text-xs text-red-500">{{ errors.invoiceDate }}</p>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">{{ t('erp.invoices.dueDate') }}</label>
                <DateInput v-model="form.dueDate" class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">{{ t('erp.invoices.referenceOrder') }}</label>
                <SearchSelect v-model="form.orderId" :options="orders" label-key="orderNumber" placeholder="— None —" />
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">{{ t('erp.invoices.taxRate') }}</label>
                <div class="relative">
                  <input v-model.number="form.taxRate" type="number" min="0" max="100" step="0.01" placeholder="0"
                    class="w-full pl-3.5 pr-10 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9BA7B0] font-medium">%</span>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">{{ t('erp.common.currency') }}</label>
                <CurrencySelector v-model="form.currency" v-model:exchangeRate="form.exchangeRate" :as-of-date="form.invoiceDate" />
              </div>

              <div class="col-span-2">
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">{{ t('erp.common.notes') }}</label>
                <textarea v-model="form.notes" rows="2" placeholder="Internal notes or payment terms…"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors resize-none placeholder-[#CBD5E1]" />
              </div>

            </div>
          </div>
        </div>

        <!-- Section 2: Line Items -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <ClipboardDocumentListIcon class="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.common.items') }}</h2>
                <p v-if="form.items.length" class="text-[11px] text-[#9BA7B0]">{{ form.items.length }} item{{ form.items.length !== 1 ? 's' : '' }}</p>
              </div>
            </div>
            <button @click="addLine" type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-primary-500
                     bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.common.addItem') }}
            </button>
          </div>

          <div v-if="!form.items.length" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mb-4">
              <ClipboardDocumentListIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">{{ t('erp.common.noItems') }}</p>
            <p class="text-xs text-[#9BA7B0] mt-1 mb-4">{{ t('erp.invoices.noItemsHint') }}</p>
            <button @click="addLine" type="button"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-500
                     bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors">
              <PlusIcon class="w-4 h-4" />
              {{ t('erp.common.addFirstItem') }}
            </button>
            <p v-if="errors.items" class="mt-3 text-xs text-red-500">{{ errors.items }}</p>
          </div>

          <div v-else>
            <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]
                        text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider"
              style="grid-template-columns: 1.8rem 3fr 4fr 5rem 7rem 5.5rem 2rem">
              <div class="text-center">#</div>
              <div>{{ t('erp.invoices.colItem') }}</div>
              <div>{{ t('erp.invoices.colDescription') }}</div>
              <div class="text-right">{{ t('erp.common.qty') }}</div>
              <div class="text-right">{{ t('erp.invoices.colUnitPrice') }}</div>
              <div class="text-right">{{ t('erp.invoices.colAmount') }}</div>
              <div></div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <div v-for="(line, idx) in form.items" :key="idx"
                class="group grid items-center gap-3 px-5 py-3 hover:bg-[#F7F9FC] transition-colors"
                style="grid-template-columns: 1.8rem 3fr 4fr 5rem 7rem 5.5rem 2rem">

                <div class="text-xs font-semibold text-[#CBD5E1] text-center">{{ idx + 1 }}</div>

                <input v-model="line.productName" type="text" placeholder="Item name…"
                  class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors placeholder-[#CBD5E1]" />

                <input v-model="line.description" type="text" placeholder="Optional description…"
                  class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm text-[#637381]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors placeholder-[#CBD5E1]" />

                <input v-model.number="line.quantity" type="number" min="0.001" step="0.001"
                  class="w-full px-2 py-2 border border-[#E2E8F0] text-sm text-right text-[#1C2434] tabular-nums
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />

                <input v-model.number="line.unitPrice" type="number" min="0" step="0.01" placeholder="0.00"
                  class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm text-right text-[#1C2434] tabular-nums
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors placeholder-[#CBD5E1]" />

                <div class="text-sm font-semibold text-[#374151] tabular-nums text-right pr-1">
                  {{ fmtMoney((line.quantity || 0) * (line.unitPrice || 0)) }}
                </div>

                <button @click="removeLine(idx)" type="button"
                  class="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center
                         text-[#CBD5E1] hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                  <TrashIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div class="grid items-center gap-3 px-5 py-3.5 bg-[#F7F9FC] border-t border-[#E2E8F0]"
              style="grid-template-columns: 1.8rem 3fr 4fr 5rem 7rem 5.5rem 2rem">
              <div class="col-span-5 text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.invoices.subtotal') }}</div>
              <div class="text-sm font-bold text-[#1C2434] tabular-nums text-right">{{ fmtMoney(subtotal) }}</div>
              <div></div>
            </div>

            <p v-if="errors.items" class="px-5 py-2 text-xs text-red-500 bg-red-50 border-t border-red-100">
              {{ errors.items }}
            </p>
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
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.invoices.invoiceSummary') }}</h2>
          </div>

          <div class="px-6 py-4 grid grid-cols-3 gap-6">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.common.items') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">{{ form.items.length }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.invoices.subtotal') }}</span>
              <span class="text-sm font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(subtotal) }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.invoices.taxPct') }} ({{ form.taxRate || 0 }}%)</span>
              <span class="text-sm font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(taxAmount) }}</span>
            </div>
          </div>

          <div class="px-6 py-5 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('erp.invoices.total') }}</p>
              <p class="text-3xl font-extrabold text-primary-500 tabular-nums leading-none">{{ fmtMoney(grandTotal) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <RouterLink :to="`/erp/invoices/${invoiceId}`"
                class="px-5 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
                {{ t('common.cancel') }}
              </RouterLink>
              <button @click="save" :disabled="saving"
                class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold
                       bg-primary-500 text-white rounded-xl hover:bg-primary-600 shadow-sm
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
                <CheckIcon v-else class="w-4 h-4" />
                {{ saving ? t('erp.common.saving') : t('common.save') }}
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
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon,
  CheckIcon, ExclamationCircleIcon, DocumentTextIcon,
  ArrowPathIcon, ClipboardDocumentListIcon, CalculatorIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import CurrencySelector from '@/components/CurrencySelector.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'
import { fmtMoney, toFixed } from '@/utils/fmt'

const { t } = useI18n()
const route       = useRoute()
const router      = useRouter()
const invoiceId   = route.params.id
const customers   = ref([])
const orders      = ref([])
const loading     = ref(true)
const loadError   = ref('')
const saving      = ref(false)
const globalError = ref('')
const errors      = ref({})
const invoiceNumber = ref('')

const form = ref({
  customerId:   '',
  orderId:      '',
  invoiceDate:  '',
  dueDate:      '',
  taxRate:      0,
  currency:     '',
  exchangeRate: 1,
  notes:        '',
  items:        [],
})

onMounted(async () => {
  try {
    const [invoiceRes, customersRes, ordersRes] = await Promise.all([
      api.get(`/erp/invoices/${invoiceId}`),
      api.get('/erp/customers', { params: { limit: 200 } }),
      api.get('/erp/orders',    { params: { limit: 500, status: 'confirmed' } }),
    ])
    const inv = invoiceRes.data.data.invoice
    if (inv.status !== 'draft') {
      loadError.value = t('erp.invoices.onlyDraftEditable') || 'Only draft invoices can be edited'
      return
    }
    invoiceNumber.value = inv.invoiceNumber
    const sub = Number(inv.subtotal) || 0
    const tax = Number(inv.tax) || 0
    const taxRate = sub > 0 ? toFixed((tax / sub) * 100, 2) : 0
    form.value = {
      customerId:   inv.customerId   || '',
      orderId:      inv.orderId      || '',
      invoiceDate:  inv.invoiceDate  || '',
      dueDate:      inv.dueDate      || '',
      taxRate,
      currency:     inv.currency     || '',
      exchangeRate: Number(inv.exchangeRate) || 1,
      notes:        inv.notes        || '',
      items:        (inv.items || []).map(i => ({
        productName: i.productName || '',
        description: i.description || '',
        quantity:    Number(i.quantity)  || 0,
        unitPrice:   Number(i.unitPrice) || 0,
      })),
    }
    customers.value = customersRes.data.data.customers || []
    orders.value    = ordersRes.data.data.orders || []
  } catch (err) {
    loadError.value = err.response?.data?.message || err.message || 'Failed to load invoice'
  } finally {
    loading.value = false
  }
})

function addLine() {
  form.value.items.push({ productName: '', description: '', quantity: 1, unitPrice: 0 })
}

function removeLine(idx) {
  form.value.items.splice(idx, 1)
}

const subtotal   = computed(() => form.value.items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0))
const taxAmount  = computed(() => toFixed(subtotal.value * ((form.value.taxRate || 0) / 100), 2))
const grandTotal = computed(() => subtotal.value + taxAmount.value)

function validate() {
  const e = {}
  if (!form.value.customerId)  e.customerId  = t('erp.invoices.customerRequired')
  if (!form.value.invoiceDate) e.invoiceDate = t('erp.invoices.dateRequired')
  if (!form.value.items.length) e.items = t('erp.invoices.itemsRequired')
  for (const item of form.value.items) {
    if (!item.productName?.trim()) { e.items = 'All items need a name'; break }
    if (!item.quantity || item.quantity <= 0) { e.items = t('erp.invoices.itemQtyInvalid'); break }
  }
  errors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  globalError.value = ''
  if (!validate()) return
  saving.value = true
  try {
    const payload = { ...form.value, orderId: form.value.orderId || null }
    await api.put(`/erp/invoices/${invoiceId}`, payload)
    router.push(`/erp/invoices/${invoiceId}`)
  } catch (err) {
    const d = err.response?.data
    globalError.value = d?.errors?.map(e => e.message).join(', ') || d?.message || 'Failed to update invoice'
  } finally {
    saving.value = false
  }
}
</script>
