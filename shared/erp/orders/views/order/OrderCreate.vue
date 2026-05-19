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

          </div>
        </FormCard>

        <!-- Line Items -->
        <FormCard :title="t('erp.orders.lineItems')" :icon="ClipboardDocumentListIcon" icon-color="green"
          :subtitle="itemsSubtitle"
          :padded="false">
          <template #actions>
            <button @click="openBulkPicker" type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold
                     text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200
                     rounded-xl transition-colors">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.orders.addItem') }}
            </button>
          </template>

          <!-- Empty state -->
          <EmptyState v-if="!form.items.length" :icon="ShoppingCartIcon" :title="t('erp.common.noItems')" subtitle="Add products or services to this order" :action-label="t('erp.orders.addFirstItem')" :error-message="errors.items" @action="openBulkPicker" />

          <!-- Items table -->
          <div v-else>
            <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]"
              style="grid-template-columns: 1.8rem 2.5fr 1.4fr 2fr 4.5rem 6rem 4.5rem 5.5rem 5.5rem 1.5rem 2rem">
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-center">#</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.orders.saleItem') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.orders.store') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.orders.description') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.orders.items') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.orders.unitPrice') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.orders.tax') }} %</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.orders.tax') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.orders.amount') }}</div>
              <div></div>
              <div></div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <div v-for="(line, idx) in form.items" :key="line.key || idx"
                v-show="isRowVisible(line)"
                class="grid items-center gap-3 px-5 py-3 transition-colors group border-l-2"
                :class="[
                  line.isPackage ? 'bg-primary-50/40 border-l-primary-400'
                    : (line.parentKey ? 'bg-[#F7F9FC]/60 hover:bg-[#F1F5F9] border-l-primary-200' : 'border-l-transparent hover:bg-[#F7F9FC]'),
                  dragFromIdx === topLevelStart(idx) ? 'opacity-40' : '',
                  dragOverIdx === topLevelStart(idx) && dragFromIdx !== topLevelStart(idx) ? 'border-t-2 border-t-primary-500' : '',
                ]"
                style="grid-template-columns: 1.8rem 2.5fr 1.4fr 2fr 4.5rem 6rem 4.5rem 5.5rem 5.5rem 1.5rem 2rem"
                @dragover="onDragOver($event, idx)"
                @drop="onDrop(idx)"
                @dragleave="onDragLeave(idx)">

                <!-- Drag handle: only top-level rows are draggable; children are anchored to their parent. -->
                <div v-if="!line.parentKey"
                  draggable="true"
                  @dragstart="onDragStart($event, idx)"
                  @dragend="onDragEnd"
                  :title="t('erp.orders.dragToReorder')"
                  class="text-[12px] font-semibold text-center select-none flex items-center justify-center
                         cursor-grab active:cursor-grabbing rounded hover:bg-[#E2E8F0]/60 h-7
                         text-[#CBD5E1] group-hover:text-[#637381]">
                  <Bars3Icon class="w-4 h-4 hidden group-hover:block" />
                  <span class="group-hover:hidden">{{ idx + 1 }}</span>
                </div>
                <div v-else class="text-[11px] text-[#CBD5E1] text-center select-none">↳</div>

                <!-- Item picker / package label -->
                <div v-if="line.isPackage" class="flex items-center gap-1.5 text-[13px] font-semibold text-primary-700">
                  <button type="button" @click="toggleCollapse(line.key)"
                    :title="isCollapsed(line.key) ? t('erp.orders.expandPackage') : t('erp.orders.collapsePackage')"
                    class="flex items-center justify-center w-5 h-5 rounded hover:bg-primary-100 text-primary-600 flex-shrink-0">
                    <ChevronRightIcon v-if="isCollapsed(line.key)" class="w-3.5 h-3.5" />
                    <ChevronDownIcon  v-else                       class="w-3.5 h-3.5" />
                  </button>
                  <CubeIcon class="w-4 h-4 flex-shrink-0" />
                  <span class="truncate">{{ line.productName }}</span>
                  <span class="text-[11px] font-normal text-[#9BA7B0]">· {{ t('erp.orders.salePackage') }}</span>
                </div>
                <div v-else-if="line.parentKey" class="text-[12px] text-[#9BA7B0] truncate pl-2">
                  {{ t('erp.orders.packageItem') }}
                </div>
                <SearchSelectPopup
                  v-else
                  v-model="line.saleItemId"
                  :options="groupedItemOptions"
                  group-values="items"
                  group-label="label"
                  placeholder="— Item —"
                  search-placeholder="Search by code or name…"
                  @change="onPickerChange(line, idx)"
                />

                <!-- Store -->
                <div>
                  <SearchSelect v-if="!line.isPackage && line.hasProduct" v-model="line.storeId" :options="stores" :invalid="line.hasProduct && !line.storeId" placeholder="— Store —" />
                  <div v-else class="flex items-center justify-center h-9">
                    <span class="text-[12px] text-[#CBD5E1]">—</span>
                  </div>
                </div>

                <!-- Description -->
                <div v-if="line.parentKey" class="flex items-center gap-2 pl-5 text-[13px] text-[#374151] truncate">
                  <span class="truncate">{{ line.productName }}</span>
                  <span class="text-[11px] font-semibold text-[#9BA7B0] tabular-nums flex-shrink-0">× {{ line.quantity }}</span>
                </div>
                <div v-else-if="line.isPackage" class="text-[12px] text-[#637381] italic">
                  {{ childrenOf(line.key).length }} item{{ childrenOf(line.key).length !== 1 ? 's' : '' }}
                </div>
                <input v-else v-model="line.productName" type="text" placeholder="Description…"
                  class="w-full px-2.5 py-2 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-all placeholder:text-[#CBD5E1]" />

                <!-- Quantity / Unit price / Tax % / Tax / Amount: priced on parents + standalone only -->
                <template v-if="line.parentKey">
                  <div></div><div></div><div></div><div></div><div></div>
                </template>
                <template v-else>
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

                  <div class="text-[13px] text-[#637381] tabular-nums text-right">
                    {{ fmtMoney(lineTax(line)) }}
                  </div>

                  <div class="text-[13px] tabular-nums text-right"
                    :class="line.isPackage ? 'font-bold text-primary-700' : 'font-semibold text-[#1C2434]'">
                    {{ fmtMoney((line.quantity || 0) * (line.unitPrice || 0)) }}
                  </div>
                </template>

                <!-- Duplicate-item indicator (after amount, before delete) -->
                <div v-if="!line.parentKey" class="flex items-center justify-center">
                  <ExclamationTriangleIcon v-if="isDuplicate(line)"
                    :title="t('erp.orders.duplicateItemWarning')"
                    class="w-4 h-4 text-amber-500" />
                </div>
                <div v-else></div>

                <button @click="removeLine(idx)" type="button"
                  :title="line.isPackage ? t('erp.orders.removePackage') : ''"
                  class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                         text-[#CBD5E1] hover:text-red-500 hover:bg-red-50 transition-colors
                         opacity-0 group-hover:opacity-100">
                  <TrashIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Subtotal footer -->
            <div class="grid items-center gap-3 px-5 py-3.5 bg-[#F7F9FC] border-t border-[#E2E8F0]"
              style="grid-template-columns: 1.8rem 2.5fr 1.4fr 2fr 4.5rem 6rem 4.5rem 5.5rem 5.5rem 1.5rem 2rem">
              <div class="col-span-7 text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">
                {{ t('erp.orders.subtotal') }}
              </div>
              <div class="text-[13px] font-semibold text-[#637381] tabular-nums text-right">{{ fmtMoney(taxAmount) }}</div>
              <div class="text-[13px] font-bold text-[#1C2434] tabular-nums text-right">{{ fmtMoney(subtotal) }}</div>
              <div></div>
              <div></div>
            </div>

            <p v-if="errors.items" class="px-5 py-2.5 text-[11px] text-red-600 bg-[#FEE2E2] border-t border-[#FECACA]">
              {{ errors.items }}
            </p>
          </div>

          <!-- Bulk-add popup (hidden trigger; opened by the Add Item button + empty state) -->
          <SearchSelectPopup
            ref="bulkPickerRef"
            :model-value="''"
            :options="groupedItemOptions"
            group-values="items"
            group-label="label"
            multiple
            hide-trigger
            search-placeholder="Search by code or name…"
            @submit="onBulkAdd"
          />
        </FormCard>

        <ErrorBanner :message="globalError" />

        <!-- Summary + Actions -->
        <FormCard :title="t('erp.orders.orderSummary')" :icon="CalculatorIcon" icon-color="slate" :padded="false">
          <div class="px-6 py-5 grid grid-cols-2 gap-6 items-stretch">
            <div class="flex flex-col text-left">
              <FieldLabel :text="t('erp.orders.notes')" />
              <textarea v-model="form.notes" placeholder="Order notes or special instructions…"
                class="flex-1 w-full min-h-[8rem] px-3.5 py-2.5 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                       transition-all resize-none placeholder:text-[#9BA7B0]" />
            </div>
            <dl class="w-full space-y-2.5">
              <div class="flex items-center justify-between text-[13px]">
                <dt class="text-[#637381]">{{ t('erp.orders.subtotal') }}</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(subtotal) }}</dd>
              </div>
              <div class="flex items-center justify-between text-[13px]">
                <dt class="text-[#637381]">{{ t('erp.orders.tax') }}</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(taxAmount) }}</dd>
              </div>
              <div class="flex items-center justify-between pt-2.5 border-t border-[#E2E8F0]">
                <dt class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.orders.total') }}</dt>
                <dd class="text-base font-bold text-[#1C2434] tabular-nums">{{ fmtMoney(grandTotal) }}</dd>
              </div>
            </dl>
          </div>

          <DocFooterBar
            :total-label="t('erp.orders.total')"
            :total="fmtMoney(grandTotal)"
            discard-to="/erp/orders"
            :discard-label="t('erp.orders.discard')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.orders.createOrder')"
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
import { useRouter } from 'vue-router'
import {
  PlusIcon, TrashIcon,
  CheckIcon, ShoppingCartIcon,
  ArrowPathIcon, UserIcon, ClipboardDocumentListIcon,
  CalculatorIcon, LightBulbIcon, ExclamationTriangleIcon,
  Bars3Icon, CubeIcon, ChevronDownIcon, ChevronRightIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import CurrencySelector from '@/components/CurrencySelector.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import SearchSelectPopup from '@/components/SearchSelectPopup.vue'
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

const { t } = useI18n()
const router    = useRouter()
const settings  = useSettingsStore()
const customers    = ref([])
const saleItems    = ref([])
const salePackages = ref([])
const stores       = ref([])
const globalError = ref('')
const saving    = ref(false)
const errors    = ref({})

const today = new Date().toISOString().slice(0, 10)
const form  = ref({ customerId: '', orderDate: today, currency: '', exchangeRate: 1, notes: '', items: [] })

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

function defaultTaxRate() {
  // Prefer the previous *priced* row's rate (skip package headers, which are 0).
  for (let i = form.value.items.length - 1; i >= 0; i--) {
    if (form.value.items[i].isPackage) continue
    return Number(form.value.items[i].taxRate) || 0
  }
  return Number(settings.tax?.rate) || 0
}

// Stable per-row id so children can reference their parent before the server
// assigns real UUIDs. Falls back to a counter-based id where crypto is missing.
let _localKeyCounter = 0
function newKey() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `k${Date.now()}-${++_localKeyCounter}`
}

