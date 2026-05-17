<template>
  <AppLayout>
    <div class="space-y-5">

      <PageHeader :title="t('erp.orders.new')" back-to="/erp/orders"
        :breadcrumb="[
          { label: 'Orders', to: '/erp/orders' },
          { label: 'Create' },
        ]">
        <template #badge>
          <StatusPill :label="t('erp.orders.draft')" />
        </template>
        <template #actions>
          <HeaderSaveActions
            cancel-to="/erp/orders"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.orders.createOrder')"
            @save="save"
          />
        </template>
      </PageHeader>

      <!-- Sections -->
      <div class="space-y-5">

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

              <!-- Customer chip -->
              <div v-if="selectedCustomer"
                class="mt-2.5 flex items-center gap-2.5 px-3 py-2.5 bg-primary-50 rounded-xl border border-primary-100">
                <div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                  <span class="text-[12px] font-bold text-white uppercase">{{ selectedCustomer.name?.charAt(0) }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-[13px] font-semibold text-[#1C2434] truncate">{{ selectedCustomer.name }}</p>
                  <p v-if="selectedCustomer.company" class="text-[11px] text-[#637381] truncate">{{ selectedCustomer.company }}</p>
                </div>
                <span v-if="selectedCustomer.group"
                  class="flex-shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full
                         bg-white border border-primary-200 text-primary-600">
                  {{ selectedCustomer.group.name }}
                </span>
              </div>
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

            <!-- Tax Rate -->
            <div>
              <FieldLabel :text="t('erp.orders.taxRate')" />
              <div class="relative">
                <input v-model.number="form.taxRate" type="number" min="0" max="100" step="0.01" placeholder="0"
                  class="w-full pl-3.5 pr-9 py-2.5 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-all placeholder:text-[#9BA7B0]" />
                <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#9BA7B0] font-medium select-none">%</span>
              </div>
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
          <div v-if="!form.items.length" class="flex flex-col items-center justify-center py-14 text-center px-6">
            <div class="w-14 h-14 bg-[#F7F9FC] rounded-2xl flex items-center justify-center mb-4 border border-[#E2E8F0]">
              <ShoppingCartIcon class="w-6 h-6 text-[#CBD5E1]" />
            </div>
            <p class="text-[13px] font-semibold text-[#637381]">{{ t('erp.common.noItems') }}</p>
            <p class="text-[12px] text-[#9BA7B0] mt-1">Add products or services to this order</p>
            <button @click="addLine" type="button"
              class="mt-5 inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold
                     text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200
                     rounded-xl transition-colors">
              <PlusIcon class="w-4 h-4" />
              {{ t('erp.orders.addFirstItem') }}
            </button>
            <p v-if="errors.items" class="mt-3 text-[11px] text-red-500">{{ errors.items }}</p>
          </div>

          <!-- Items table -->
          <div v-else>
            <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]"
              style="grid-template-columns: 1.8rem 2.5fr 1.4fr 2fr 5rem 7rem 5.5rem 2rem">
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-center">#</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.orders.saleItem') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.orders.store') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.orders.description') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.orders.items') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.orders.unitPrice') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.orders.amount') }}</div>
              <div></div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <div v-for="(line, idx) in form.items" :key="idx"
                class="grid items-center gap-3 px-5 py-3 hover:bg-[#F7F9FC] transition-colors group"
                style="grid-template-columns: 1.8rem 2.5fr 1.4fr 2fr 5rem 7rem 5.5rem 2rem">

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
              style="grid-template-columns: 1.8rem 2.5fr 1.4fr 2fr 5rem 7rem 5.5rem 2rem">
              <div class="col-span-6 text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">
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
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">
                {{ t('erp.orders.tax') }} ({{ form.taxRate || 0 }}%)
              </span>
              <span class="text-[13px] font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(taxAmount) }}</span>
            </div>
          </div>

          <div class="px-6 py-5 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('erp.orders.total') }}</p>
              <p class="text-3xl font-extrabold text-primary-500 tabular-nums leading-none">{{ fmtMoney(grandTotal) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <RouterLink to="/erp/orders"
                class="px-5 py-2.5 text-[13px] font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
                {{ t('erp.orders.discard') }}
              </RouterLink>
              <button @click="save" :disabled="saving"
                class="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold
                       bg-primary-500 text-white rounded-xl hover:bg-primary-600 shadow-sm
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
                <CheckIcon v-else class="w-4 h-4" />
                {{ saving ? t('erp.common.creating') : t('erp.orders.createOrder') }}
              </button>
            </div>
          </div>
        </FormCard>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  PlusIcon, TrashIcon,
  CheckIcon, ShoppingCartIcon,
  ArrowPathIcon, UserIcon, ClipboardDocumentListIcon,
  CalculatorIcon, LightBulbIcon,
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
import api from '@/api'
import { fmtMoney, toFixed } from '@/utils/fmt'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router    = useRouter()
const customers    = ref([])
const saleItems    = ref([])
const salePackages = ref([])
const stores       = ref([])
const globalError = ref('')
const saving    = ref(false)
const errors    = ref({})

const today = new Date().toISOString().slice(0, 10)
const form  = ref({ customerId: '', orderDate: today, taxRate: 0, currency: '', exchangeRate: 1, notes: '', items: [] })

const selectedCustomer = computed(() =>
  form.value.customerId ? customers.value.find(c => c.id === form.value.customerId) : null
)

// Grouped options for the line-item picker: Sale Items + Sale Packages
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
  const [customersRes, saleItemsRes, salePackagesRes, storesRes] = await Promise.allSettled([
    api.get('/erp/customers',     { params: { limit: 200 } }),
    api.get('/erp/sale-items',    { params: { limit: 500, status: 'active' } }),
    api.get('/erp/sale-packages', { params: { limit: 200, status: 'active' } }),
    api.get('/erp/stores',        { params: { limit: 200 } }),
  ])
  if (customersRes.status    === 'fulfilled') customers.value    = customersRes.value.data.data.customers
  if (saleItemsRes.status    === 'fulfilled') saleItems.value    = saleItemsRes.value.data.data.items
  if (salePackagesRes.status === 'fulfilled') salePackages.value = salePackagesRes.value.data.data.items
  if (storesRes.status       === 'fulfilled') stores.value       = storesRes.value.data.data.stores
})

function addLine() {
  form.value.items.push({ saleItemId: '', storeId: '', hasProduct: false, productName: '', quantity: 1, unitPrice: 0 })
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

// Picker router: the dropdown lists both Sale Items and Sale Packages.
// If the selected id matches a Sale Item, fill the line normally.
// If it matches a Sale Package, fetch the package + replace the line with
// N expanded lines (one per package item) using the package's override prices.
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
      // Resolve price: package override > best sale-item pricing > 0
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
      }
    })
    if (expanded.length) form.value.items.splice(idx, 1, ...expanded)
    else                 form.value.items.splice(idx, 1) // empty package → just drop the placeholder line
  } catch (err) {
    // On failure, reset the picker so the user can try again
    form.value.items[idx].saleItemId = ''
    onSaleItemChange(form.value.items[idx])
  }
}

watch(() => form.value.customerId, () => {
  errors.value.customerId = ''
  for (const line of form.value.items) applyPricing(line)
})

const subtotal   = computed(() => form.value.items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0))
const taxAmount  = computed(() => toFixed(subtotal.value * ((form.value.taxRate || 0) / 100), 2))
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
      ...form.value,
      items: form.value.items.map(({ saleItemId, storeId, productName, quantity, unitPrice }) => ({
        saleItemId: saleItemId || null,
        storeId:    storeId    || null,
        productName, quantity, unitPrice,
      })),
    }
    const { data } = await api.post('/erp/orders', payload)
    router.push(`/erp/orders/${data.data.order.id}`)
  } catch (err) {
    globalError.value = parseApiError(err, 'Failed to create order')
  } finally {
    saving.value = false
  }
}
</script>
