<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Page Header -->
      <div class="flex items-start gap-4">
        <RouterLink to="/erp/quotations"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white border border-transparent
                 hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5">
            <h1 class="text-xl font-bold text-[#1C2434]">{{ t('erp.quotations.new') }}</h1>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                         bg-amber-50 text-amber-600 border border-amber-200">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              {{ t('erp.quotations.draft') }}
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/quotations" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.quotations.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ t('erp.quotations.create') }}</span>
          </nav>
        </div>
        <div class="flex items-center gap-2.5 flex-shrink-0">
          <RouterLink to="/erp/quotations" class="btn-secondary">{{ t('common.cancel') }}</RouterLink>
          <button @click="save" :disabled="saving" class="btn-primary gap-2">
            <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
            <CheckIcon v-else class="w-4 h-4" />
            {{ saving ? t('erp.common.creating') : t('erp.quotations.create') }}
          </button>
        </div>
      </div>

      <!-- Sections -->
      <div class="space-y-5">

        <!-- Section 1: Quotation Info -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <UserIcon class="w-4 h-4 text-primary-500" />
            </div>
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.quotations.quotationInfo') }}</h2>
          </div>
          <div class="px-6 py-5">
            <div class="grid grid-cols-2 gap-x-6 gap-y-5">

              <!-- Customer (optional) -->
              <div class="col-span-2 lg:col-span-1">
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.quotations.customer') }}
                </label>
                <select v-model="form.customerId"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm bg-white text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors">
                  <option value="">— {{ t('erp.quotations.noCustomer') }} —</option>
                  <option v-for="c in customers" :key="c.id" :value="c.id">
                    {{ c.name }}{{ c.company ? ` · ${c.company}` : '' }}
                  </option>
                </select>

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
                  <span v-if="selectedCustomer.group"
                    class="ml-auto flex-shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full
                           bg-white border border-primary-200 text-primary-500">
                    {{ selectedCustomer.group.name }}
                  </span>
                </div>
              </div>

              <!-- Quotation Date -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.quotations.quotationDate') }} <span class="text-red-500 normal-case font-normal">*</span>
                </label>
                <DateInput v-model="form.quotationDate"
                  :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                           'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                           errors.quotationDate ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
                <p v-if="errors.quotationDate" class="mt-1 text-xs text-red-500">{{ errors.quotationDate }}</p>
              </div>

              <!-- Valid Until -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.quotations.validUntil') }}
                </label>
                <DateInput v-model="form.validUntil" class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
              </div>

              <!-- Tax Rate -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.quotations.taxRate') }}
                </label>
                <div class="relative">
                  <input v-model.number="form.taxRate" type="number" min="0" max="100" step="0.01" placeholder="0"
                    class="w-full pl-3.5 pr-10 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9BA7B0] font-medium">%</span>
                </div>
              </div>

              <!-- Notes -->
              <div class="col-span-2">
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.quotations.notes') }}
                </label>
                <textarea v-model="form.notes" rows="2" :placeholder="t('erp.quotations.notes')"
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
                <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.quotations.items') }}</h2>
                <p v-if="form.items.length" class="text-[11px] text-[#9BA7B0]">
                  {{ form.items.length }} item{{ form.items.length !== 1 ? 's' : '' }}
                </p>
              </div>
            </div>
            <button @click="addLine" type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-primary-500
                     bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.quotations.addItem') }}
            </button>
          </div>

          <!-- Empty state -->
          <div v-if="!form.items.length" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mb-4">
              <ClipboardDocumentListIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">{{ t('erp.quotations.noItems') }}</p>
            <p class="text-xs text-[#9BA7B0] mt-1 mb-4">{{ t('erp.quotations.addItemsDesc') }}</p>
            <button @click="addLine" type="button"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-500
                     bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors">
              <PlusIcon class="w-4 h-4" />
              {{ t('erp.quotations.addItem') }}
            </button>
            <p v-if="errors.items" class="mt-3 text-xs text-red-500">{{ errors.items }}</p>
          </div>

          <!-- Items table -->
          <div v-else>
            <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]
                        text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider"
              style="grid-template-columns: 1.8rem 2.5fr 1.5fr 5rem 7rem 5rem 5.5rem 2rem">
              <div class="text-center">#</div>
              <div>{{ t('erp.quotations.colProductName') }}</div>
              <div>{{ t('erp.quotations.saleItem') }}</div>
              <div class="text-right">{{ t('erp.quotations.colQty') }}</div>
              <div class="text-right">{{ t('erp.quotations.colUnitPrice') }}</div>
              <div class="text-right">{{ t('erp.quotations.colDiscount') }}</div>
              <div class="text-right">{{ t('erp.quotations.colTotal') }}</div>
              <div></div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <div v-for="(line, idx) in form.items" :key="idx"
                class="group grid items-center gap-3 px-5 py-3 hover:bg-[#F7F9FC] transition-colors"
                style="grid-template-columns: 1.8rem 2.5fr 1.5fr 5rem 7rem 5rem 5.5rem 2rem">

                <div class="text-xs font-semibold text-[#CBD5E1] text-center">{{ idx + 1 }}</div>

                <input v-model="line.productName" type="text" :placeholder="t('erp.quotations.productNamePh')"
                  class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors placeholder-[#CBD5E1]" />

                <select v-model="line.saleItemId" @change="onSaleItemChange(line)"
                  class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm bg-white text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors">
                  <option value="">—</option>
                  <option v-for="si in saleItems" :key="si.id" :value="si.id">{{ si.name }}</option>
                </select>

                <input v-model.number="line.qty" type="number" min="0.001" step="any" @input="calcLine(line)"
                  class="w-full px-2 py-2 border border-[#E2E8F0] text-sm text-right text-[#1C2434] tabular-nums
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />

                <input v-model.number="line.unitPrice" type="number" min="0" step="any" placeholder="0.00" @input="calcLine(line)"
                  class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm text-right text-[#1C2434] tabular-nums
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors placeholder-[#CBD5E1]" />

                <div class="relative">
                  <input v-model.number="line.discount" type="number" min="0" max="100" step="any" placeholder="0" @input="calcLine(line)"
                    class="w-full pl-2 pr-6 py-2 border border-[#E2E8F0] text-sm text-right text-[#1C2434] tabular-nums
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#9BA7B0]">%</span>
                </div>

                <div class="text-sm font-semibold text-[#374151] tabular-nums text-right pr-1">
                  {{ fmtMoney(line.total) }}
                </div>

                <button @click="removeLine(idx)" type="button"
                  class="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center
                         text-[#CBD5E1] hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                  <TrashIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div class="grid items-center gap-3 px-5 py-3.5 bg-[#F7F9FC] border-t border-[#E2E8F0]"
              style="grid-template-columns: 1.8rem 2.5fr 1.5fr 5rem 7rem 5rem 5.5rem 2rem">
              <div class="col-span-6 text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">
                {{ t('erp.quotations.subtotal') }}
              </div>
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
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.quotations.summary') }}</h2>
          </div>

          <div class="px-6 py-4 grid grid-cols-3 gap-6">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.quotations.items') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">{{ form.items.length }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.quotations.subtotal') }}</span>
              <span class="text-sm font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(subtotal) }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">
                {{ t('erp.quotations.tax') }} ({{ form.taxRate || 0 }}%)
              </span>
              <span class="text-sm font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(taxAmount) }}</span>
            </div>
          </div>

          <div class="px-6 py-5 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('erp.quotations.total') }}</p>
              <p class="text-3xl font-extrabold text-primary-500 tabular-nums leading-none">{{ fmtMoney(grandTotal) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <RouterLink to="/erp/quotations"
                class="px-5 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
                {{ t('common.cancel') }}
              </RouterLink>
              <button @click="save" :disabled="saving"
                class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold
                       bg-primary-500 text-white rounded-xl hover:bg-primary-600 shadow-sm
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
                <CheckIcon v-else class="w-4 h-4" />
                {{ saving ? t('erp.common.creating') : t('erp.quotations.create') }}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon,
  CheckIcon, ExclamationCircleIcon,
  ArrowPathIcon, UserIcon, ClipboardDocumentListIcon,
  CalculatorIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney, toFixed } from '@/utils/fmt'

const { t } = useI18n()
const router      = useRouter()
const customers   = ref([])
const saleItems   = ref([])
const globalError = ref('')
const saving      = ref(false)
const errors      = ref({})

const today = new Date().toISOString().slice(0, 10)
const form  = ref({
  customerId:    '',
  quotationDate: today,
  validUntil:    '',
  taxRate:       0,
  notes:         '',
  items:         [],
})

const selectedCustomer = computed(() =>
  form.value.customerId ? customers.value.find(c => c.id === form.value.customerId) : null
)

onMounted(async () => {
  const [customersRes, saleItemsRes] = await Promise.allSettled([
    api.get('/erp/customers',  { params: { limit: 500 } }),
    api.get('/erp/sale-items', { params: { limit: 500, status: 'active' } }),
  ])
  if (customersRes.status === 'fulfilled') customers.value = customersRes.value.data.data.customers || []
  if (saleItemsRes.status === 'fulfilled') saleItems.value = saleItemsRes.value.data.data.items    || []
})

function addLine() {
  form.value.items.push({ saleItemId: '', productName: '', qty: 1, unitPrice: 0, discount: 0, total: 0 })
}

function removeLine(idx) {
  form.value.items.splice(idx, 1)
}

function calcLine(line) {
  const disc = parseFloat(line.discount || 0)
  line.total = parseFloat(
    (parseFloat(line.qty || 0) * parseFloat(line.unitPrice || 0) * (1 - disc / 100)).toFixed(2)
  )
}

function getBestPricing(si, customerGroupId) {
  const pricings = si.pricings || []
  if (!pricings.length) return null
  if (customerGroupId) {
    const match = pricings.find(p => p.customerGroupId === customerGroupId)
    if (match) return match
  }
  return pricings.find(p => !p.customerGroupId) || pricings[0]
}

function applyPricing(line) {
  if (!line.saleItemId) return
  const si = saleItems.value.find(s => s.id === line.saleItemId)
  if (!si) return
  const customer = customers.value.find(c => c.id === form.value.customerId)
  const pricing  = getBestPricing(si, customer?.customerGroupId)
  if (pricing) { line.unitPrice = Number(pricing.unitPrice); calcLine(line) }
}

function onSaleItemChange(line) {
  const si = saleItems.value.find(s => s.id === line.saleItemId)
  if (!si) { line.unitPrice = 0; calcLine(line); return }
  if (!line.productName) line.productName = si.name
  applyPricing(line)
}

watch(() => form.value.customerId, () => {
  for (const line of form.value.items) applyPricing(line)
})

const subtotal   = computed(() => form.value.items.reduce((s, i) => s + parseFloat(i.total || 0), 0))
const taxAmount  = computed(() => toFixed(subtotal.value * ((form.value.taxRate || 0) / 100), 2))
const grandTotal = computed(() => subtotal.value + taxAmount.value)

function validate() {
  const e = {}
  if (!form.value.quotationDate) e.quotationDate = 'Quotation date is required'
  if (!form.value.items.length)  e.items = 'Add at least one item'
  for (const item of form.value.items) {
    if (!item.productName?.trim()) { e.items = 'All items need a description'; break }
    if (!item.qty || item.qty <= 0) { e.items = 'All items need a valid quantity'; break }
  }
  errors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  globalError.value = ''
  if (!validate()) return
  saving.value = true
  try {
    const { data } = await api.post('/erp/quotations', {
      customerId:    form.value.customerId    || null,
      quotationDate: form.value.quotationDate,
      validUntil:    form.value.validUntil    || null,
      taxRate:       form.value.taxRate,
      notes:         form.value.notes,
      items: form.value.items.map(({ saleItemId, productName, qty, unitPrice, discount }) => ({
        saleItemId: saleItemId || null,
        productName, qty, unitPrice, discount,
      })),
    })
    router.push(`/erp/quotations/${data.data.quotation.id}`)
  } catch (err) {
    const d = err.response?.data
    globalError.value = d?.errors?.map(e => e.message).join(', ') || d?.message || 'Failed to create quotation'
  } finally {
    saving.value = false
  }
}
</script>