function addLine() {
  form.value.items.push({
    key: newKey(), parentKey: '', isPackage: false, salePackageId: '',
    saleItemId: '', storeId: '', hasProduct: false, productName: '',
    quantity: 1, unitPrice: 0, taxRate: defaultTaxRate(),
  })
}

function removeLine(idx) {
  const line = form.value.items[idx]
  if (line.isPackage) {
    // Drop the package header and all of its children in one go.
    form.value.items = form.value.items.filter(it => it.key !== line.key && it.parentKey !== line.key)
  } else {
    form.value.items.splice(idx, 1)
  }
}

function childrenOf(parentKey) {
  return form.value.items.filter(it => it.parentKey === parentKey)
}

// Per-package collapse state — Set of parent keys whose children are hidden.
const collapsedPackages = ref(new Set())
function isCollapsed(key) { return collapsedPackages.value.has(key) }
function toggleCollapse(key) {
  const next = new Set(collapsedPackages.value)
  if (next.has(key)) next.delete(key)
  else               next.add(key)
  collapsedPackages.value = next
}
// Row visibility: hide children of collapsed parents.
function isRowVisible(line) {
  return !(line.parentKey && isCollapsed(line.parentKey))
}

// ── Drag-and-drop reorder ────────────────────────────────────────────────
// Only top-level rows are draggable. A package parent drags together with all
// of its children as one group. Dropping over a child snaps to that child's
// parent group, so children never get reparented or stranded.
const dragFromIdx = ref(null)
const dragOverIdx = ref(null)

