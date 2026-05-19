<template>
  <AppLayout>
    <div class="space-y-5">

      <PageHeader :title="loading ? t('erp.orders.editOrder') : (order?.orderNumber || t('erp.orders.editOrder'))"
        :back-to="`/erp/orders/${route.params.id}`"
        :breadcrumb="[
          { label: 'Orders', to: '/erp/orders' },
          { label: order?.orderNumber || '…', to: `/erp/orders/${route.params.id}` },
          { label: t('common.edit') },
        ]">
        <template #badge>
          <StatusPill :label="t('erp.orders.draft')" />
        </template>
        <template #actions>
          <HeaderSaveActions
            :cancel-to="`/erp/orders/${route.params.id}`"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.saving')"
            :save-label="t('common.saveChanges')"
            @save="save"
          />
        </template>
      </PageHeader>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Not found / not draft -->
      <ErrorBanner v-else-if="loadError" :message="loadError" />

      <!-- Sections -->
      <div v-else class="space-y-5">

        <!-- Customer & Order Info -->
        <FormCard :title="t('erp.orders.customerInfo')" :icon="UserIcon" icon-color="primary" :padded="false">
          <div class="px-6 py-5 grid grid-cols-2 gap-x-6 gap-y-5">

            <!-- Customer -->
            <div class="col-span-2 lg:col-span-1">
              <FieldLabel :text="t('erp.orders.customer')" required />
              <SearchSelect v-model="form.customerId" :options="customers" :invalid="!!errors.customerId" placeholder="— Select customer —">
                <template #option="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
              </SearchSelect>
              <p v-if="errors.customerId" class="mt-1 text-[11px] text-red-500">{{ errors.customerId }}</p>

              <CustomerChip :customer="selectedCustomer" />
            </div>

            <!-- Order Date -->
            <div>
              <FieldLabel :text="t('erp.orders.orderDate')" required />
              <DateInput v-model="form.orderDate"
                :class="['w-full px-3.5 py-2.5 border text-[13px] transition-all',
                         'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                         errors.orderDate ? 'border-red-300 bg-red-50/50' : 'border-[#E2E8F0] text-[#1C2434]']" />
              <p v-if="errors.orderDate" class="mt-1 text-[11px] text-red-500">{{ errors.orderDate }}</p>
            </div>

            <!-- Currency -->
            <div>
              <FieldLabel :text="t('erp.common.currency')" />
              <CurrencySelector v-model="form.currency" v-model:exchangeRate="form.exchangeRate" :as-of-date="form.orderDate" />
            </div>

            <!-- Notes -->
            <div class="col-span-2">
              <FieldLabel :text="t('erp.orders.notes')" />
              <textarea v-model="form.notes" rows="2" placeholder="Order notes or special instructions…"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                       transition-all resize-none placeholder:text-[#9BA7B0]" />
            </div>
          </div>
        </FormCard>

        <!-- Line Items -->
        <FormCard :title="t('erp.orders.lineItems')" :icon="ClipboardDocumentListIcon" icon-color="green"
          :subtitle="form.items.length ? `${form.items.length} item${form.items.length !== 1 ? 's' : ''}` : 'No items yet'"
          :padded="false">
          <template #actions>
            <button @click="addLine" type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold
                     text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200
                     rounded-xl transition-colors">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.orders.addItem') }}
            </button>
          </template>

          <!-- Empty state -->
          <EmptyState v-if="!form.items.length" :icon="ShoppingCartIcon" :title="t('erp.common.noItems')" subtitle="Add products or services to this order" :action-label="t('erp.orders.addFirstItem')" :error-message="errors.items" @action="addLine" />

          <!-- Items table -->
          <div v-else>
            <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]"
              style="grid-template-columns: 1.8rem 2.5fr 1.4fr 2fr 4.5rem 6rem 4.5rem 5.5rem 2rem">
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-center">#</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.orders.saleItem') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.orders.store') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.orders.description') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.orders.items') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.orders.unitPrice') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.orders.tax') }} %</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.orders.amount') }}</div>
              <div></div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <div v-for="(line, idx) in form.items" :key="idx"
                class="grid items-center gap-3 px-5 py-3 hover:bg-[#F7F9FC] transition-colors group"
                style="grid-template-columns: 1.8rem 2.5fr 1.4fr 2fr 4.5rem 6rem 4.5rem 5.5rem 2rem">

                <div class="text-[12px] font-semibold text-[#CBD5E1] text-center select-none">{{ idx + 1 }}</div>

                <SearchSelect v-model="line.saleItemId" :options="groupedItemOptions" group-values="items" group-label="label" placeholder="— Item —" @change="onPickerChange(line, idx)" />

                <div>
                  <SearchSelect v-if="line.hasProduct" v-model="line.storeId" :options="stores" :invalid="line.hasProduct && !line.storeId" placeholder="— Store —" />
                  <div v-else class="flex items-center justify-center h-9">
                    <span class="text-[12px] text-[#CBD5E1]">—</span>
                  </div>
                </div>

                <input v-model="line.productName" type="text" placeholder="Description…"
                  class="w-full px-2.5 py-2 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-all placeholder:text-[#CBD5E1]" />

                <input v-model.number="line.quantity" type="number" min="1"
                  class="w-full px-2 py-2 border border-[#E2E8F0] text-[13px] text-right
                         text-[#1C2434] tabular-nums focus:outline-none focus:ring-2
                         focus:ring-primary-500/20 focus:border-primary-400 transition-all" />

                <input v-model.number="line.unitPrice" type="number" min="0" step="0.01" placeholder="0.00"
                  class="w-full px-2.5 py-2 border border-[#E2E8F0] text-[13px] text-right
                         text-[#1C2434] tabular-nums focus:outline-none focus:ring-2
                         focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-[#CBD5E1]" />

                <input v-model.number="line.taxRate" type="number" min="0" max="100" step="0.01" placeholder="0"
                  class="w-full px-2 py-2 border border-[#E2E8F0] text-[13px] text-right
                         text-[#1C2434] tabular-nums focus:outline-none focus:ring-2
                         focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-[#CBD5E1]" />

                <div class="text-[13px] font-semibold text-[#1C2434] tabular-nums text-right">
                  {{ fmtMoney((line.quantity || 0) * (line.unitPrice || 0)) }}
                </div>

                <button @click="removeLine(idx)" type="button"
                  class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                         text-[#CBD5E1] hover:text-red-500 hover:bg-red-50 transition-colors
                         opacity-0 group-hover:opacity-100">
                  <TrashIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Subtotal footer -->
            <div class="grid items-center gap-3 px-5 py-3.5 bg-[#F7F9FC] border-t border-[#E2E8F0]"
              style="grid-template-columns: 1.8rem 2.5fr 1.4fr 2fr 4.5rem 6rem 4.5rem 5.5rem 2rem">
              <div class="col-span-7 text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">
                {{ t('erp.orders.subtotal') }}
              </div>
              <div class="text-[13px] font-bold text-[#1C2434] tabular-nums text-right">{{ fmtMoney(subtotal) }}</div>
              <div></div>
            </div>

            <p v-if="errors.items" class="px-5 py-2.5 text-[11px] text-red-600 bg-[#FEE2E2] border-t border-[#FECACA]">
              {{ errors.items }}
            </p>
          </div>
        </FormCard>

        <ErrorBanner :message="globalError" />

        <!-- Summary + Actions -->
        <FormCard :title="t('erp.orders.orderSummary')" :icon="CalculatorIcon" icon-color="slate" :padded="false">
          <div class="px-6 py-4 grid grid-cols-3 gap-6">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.orders.items') }}</span>
              <span class="text-[13px] font-semibold text-[#1C2434]">{{ form.items.length }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.orders.subtotal') }}</span>
              <span class="text-[13px] font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(subtotal) }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.orders.tax') }}</span>
              <span class="text-[13px] font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(taxAmount) }}</span>
            </div>
          </div>

          <DocFooterBar
            :total-label="t('erp.orders.total')"
            :total="fmtMoney(grandTotal)"
            :discard-to="`/erp/orders/${route.params.id}`"
            :discard-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.saving')"
            :save-label="t('common.saveChanges')"
            @save="save"
          />
        </FormCard>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  PlusIcon, TrashIcon, ShoppingCartIcon,
  UserIcon, ClipboardDocumentListIcon, CalculatorIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import CurrencySelector from '@/components/CurrencySelector.vue'
import SearchSelect from '@/components/SearchSelect.vue'
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
import { useSettingsStore } from '@/stores/settings'

const { t }       = useI18n()
const route       = useRoute()
const router      = useRouter()
const settings    = useSettingsStore()

const order        = ref(null)
const customers    = ref([])
const saleItems    = ref([])
const salePackages = ref([])
const stores       = ref([])
const loading      = ref(true)
const loadError    = ref('')
const globalError  = ref('')
const saving       = ref(false)
const errors       = ref({})

const form = ref({ customerId: '', orderDate: '', currency: '', exchangeRate: 1, notes: '', items: [] })

const selectedCustomer = computed(() =>
  form.value.customerId ? customers.value.find(c => c.id === form.value.customerId) : null
)

const groupedItemOptions = computed(() => {
  const groups = [{ label: t('erp.orders.saleItems'), items: saleItems.value }]
  if (salePackages.value.length) {
    groups.push({
      label: t('erp.orders.salePackages'),
      items: salePackages.value.map(p => ({ ...p, name: `📦 ${p.name}` })),
    })
  }
  return groups
})

onMounted(async () => {
  const id = route.params.id
  const [orderRes, customersRes, saleItemsRes, salePackagesRes, storesRes] = await Promise.allSettled([
    api.get(`/erp/orders/${id}`),
    api.get('/erp/customers',     { params: { limit: 200 } }),
    api.get('/erp/sale-items',    { params: { limit: 500, status: 'active' } }),
    api.get('/erp/sale-packages', { params: { limit: 200, status: 'active' } }),
    api.get('/erp/stores',        { params: { limit: 200 } }),
  ])
  if (customersRes.status    === 'fulfilled') customers.value    = customersRes.value.data.data.customers
  if (saleItemsRes.status    === 'fulfilled') saleItems.value    = saleItemsRes.value.data.data.items
  if (salePackagesRes.status === 'fulfilled') salePackages.value = salePackagesRes.value.data.data.items
  if (storesRes.status       === 'fulfilled') stores.value       = storesRes.value.data.data.stores

  if (orderRes.status !== 'fulfilled') {
    loadError.value = parseApiError(orderRes.reason, 'Failed to load order')
    loading.value = false
    return
  }

  const o = orderRes.value.data.data.order
  if (o.status !== 'draft') {
    // Only draft orders can be edited — bounce back to detail
    router.replace(`/erp/orders/${id}`)
    return
  }
  order.value = o

  form.value = {
    customerId:   o.customerId   || '',
    orderDate:    o.orderDate    || '',
    currency:     o.currency     || '',
    exchangeRate: o.exchangeRate != null ? Number(o.exchangeRate) : 1,
    notes:        o.notes        || '',
    items: (o.items || []).map(it => {
      const si = saleItems.value.find(s => s.id === it.saleItemId)
      const hasProduct = !!(it.productId || si?.productId)
      return {
        saleItemId:  it.saleItemId || '',
        storeId:     it.storeId    || '',
        hasProduct,
        productName: it.productName || '',
        quantity:    Number(it.quantity) || 1,
        unitPrice:   it.unitPrice != null ? Number(it.unitPrice) : 0,
        taxRate:     it.taxRate   != null ? Number(it.taxRate)   : 0,
      }
    }),
  }
  loading.value = false
})

function defaultTaxRate() {
  if (form.value.items.length) return Number(form.value.items[form.value.items.length - 1].taxRate) || 0
  return Number(settings.tax?.rate) || 0
}

function addLine() {
  form.value.items.push({ saleItemId: '', storeId: '', hasProduct: false, productName: '', quantity: 1, unitPrice: 0, taxRate: defaultTaxRate() })
}

function removeLine(idx) {
  form.value.items.splice(idx, 1)
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
  const pricing = getBestPricing(si, customer?.customerGroupId)
  if (pricing) line.unitPrice = Number(pricing.unitPrice)
}

function onSaleItemChange(line) {
  const si = saleItems.value.find(s => s.id === line.saleItemId)
  if (!si) { line.productName = ''; line.unitPrice = 0; line.hasProduct = false; line.storeId = ''; return }
  line.productName = si.name
  line.hasProduct  = !!si.productId
  if (!line.hasProduct) line.storeId = ''
  applyPricing(line)
}

async function onPickerChange(line, idx) {
  const id = line.saleItemId
  if (!id) { onSaleItemChange(line); return }
  if (saleItems.value.some(s => s.id === id)) { onSaleItemChange(line); return }
  if (salePackages.value.some(p => p.id === id)) {
    await expandPackageInto(idx, id)
  }
}

async function expandPackageInto(idx, packageId) {
  try {
    const { data } = await api.get(`/erp/sale-packages/${packageId}`)
    const pkg = data.data.package
    const customer = customers.value.find(c => c.id === form.value.customerId)
    const expanded = (pkg.packageItems || []).map(pi => {
      const si = pi.saleItem || saleItems.value.find(s => s.id === pi.saleItemId) || {}
      const hasProduct = !!(si.productId || saleItems.value.find(s => s.id === pi.saleItemId)?.productId)
      let unitPrice = pi.unitPrice != null ? Number(pi.unitPrice) : 0
      if (!unitPrice) {
        const siFull = saleItems.value.find(s => s.id === pi.saleItemId)
        const pricing = siFull ? getBestPricing(siFull, customer?.customerGroupId) : null
        if (pricing) unitPrice = Number(pricing.unitPrice)
      }
      return {
        saleItemId:  pi.saleItemId,
        storeId:     '',
        hasProduct,
        productName: `${si.name || 'Item'} (${pkg.code || pkg.name})`,
        quantity:    Number(pi.quantity) || 1,
        unitPrice,
        taxRate:     Number(settings.tax?.rate) || 0,
      }
    })
    if (expanded.length) form.value.items.splice(idx, 1, ...expanded)
    else                 form.value.items.splice(idx, 1)
  } catch {
    form.value.items[idx].saleItemId = ''
    onSaleItemChange(form.value.items[idx])
  }
}

watch(() => form.value.customerId, () => {
  errors.value.customerId = ''
  for (const line of form.value.items) applyPricing(line)
})

const subtotal   = computed(() => form.value.items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0))
const taxAmount  = computed(() => toFixed(
  form.value.items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0) * ((i.taxRate || 0) / 100), 0),
  2,
))
const grandTotal = computed(() => subtotal.value + taxAmount.value)

function validate() {
  const e = {}
  if (!form.value.customerId) e.customerId = 'Customer is required'
  if (!form.value.orderDate)  e.orderDate  = 'Order date is required'
  if (!form.value.items.length) e.items = 'Add at least one item'
  for (const item of form.value.items) {
    if (!item.productName?.trim())        { e.items = 'All items need a description'; break }
    if (item.hasProduct && !item.storeId) { e.items = 'Select a store for product items'; break }
    if (!item.quantity || item.quantity < 1) { e.items = 'All items need a valid quantity'; break }
  }
  errors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  globalError.value = ''
  if (!validate()) return
  saving.value = true
  try {
    const payload = {
      customerId:   form.value.customerId,
      orderDate:    form.value.orderDate,
      currency:     form.value.currency || null,
      exchangeRate: form.value.exchangeRate,
      notes:        form.value.notes,
      items: form.value.items.map(({ saleItemId, storeId, productName, quantity, unitPrice, taxRate }) => ({
        saleItemId: saleItemId || null,
        storeId:    storeId    || null,
        productName, quantity, unitPrice,
        taxRate: Number(taxRate) || 0,
      })),
    }
    await api.put(`/erp/orders/${route.params.id}`, payload)
    router.push(`/erp/orders/${route.params.id}`)
  } catch (err) {
    globalError.value = parseApiError(err, 'Failed to update order')
  } finally {
    saving.value = false
  }
}
</script>
