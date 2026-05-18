<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.quotations.new')" back-to="/erp/quotations"
        :breadcrumb="[
          { label: t('erp.quotations.title'), to: '/erp/quotations' },
          { label: t('erp.quotations.create') },
        ]">
        <template #badge>
          <StatusPill :label="t('erp.quotations.draft')" />
        </template>
        <template #actions>
          <HeaderSaveActions
            cancel-to="/erp/quotations"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.quotations.create')"
            @save="save"
          />
        </template>
      </PageHeader>

      <!-- Sections -->
      <div class="space-y-5">

        <!-- Section 1: Quotation Info -->
        <FormCard :title="t('erp.quotations.quotationInfo')" :icon="UserIcon" icon-color="primary">
          <div class="grid grid-cols-2 gap-x-6 gap-y-5">

              <!-- Customer (optional) -->
              <div class="col-span-2 lg:col-span-1">
                <FieldLabel :text="t('erp.quotations.customer')" />
                <SearchSelect v-model="form.customerId" :options="customers" :placeholder="`— ${t('erp.quotations.noCustomer')} —`">
                  <template #option="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                  <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                </SearchSelect>

                <CustomerChip :customer="selectedCustomer" />
              </div>

              <!-- Quotation Date -->
              <div>
                <FieldLabel :text="t('erp.quotations.quotationDate')" required />
                <DateInput v-model="form.quotationDate"
                  :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                           'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                           errors.quotationDate ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
                <p v-if="errors.quotationDate" class="mt-1 text-xs text-red-500">{{ errors.quotationDate }}</p>
              </div>

              <!-- Valid Until -->
              <div>
                <FieldLabel :text="t('erp.quotations.validUntil')" />
                <DateInput v-model="form.validUntil" class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
              </div>

              <!-- Tax Rate -->
              <div>
                <FieldLabel :text="t('erp.quotations.taxRate')" />
                <div class="relative">
                  <input v-model.number="form.taxRate" type="number" min="0" max="100" step="0.01" placeholder="0"
                    class="w-full pl-3.5 pr-10 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9BA7B0] font-medium">%</span>
                </div>
              </div>

              <!-- Currency -->
              <div>
                <FieldLabel :text="t('erp.common.currency')" />
                <CurrencySelector v-model="form.currency" v-model:exchangeRate="form.exchangeRate" :as-of-date="form.quotationDate" />
              </div>

              <!-- Notes -->
              <div class="col-span-2">
                <FieldLabel :text="t('erp.quotations.notes')" />
                <textarea v-model="form.notes" rows="2" :placeholder="t('erp.quotations.notes')"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors resize-none placeholder-[#CBD5E1]" />
              </div>

          </div>
        </FormCard>

        <!-- Section 2: Line Items -->
        <FormCard :title="t('erp.quotations.items')" :icon="ClipboardDocumentListIcon" icon-color="green"
          :subtitle="form.items.length ? `${form.items.length} item${form.items.length !== 1 ? 's' : ''}` : ''"
          :padded="false">
          <template #actions>
            <button @click="addLine" type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-primary-500
                     bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.quotations.addItem') }}
            </button>
          </template>

          <EmptyState v-if="!form.items.length"
            :icon="ClipboardDocumentListIcon"
            :title="t('erp.quotations.noItems')"
            :subtitle="t('erp.quotations.addItemsDesc')"
            :action-label="t('erp.quotations.addItem')"
            :error-message="errors.items"
            @action="addLine" />

          <!-- Items table -->
          <div v-else>
            <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]
                        text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider"
              style="grid-template-columns: 1.8rem 2.5fr 2fr 5rem 7rem 5rem 5.5rem 2rem">
              <div class="text-center">#</div>
              <div>{{ t('erp.quotations.saleItem') }}</div>
              <div>{{ t('erp.quotations.colProductName') }}</div>
              <div class="text-right">{{ t('erp.quotations.colQty') }}</div>
              <div class="text-right">{{ t('erp.quotations.colUnitPrice') }}</div>
              <div class="text-right">{{ t('erp.quotations.colDiscount') }}</div>
              <div class="text-right">{{ t('erp.quotations.colTotal') }}</div>
              <div></div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <div v-for="(line, idx) in form.items" :key="idx"
                class="group grid items-center gap-3 px-5 py-3 hover:bg-[#F7F9FC] transition-colors"
                style="grid-template-columns: 1.8rem 2.5fr 2fr 5rem 7rem 5rem 5.5rem 2rem">

                <div class="text-xs font-semibold text-[#CBD5E1] text-center">{{ idx + 1 }}</div>

                <SearchSelect v-model="line.saleItemId" :options="availableItemsFor(line)" placeholder="— Item —" @change="onSaleItemChange(line)">
                  <template #option="{ option }">
                    <span class="font-medium">{{ option.name }}</span>
                    <span v-if="option.code" class="text-[#9BA7B0] font-mono text-xs ml-2">{{ option.code }}</span>
                  </template>
                </SearchSelect>

                <input v-model="line.productName" type="text" :placeholder="t('erp.quotations.productNamePh')"
                  class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors placeholder-[#CBD5E1]" />

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
              style="grid-template-columns: 1.8rem 2.5fr 2fr 5rem 7rem 5rem 5.5rem 2rem">
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
        </FormCard>

        <ErrorBanner :message="globalError" />

        <!-- Summary + Actions -->
        <FormCard :title="t('erp.quotations.summary')" :icon="CalculatorIcon" icon-color="slate" :padded="false">
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

          <DocFooterBar
            :total-label="t('erp.quotations.total')"
            :total="fmtMoney(grandTotal)"
            discard-to="/erp/quotations"
            :discard-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.quotations.create')"
            @save="save"
          />
        </FormCard>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  PlusIcon, TrashIcon,
  UserIcon, ClipboardDocumentListIcon,
  CalculatorIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import CurrencySelector from '@/components/CurrencySelector.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import StatusPill from '@/components/form/StatusPill.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import CustomerChip from '@/components/form/CustomerChip.vue'
import EmptyState from '@/components/form/EmptyState.vue'
import DocFooterBar from '@/components/form/DocFooterBar.vue'
import api from '@/api'
import { fmtMoney, toFixed } from '@/utils/fmt'
import { parseApiError } from '@/utils/apiError'

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
  currency:      '',
  exchangeRate:  1,
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

function availableItemsFor(currentLine) {
  const usedIds = new Set(form.value.items.filter(l => l !== currentLine && l.saleItemId).map(l => l.saleItemId))
  return saleItems.value.filter(s => !usedIds.has(s.id))
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
  if (!si) { line.productName = ''; line.unitPrice = 0; calcLine(line); return }
  line.productName = si.name
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
      currency:      form.value.currency      || null,
      exchangeRate:  form.value.exchangeRate,
      notes:         form.value.notes,
      items: form.value.items.map(({ saleItemId, productName, qty, unitPrice, discount }) => ({
        saleItemId: saleItemId || null,
        productName, qty, unitPrice, discount,
      })),
    })
    router.push(`/erp/quotations/${data.data.quotation.id}`)
  } catch (err) {
    globalError.value = parseApiError(err, 'Failed to create quotation')
  } finally {
    saving.value = false
  }
}
</script>