function topLevelStart(idx) {
  // For a child row, return its parent's index; otherwise the row itself.
  const line = form.value.items[idx]
  if (!line || !line.parentKey) return idx
  return form.value.items.findIndex(it => it.key === line.parentKey)
}
function groupSpan(startIdx) {
  // Returns how many consecutive rows belong to the group starting at startIdx.
  const start = form.value.items[startIdx]
  if (!start || !start.isPackage) return 1
  let n = 1
  for (let i = startIdx + 1; i < form.value.items.length; i++) {
    if (form.value.items[i].parentKey === start.key) n++
    else break
  }
  return n
}

function onDragStart(e, idx) {
  // Children aren't draggable individually — the parent row owns the group.
  const top = topLevelStart(idx)
  dragFromIdx.value = top
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', String(top))
}
function onDragOver(e, idx) {
  if (dragFromIdx.value === null) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  dragOverIdx.value = topLevelStart(idx)
}
function onDragLeave(idx) {
  if (dragOverIdx.value === topLevelStart(idx)) dragOverIdx.value = null
}
function onDrop(idx) {
  const from = dragFromIdx.value
  const to   = topLevelStart(idx)
  if (from === null || from === to) { onDragEnd(); return }
  const fromSpan   = groupSpan(from)
  const targetSpan = groupSpan(to)
  const moved = form.value.items.splice(from, fromSpan)
  // Moving down → land just past the target group's end (target shifts up).
  // Moving up   → land at the target's position (target shifts down).
  const insertAt = from < to ? (to - fromSpan) + targetSpan : to
  form.value.items.splice(insertAt, 0, ...moved)
  onDragEnd()
}
function onDragEnd() {
  dragFromIdx.value = null
  dragOverIdx.value = null
}

