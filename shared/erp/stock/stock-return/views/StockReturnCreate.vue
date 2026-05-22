<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.stockReturn.new')" back-to="/erp/stock-return"
        :breadcrumb="[
          { label: t('erp.stockReturn.title'), to: '/erp/stock-return' },
          { label: t('erp.stockReturn.new') },
        ]">
        <template #badge>
          <StatusPill :label="t('erp.common.draft')" />
        </template>
        <template #actions>
          <HeaderSaveActions
            cancel-to="/erp/stock-return"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.saving')"
            :save-label="t('erp.common.saveDraft')"
            @save="save"
          />
        </template>
      </PageHeader>

      <div class="space-y-5">

        <!-- Section 1: Return Info -->
        <FormCard :title="t('erp.stockReturn.returnInfo')" :icon="ReceiptRefundIcon" icon-color="amber">
          <div class="space-y-5">

            <!-- Type toggle (full-width row) -->
            <div>
              <FieldLabel :text="t('erp.stockReturn.returnType')" required />
              <div class="inline-flex items-center gap-1 p-1 bg-[#F1F5F9]">
                <button type="button" @click="form.type = 'customer_return'"
                  :class="form.type === 'customer_return'
                    ? 'bg-white shadow-sm text-[#1C2434] ring-1 ring-[#E2E8F0]'
                    : 'text-[#637381] hover:text-[#374151]'"
                  class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition whitespace-nowrap">
                  <ArrowDownTrayIcon class="w-4 h-4" />
                  {{ t('erp.stockReturn.customerReturn') }}
                </button>
                <button type="button" @click="form.type = 'vendor_return'"
                  :class="form.type === 'vendor_return'
                    ? 'bg-white shadow-sm text-[#1C2434] ring-1 ring-[#E2E8F0]'
                    : 'text-[#637381] hover:text-[#374151]'"
                  class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition whitespace-nowrap">
                  <ArrowUpTrayIcon class="w-4 h-4" />
                  {{ t('erp.stockReturn.returnToVendor') }}
                </button>
              </div>
              <!-- Type description -->
              <p class="mt-2 text-[12px] flex items-start gap-1.5"
                :class="form.type === 'customer_return' ? 'text-blue-600' : 'text-orange-600'">
                <InformationCircleIcon class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span v-if="form.type === 'customer_return'">{{ t('erp.stockReturn.descCustomer') }}</span>
                <span v-else>{{ t('erp.stockReturn.descVendor') }}</span>
              </p>
            </div>

            <!-- Date / Store / Customer or Vendor / Notes -->
            <div class="grid grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <FieldLabel :text="t('erp.common.date')" required />
                <DateInput v-model="form.date" :class="['w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors', errorOf('date') && 'input-error']" />
                <FieldError name="date" :errors="fieldErrors" />
              </div>

              <div>
                <FieldLabel :text="t('erp.common.store')" required />
                <SearchSelect v-model="form.storeId" :options="stores" :invalid="!!errorOf('storeId')" :placeholder="t('erp.common.selectStore')">
                  <template #option="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> ({{ option.code }})</span></template>
                  <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> ({{ option.code }})</span></template>
                </SearchSelect>
                <FieldError name="storeId" :errors="fieldErrors" />
              </div>

              <div v-if="form.type === 'customer_return'">
                <FieldLabel :text="t('erp.stockReturn.customer')" />
                <SearchSelect v-model="form.customerId" :options="customers" :placeholder="t('erp.stockReturn.selectCustomer')">
                  <template #option="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                  <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                </SearchSelect>
              </div>

              <div v-else>
                <FieldLabel :text="t('erp.stockReturn.vendor')" />
                <SearchSelect v-model="form.vendorId" :options="vendors" :placeholder="t('erp.stockReturn.selectVendor')">
                  <template #option="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> ({{ option.code }})</span></template>
                  <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> ({{ option.code }})</span></template>
                </SearchSelect>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.common.notes') }}
                </label>
                <input v-model="form.notes" type="text" :placeholder="t('erp.common.optional')"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors placeholder-[#CBD5E1]" />
              </div>
            </div>
          </div>
        </FormCard>

        <!-- Section 2: Items -->
        <div class="bg-white border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-green-50 flex items-center justify-center flex-shrink-0">
                <ClipboardDocumentListIcon class="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.common.items') }}</h2>
                <p v-if="items.length" class="text-[11px] text-[#9BA7B0]">
                  {{ items.length }} item{{ items.length !== 1 ? 's' : '' }}
                </p>
              </div>
            </div>
            <button @click="openPicker" type="button"
              :disabled="!form.storeId || loadingStoreProducts || !storeProducts.length"
              :title="`${t('erp.common.addItem')}  (Ctrl+L)`"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-primary-500
                     bg-primary-50 hover:bg-primary-100 border border-primary-200
                     transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.common.addItem') }}
              <kbd class="hidden md:inline ml-1 px-1 py-px text-[10px] font-mono bg-white/60 border border-primary-200 text-primary-700">
                Ctrl+L
              </kbd>
            </button>
          </div>

          <!-- No store selected -->
          <div v-if="!form.storeId" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] flex items-center justify-center mb-4">
              <BuildingStorefrontIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">{{ t('erp.stockReturn.selectStorePh') }}</p>
          </div>

          <!-- Loading -->
          <div v-else-if="loadingStoreProducts" class="flex items-center justify-center py-16 text-[#9BA7B0] gap-2">
            <div class="w-4 h-4 border-2 border-primary-500 border-t-transparent animate-spin" />
            <span class="text-sm">{{ t('erp.stockReturn.loadingProducts') }}</span>
          </div>

          <!-- No products -->
          <div v-else-if="!storeProducts.length" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] flex items-center justify-center mb-4">
              <ClipboardDocumentListIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">{{ t('erp.stockReturn.noStoreProducts') }}</p>
          </div>

          <div v-else>
            <!-- Empty state -->
            <div v-if="!items.length" class="flex flex-col items-center justify-center py-16 text-center">
              <div class="w-14 h-14 bg-[#F1F5F9] flex items-center justify-center mb-4">
                <ClipboardDocumentListIcon class="w-7 h-7 text-[#CBD5E1]" />
              </div>
              <p class="text-sm font-semibold text-[#637381]">{{ t('erp.common.noItems') }}</p>
              <p class="text-xs text-[#9BA7B0] mt-1 mb-4">Click <strong>{{ t('erp.common.addItem') }}</strong> to pick products from this store.</p>
              <button @click="openPicker" type="button"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-500
                       bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
                <PlusIcon class="w-4 h-4" />
                {{ t('erp.common.addItem') }}
              </button>
            </div>

            <div v-else>
              <!-- Header row -->
              <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]
                          text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider"
                style="grid-template-columns: 2.2fr 5rem 5.5rem 6.5rem 5.5rem 7rem 1.5fr 4.5rem">
                <div>{{ t('erp.common.product') }}</div>
                <div class="text-right">{{ t('erp.stockReturn.available') || t('erp.stockIssue.available') }}</div>
                <div class="text-right">{{ t('erp.stockReturn.colQty') }} <span class="text-red-400 normal-case">*</span></div>
                <div class="text-right">{{ t('erp.stockReturn.costPerUnit') }}</div>
                <div>{{ t('erp.common.batchId') }}</div>
                <div>{{ t('erp.common.expiryDate') }}</div>
                <div>{{ t('erp.common.reason') }}</div>
                <div></div>
              </div>

              <div class="divide-y divide-[#E2E8F0]">
                <div v-for="(item, i) in items" :key="item.key"
                  class="group grid items-center gap-3 px-5 py-3 transition-colors"
                  :class="rowWarn(item) ? 'bg-red-50 hover:bg-red-50/80' : 'hover:bg-[#F7F9FC]'"
                  style="grid-template-columns: 2.2fr 5rem 5.5rem 6.5rem 5.5rem 7rem 1.5fr 4.5rem">

                  <!-- Product label -->
                  <div class="min-w-0 flex items-center gap-2">
                    <span class="font-mono text-[11px] text-[#9BA7B0] tabular-nums w-5 text-right flex-shrink-0">{{ i + 1 }}</span>
                    <div class="min-w-0">
                      <p class="text-sm text-[#1C2434] truncate">{{ productName(item.productId) || '—' }}</p>
                      <p v-if="productSku(item.productId)" class="text-[11px] font-mono text-[#9BA7B0] truncate">{{ productSku(item.productId) }}</p>
                    </div>
                  </div>

                  <!-- Available -->
                  <div class="text-right">
                    <span v-if="item.productId" class="font-mono text-sm font-semibold tabular-nums"
                      :class="storeBalance(item.productId) > 0 ? 'text-[#374151]' : 'text-[#9BA7B0]'">
                      {{ storeBalance(item.productId) }}
                    </span>
                    <span v-else class="text-[#CBD5E1]">—</span>
                  </div>

                  <!-- Qty -->
                  <input v-model.number="item.qty" type="number" min="0.01" step="0.01" placeholder="0"
                    class="w-full px-2.5 py-2 border text-sm text-right tabular-nums
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors"
                    :class="rowWarn(item)
                      ? 'border-red-400 text-red-600'
                      : (form.type === 'customer_return' ? 'border-[#E2E8F0] text-green-700 font-semibold' : 'border-[#E2E8F0] text-red-600 font-semibold')" />

                  <!-- Cost -->
                  <input v-model.number="item.cost" type="number" min="0" step="0.0001" placeholder="0.00"
                    class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm text-right tabular-nums text-[#1C2434]
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />

                  <!-- Batch ID -->
                  <input v-model="item.batchId" type="text" :placeholder="t('erp.common.batchPh')"
                    class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm text-[#1C2434]
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                           transition-colors placeholder-[#CBD5E1]" />

                  <!-- Expiry -->
                  <input v-model="item.expiryDate" type="date"
                    class="w-full px-2 py-2 border border-[#E2E8F0] text-xs text-[#1C2434]
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                           transition-colors" />

                  <!-- Reason -->
                  <SearchSelect v-if="returnReasons.length" v-model="item.reason" :options="returnReasons" track-by="name" label-key="name" :placeholder="t('erp.common.optional')" />
                  <input v-else v-model="item.reason" type="text" :placeholder="t('erp.common.optional')"
                    class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm text-[#1C2434]
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                           transition-colors placeholder-[#CBD5E1]" />

                  <!-- Row actions -->
                  <div class="flex items-center justify-end gap-1">
                    <div class="relative" data-dup-popover>
                      <button v-if="isDuplicate(item)" type="button"
                        tabindex="-1"
                        @click="toggleDupPopover(item)"
                        :aria-label="t('erp.stockReturn.duplicateItemWarning')"
                        class="flex items-center justify-center w-5 h-5 hover:bg-amber-100 text-amber-500 transition-colors">
                        <ExclamationTriangleIcon class="w-4 h-4" />
                      </button>
                      <div v-if="openDupKey === item.key"
                        class="absolute z-20 right-full top-1/2 -translate-y-1/2 mr-2 w-60
                               bg-amber-50 border border-amber-200 shadow-lg p-2.5
                               text-[12px] text-amber-800 leading-snug">
                        <div class="flex items-start gap-1.5">
                          <ExclamationTriangleIcon class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>{{ t('erp.stockReturn.duplicateItemWarning') }}</span>
                        </div>
                      </div>
                    </div>
                    <button @click="duplicateRow(i)" type="button"
                      :title="`${t('erp.common.duplicate')}  (Ctrl+D last)`"
                      class="w-7 h-7 flex items-center justify-center
                             text-[#CBD5E1] hover:text-primary-500 hover:bg-primary-50 transition-all
                             opacity-0 group-hover:opacity-100">
                      <PlusIcon class="w-3.5 h-3.5" />
                    </button>
                    <button @click="removeRow(i)" type="button"
                      :title="t('common.remove')"
                      class="w-7 h-7 flex items-center justify-center
                             text-[#CBD5E1] hover:text-red-500 hover:bg-red-50 transition-all
                             opacity-0 group-hover:opacity-100">
                      <TrashIcon class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Hidden bulk-add popup -->
          <SearchSelectPopup
            ref="pickerRef"
            :model-value="''"
            :options="availableForPicker"
            label-key="name"
            code-key="sku"
            multiple
            hide-trigger
            search-placeholder="Search by name or SKU…"
            submit-label="Add items"
            @submit="onBulkAdd"
          />
        </div>

        <!-- Global error -->
        <div v-if="error"
          class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700
                 text-sm px-4 py-3.5">
          <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{{ error }}</span>
        </div>

        <!-- Summary card -->
        <div class="bg-white border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5">
            <CalculatorIcon class="w-4 h-4 text-[#9BA7B0]" />
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.common.summary') }}</h2>
          </div>

          <div class="px-6 py-4 grid grid-cols-3 gap-6">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.common.items') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">{{ items.length }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.stockReturn.totalReturnQty') }}</span>
              <span class="text-sm font-semibold tabular-nums"
                :class="form.type === 'customer_return' ? 'text-green-700' : 'text-red-600'">
                {{ form.type === 'customer_return' ? '+' : '−' }}{{ totalQty }}
              </span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.stockReturn.totalValue') }}</span>
              <span class="text-sm font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(totalValue) }}</span>
            </div>
          </div>

          <div class="px-6 py-5 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('erp.stockReturn.totalReturnQty') }}</p>
              <p class="text-3xl font-extrabold tabular-nums leading-none"
                :class="form.type === 'customer_return' ? 'text-green-600' : 'text-red-600'">
                {{ form.type === 'customer_return' ? '+' : '−' }}{{ totalQty }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <div class="hidden lg:flex items-center gap-3 text-[11px] text-[#9BA7B0] mr-1">
                <span class="flex items-center gap-1">
                  <kbd class="px-1.5 py-0.5 border border-[#E2E8F0] bg-white font-mono text-[10px]">Ctrl+S</kbd>
                  <span>save</span>
                </span>
                <span class="flex items-center gap-1">
                  <kbd class="px-1.5 py-0.5 border border-[#E2E8F0] bg-white font-mono text-[10px]">Ctrl+L</kbd>
                  <span>add</span>
                </span>
                <span class="flex items-center gap-1">
                  <kbd class="px-1.5 py-0.5 border border-[#E2E8F0] bg-white font-mono text-[10px]">Ctrl+D</kbd>
                  <span>dup</span>
                </span>
              </div>
              <RouterLink to="/erp/stock-return"
                class="px-5 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
                {{ t('common.cancel') }}
              </RouterLink>
              <button @click="save" :disabled="saving"
                class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold
                       bg-primary-500 text-white hover:bg-primary-600 shadow-sm
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
                <CheckIcon v-else class="w-4 h-4" />
                {{ saving ? t('erp.common.saving') : t('erp.common.saveDraft') }}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  PlusIcon, TrashIcon, CheckIcon, ArrowPathIcon,
  ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon,
  ReceiptRefundIcon, ClipboardDocumentListIcon,
  BuildingStorefrontIcon, CalculatorIcon,
  ArrowDownTrayIcon, ArrowUpTrayIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import SearchSelectPopup from '@/components/SearchSelectPopup.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import FieldError from '@/components/form/FieldError.vue'
import StatusPill from '@/components/form/StatusPill.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'
import { useMasterDataStore } from '@/stores/masterData'

const { t } = useI18n()
const router               = useRouter()
const masterDataStore      = useMasterDataStore()
const stores               = ref([])
const customers            = ref([])
const vendors              = ref([])
const storeProducts        = ref([])
const loadingStoreProducts = ref(false)
const returnReasons        = ref([])
const form  = ref({
  date: new Date().toISOString().slice(0, 10),
  type: 'customer_return',
  storeId: '', customerId: '', vendorId: '', notes: '',
})
const items  = ref([])
const error  = ref('')
const saving = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors, errorOf } = useFieldErrors()
const pickerRef = ref(null)

let rowKeySeq = 0
const newKey = () => `r${++rowKeySeq}`

onMounted(async () => {
  try {
    const [storeRes, custRes, vendorRes] = await Promise.all([
      api.get('/erp/stock-return/stores-lookup'),
      api.get('/erp/customers', { params: { limit: 200 } }),
      api.get('/erp/vendors/all'),
    ])
    stores.value    = storeRes.data.data.stores
    customers.value = custRes.data.data.customers
    vendors.value   = vendorRes.data.data.vendors
  } catch (err) {
    console.error('Failed to load lookups:', err.message)
  }
  returnReasons.value = await masterDataStore.getValues('return-reasons')
})

watch(() => form.value.storeId, async (storeId) => {
  items.value = []
  storeProducts.value = []
  if (!storeId) return
  loadingStoreProducts.value = true
  try {
    const { data } = await api.get('/erp/stock-return/store-products', { params: { storeId } })
    storeProducts.value = data.data.products
  } catch (err) {
    console.error('Failed to load store products:', err.message)
  } finally {
    loadingStoreProducts.value = false
  }
})

const totalQty   = computed(() => items.value.reduce((s, i) => s + (Number(i.qty)  || 0), 0))
const totalValue = computed(() => items.value.reduce((s, i) => s + ((Number(i.qty) || 0) * (Number(i.cost) || 0)), 0))

const availableForPicker = computed(() => {
  const usedIds = new Set(items.value.map(it => it.productId).filter(Boolean))
  return storeProducts.value.filter(p => !usedIds.has(p.id))
})

function productName(id) {
  return storeProducts.value.find(p => p.id === id)?.name || ''
}
function productSku(id) {
  return storeProducts.value.find(p => p.id === id)?.sku || ''
}
function storeBalance(productId) {
  if (!productId) return 0
  return storeProducts.value.find(p => p.id === productId)?.stock ?? 0
}

// Vendor returns deplete the store. Warn when qty exceeds on-hand; customer
// returns add to stock, so they never overflow the available balance.
function rowWarn(item) {
  if (form.value.type !== 'vendor_return') return false
  return item.qty > storeBalance(item.productId)
}

function openPicker() {
  if (!form.value.storeId || !storeProducts.value.length) return
  pickerRef.value?.open()
}

function onBulkAdd(selectedProducts) {
  for (const p of selectedProducts) {
    items.value.push({ key: newKey(), productId: p.id, qty: 1, cost: 0, batchId: '', expiryDate: '', reason: '' })
  }
}

function duplicateRow(i) {
  const src = items.value[i]
  if (!src) return
  items.value.splice(i + 1, 0, {
    key: newKey(), productId: src.productId, qty: src.qty, cost: src.cost,
    batchId: src.batchId, expiryDate: src.expiryDate, reason: src.reason,
  })
}

function removeRow(i) {
  items.value.splice(i, 1)
}

const duplicateProductIds = computed(() => {
  const counts = new Map()
  for (const it of items.value) {
    if (!it.productId) continue
    counts.set(it.productId, (counts.get(it.productId) || 0) + 1)
  }
  const dups = new Set()
  for (const [id, n] of counts) if (n > 1) dups.add(id)
  return dups
})
function isDuplicate(item) {
  return !!item.productId && duplicateProductIds.value.has(item.productId)
}

const openDupKey = ref('')
function toggleDupPopover(item) {
  openDupKey.value = openDupKey.value === item.key ? '' : item.key
}
function onDocClickClosePopover(e) {
  if (!openDupKey.value) return
  if (e.target.closest('[data-dup-popover]')) return
  openDupKey.value = ''
}

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.date)    { setField('date',    t('common.errors.required', { field: t('erp.common.date') })); return }
  if (!form.value.storeId) { setField('storeId', t('common.errors.required', { field: t('erp.common.store') })); return }
  if (!items.value.length) { error.value = 'Add at least one item'; return }
  if (items.value.find(i => !i.productId || !i.qty || i.qty <= 0)) {
    error.value = 'All items must have a product and quantity > 0'; return
  }
  if (form.value.type === 'vendor_return' && items.value.find(i => i.qty > storeBalance(i.productId))) {
    error.value = 'Quantity exceeds available stock for one or more items'; return
  }
  saving.value = true
  try {
    const payload = {
      date:       form.value.date,
      type:       form.value.type,
      storeId:    form.value.storeId,
      notes:      form.value.notes,
      customerId: form.value.type === 'customer_return' ? (form.value.customerId || null) : null,
      vendorId:   form.value.type === 'vendor_return'   ? (form.value.vendorId   || null) : null,
      items: items.value.map(i => ({
        productId:  i.productId,
        qty:        i.qty,
        cost:       i.cost || 0,
        batchId:    i.batchId || null,
        expiryDate: i.expiryDate || null,
        reason:     i.reason || null,
      })),
    }
    const { data } = await api.post('/erp/stock-return', payload)
    router.push(`/erp/stock-return/${data.data.stockReturn.id}`)
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}

// Keyboard shortcuts: Ctrl+S save, Ctrl+L add items, Ctrl+D duplicate last row.
function onPageKeydown(e) {
  const ctrl = e.ctrlKey || e.metaKey
  if (!ctrl) return
  const key = e.key.toLowerCase()
  if (key === 's') { e.preventDefault(); save() }
  else if (key === 'l') { e.preventDefault(); openPicker() }
  else if (key === 'd') {
    if (!items.value.length) return
    e.preventDefault()
    duplicateRow(items.value.length - 1)
  }
}
onMounted(() => {
  document.addEventListener('keydown', onPageKeydown)
  document.addEventListener('mousedown', onDocClickClosePopover)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onPageKeydown)
  document.removeEventListener('mousedown', onDocClickClosePopover)
})
</script>