// ── Bulk-add popup wiring ───────────────────────────────────────────────
const bulkPickerRef = ref(null)
function openBulkPicker() { bulkPickerRef.value?.open() }

// Build a new line from a sale item (resolves customer-group pricing).
function makeLineFromSaleItem(si, parentKey = '') {
  const customer = customers.value.find(c => c.id === form.value.customerId)
  const pricing  = getBestPricing(si, customer?.customerGroupId)
  return {
    key:           newKey(),
    parentKey,
    isPackage:     false,
    salePackageId: '',
    saleItemId:    si.id,
    storeId:       '',
    hasProduct:    !!si.productId,
    productName:   si.name,
    quantity:      1,
    unitPrice:     pricing ? Number(pricing.unitPrice) : 0,
    taxRate:       defaultTaxRate(),
  }
}

// Fetch a package and return [parentHeader, ...childLines].
// The parent carries the package's qty / unitPrice / tax — the children are
// shown read-only as "what's in the box" and contribute 0 to totals.
async function linesFromPackage(packageId) {
  try {
    const { data } = await api.get(`/erp/sale-packages/${packageId}`)
    const pkg = data.data.package
    const customer = customers.value.find(c => c.id === form.value.customerId)
    const parentKey = newKey()
    let parentPrice = 0
    const children = (pkg.packageItems || []).map(pi => {
      const si = pi.saleItem || saleItems.value.find(s => s.id === pi.saleItemId) || {}
      const hasProduct = !!(si.productId || saleItems.value.find(s => s.id === pi.saleItemId)?.productId)
      // Resolve a per-item price purely so we can sum up a sensible default
      // package price for the parent — the price doesn't live on the child.
      let resolved = pi.unitPrice != null ? Number(pi.unitPrice) : 0
      if (!resolved) {
        const siFull = saleItems.value.find(s => s.id === pi.saleItemId)
        const pricing = siFull ? getBestPricing(siFull, customer?.customerGroupId) : null
        if (pricing) resolved = Number(pricing.unitPrice)
      }
      const childQty = Number(pi.quantity) || 1
      parentPrice += childQty * resolved
      return {
        key:           newKey(),
        parentKey,
        isPackage:     false,
        salePackageId: '',
        saleItemId:    pi.saleItemId,
        storeId:       '',
        hasProduct,
        productName:   si.name || 'Item',
        quantity:      childQty,
        unitPrice:     0,
        taxRate:       0,
      }
    })
    const parent = {
      key:           parentKey,
      parentKey:     '',
      isPackage:     true,
      salePackageId: pkg.id,
      saleItemId:    '',
      storeId:       '',
      hasProduct:    false,
      productName:   pkg.code ? `${pkg.name} (${pkg.code})` : pkg.name,
      quantity:      1,
      unitPrice:     parentPrice,
      taxRate:       Number(settings.tax?.rate) || 0,
    }
    return [parent, ...children]
  } catch {
    return []
  }
}

// The bulk picker emits an array of mixed sale items + packages.
// Append one line per sale item; append parent+children for each package.
async function onBulkAdd(objects) {
  const newLines = []
  for (const obj of objects) {
    if (saleItems.value.some(s => s.id === obj.id)) {
      newLines.push(makeLineFromSaleItem(obj))
    } else if (salePackages.value.some(p => p.id === obj.id)) {
      const lines = await linesFromPackage(obj.id)
      newLines.push(...lines)
    }
  }
  if (newLines.length) form.value.items.push(...newLines)
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
  const lines = await linesFromPackage(packageId)
  if (lines.length) form.value.items.splice(idx, 1, ...lines)
  else              form.value.items.splice(idx, 1) // empty package → drop the placeholder
}

watch(() => form.value.customerId, () => {
  errors.value.customerId = ''
  for (const line of form.value.items) applyPricing(line)
})

// Sale-item IDs that appear on more than one *top-level* line — package
// children are sold as part of their parent and don't count as duplicates.
const duplicateSaleItemIds = computed(() => {
  const counts = new Map()
  for (const it of form.value.items) {
    if (it.parentKey) continue
    const id = it.saleItemId
    if (!id) continue
    counts.set(id, (counts.get(id) || 0) + 1)
  }
  const dupes = new Set()
  for (const [id, n] of counts) if (n > 1) dupes.add(id)
  return dupes
})
function isDuplicate(line) {
  return !line.parentKey && !!line.saleItemId && duplicateSaleItemIds.value.has(line.saleItemId)
}

function lineTax(line) {
  // Children carry no price — only their parent (the package) contributes.
  if (line.parentKey) return 0
  return (line.quantity || 0) * (line.unitPrice || 0) * ((line.taxRate || 0) / 100)
}
const itemsSubtitle = computed(() => {
  const standalone = form.value.items.filter(i => !i.parentKey && !i.isPackage).length
  const packages   = form.value.items.filter(i =>  i.isPackage).length
  if (!standalone && !packages) return 'No items yet'
  const parts = []
  if (standalone) parts.push(`${standalone} item${standalone !== 1 ? 's' : ''}`)
  if (packages)   parts.push(`${packages} package${packages !== 1 ? 's' : ''}`)
  return parts.join(' · ')
})
const subtotal   = computed(() => form.value.items.reduce((s, i) => i.parentKey ? s : s + (i.quantity || 0) * (i.unitPrice || 0), 0))
const taxAmount  = computed(() => toFixed(form.value.items.reduce((s, i) => s + lineTax(i), 0), 2))
const grandTotal = computed(() => subtotal.value + taxAmount.value)

function validate() {
  const e = {}
  if (!form.value.customerId) e.customerId = 'Customer is required'
  if (!form.value.orderDate)  e.orderDate  = 'Order date is required'
  // Standalone items + package parents are "priced lines" — at least one needed.
  const pricedCount = form.value.items.filter(i => !i.parentKey).length
  if (!pricedCount) e.items = 'Add at least one item'
  for (const item of form.value.items) {
    if (item.isPackage) {
      if (!item.quantity || item.quantity < 1) { e.items = 'Package quantity must be at least 1'; break }
      continue
    }
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
      items: form.value.items.map(({ key, parentKey, salePackageId, saleItemId, storeId, productName, quantity, unitPrice, taxRate }) => ({
        key, parentKey: parentKey || '',
        salePackageId: salePackageId || null,
        saleItemId:    saleItemId    || null,
        storeId:       storeId       || null,
        productName, quantity, unitPrice,
        taxRate: Number(taxRate) || 0,
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
