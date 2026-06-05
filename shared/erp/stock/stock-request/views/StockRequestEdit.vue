<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.stockTransfer.edit')" :back-to="`/erp/stock-request/${route.params.id}`"
        :breadcrumb="[
          { label: t('erp.stockTransfer.title'), to: '/erp/stock-request' },
          { label: form.refNo || '…', to: `/erp/stock-request/${route.params.id}` },
          { label: t('common.edit') },
        ]">
        <template #badge>
          <StatusPill :label="t('erp.common.draft')" />
        </template>
        <template #actions>
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
          <HeaderSaveActions
            :cancel-to="`/erp/stock-request/${route.params.id}`"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.saving')"
            :save-label="t('common.save')"
            @save="save"
          />
        </template>
      </PageHeader>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-7 h-7 border-2 border-primary-500 border-t-transparent animate-spin"></div>
      </div>

      <!-- Not found / not editable -->
      <div v-else-if="loadError"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ loadError }}
          <RouterLink to="/erp/stock-request" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <div v-else class="space-y-5">

        <!-- Section 1: Transfer Info -->
        <FormCard :title="t('erp.stockTransfer.transferInfo')" :icon="ArrowsRightLeftIcon" icon-color="purple">
          <div class="grid grid-cols-2 gap-x-6 gap-y-5">

            <div>
              <FieldLabel :text="t('erp.common.date')" required />
              <DateInput ref="dateRef" v-model="form.date" :class="['w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors', errorOf('date') && 'input-error']" />
              <FieldError name="date" :errors="fieldErrors" />
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

            <div>
              <FieldLabel :text="t('erp.stockTransfer.fromStore')" required />
              <SearchSelect v-model="form.fromStoreId" :options="fromStoreOptions" :invalid="!!errorOf('fromStoreId')" :placeholder="t('erp.common.selectStore')">
                <template #option="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> ({{ option.code }})</span></template>
                <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> ({{ option.code }})</span></template>
              </SearchSelect>
              <FieldError name="fromStoreId" :errors="fieldErrors" />
            </div>

            <div>
              <FieldLabel :text="t('erp.stockTransfer.toStore')" required />
              <SearchSelect v-model="form.toStoreId" :options="toStoreOptions" :invalid="!!errorOf('toStoreId')" :placeholder="t('erp.common.selectStore')">
                <template #option="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> ({{ option.code }})</span></template>
                <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> ({{ option.code }})</span></template>
              </SearchSelect>
              <FieldError name="toStoreId" :errors="fieldErrors" />
            </div>

            <div v-if="form.fromStoreId && form.toStoreId" class="col-span-2">
              <div class="flex items-center gap-3 px-4 py-3 bg-violet-50 border border-violet-100">
                <BuildingStorefrontIcon class="w-4 h-4 text-violet-500 flex-shrink-0" />
                <span class="text-sm font-semibold text-violet-800 truncate">
                  {{ stores.find(s => s.id === form.fromStoreId)?.name }}
                </span>
                <ArrowRightIcon class="w-4 h-4 text-violet-400 flex-shrink-0" />
                <BuildingStorefrontIcon class="w-4 h-4 text-violet-500 flex-shrink-0" />
                <span class="text-sm font-semibold text-violet-800 truncate">
                  {{ stores.find(s => s.id === form.toStoreId)?.name }}
                </span>
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
                <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.stockTransfer.itemsToTransfer') }}</h2>
                <p v-if="items.length" class="text-[11px] text-[#9BA7B0]">
                  {{ items.length }} item{{ items.length !== 1 ? 's' : '' }}
                </p>
              </div>
            </div>
            <button @click="openPicker" type="button"
              :disabled="!form.fromStoreId || loadingStoreProducts || !storeProducts.length"
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

          <div v-if="!form.fromStoreId" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] flex items-center justify-center mb-4">
              <BuildingStorefrontIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">{{ t('erp.stockTransfer.selectStorePh') }}</p>
          </div>

          <div v-else-if="loadingStoreProducts" class="flex items-center justify-center py-16 text-[#9BA7B0] gap-2">
            <div class="w-4 h-4 border-2 border-primary-500 border-t-transparent animate-spin" />
            <span class="text-sm">{{ t('erp.stockTransfer.loadingProducts') }}</span>
          </div>

          <div v-else-if="!storeProducts.length" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] flex items-center justify-center mb-4">
              <ClipboardDocumentListIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">{{ t('erp.stockTransfer.noStoreProducts') }}</p>
          </div>

          <div v-else>
            <div v-if="!items.length" class="flex flex-col items-center justify-center py-16 text-center">
              <div class="w-14 h-14 bg-[#F1F5F9] flex items-center justify-center mb-4">
                <ClipboardDocumentListIcon class="w-7 h-7 text-[#CBD5E1]" />
              </div>
              <p class="text-sm font-semibold text-[#637381]">{{ t('erp.common.noItems') }}</p>
              <p class="text-xs text-[#9BA7B0] mt-1 mb-4">Click <strong>{{ t('erp.common.addItem') }}</strong> to pick products from the source store.</p>
              <button @click="openPicker" type="button"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-500
                       bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
                <PlusIcon class="w-4 h-4" />
                {{ t('erp.common.addItem') }}
              </button>
            </div>

            <div v-else>
              <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]
                          text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider"
                style="grid-template-columns: 2.5fr 7rem 8rem 2fr 4.5rem">
                <div>{{ t('erp.common.product') }}</div>
                <div class="text-right">{{ t('erp.stockTransfer.available') }}</div>
                <div class="text-right">{{ t('erp.stockTransfer.transferQty') }} <span class="text-red-400 normal-case">*</span></div>
                <div>{{ t('erp.common.notes') }}</div>
                <div></div>
              </div>

              <div class="divide-y divide-[#E2E8F0]">
                <div v-for="(item, i) in items" :key="item.key"
                  class="group grid items-center gap-3 px-5 py-3 transition-colors"
                  :class="item.qty > availableStock(item.productId) ? 'bg-red-50 hover:bg-red-50/80' : 'hover:bg-[#F7F9FC]'"
                  style="grid-template-columns: 2.5fr 7rem 8rem 2fr 4.5rem">

                  <div class="min-w-0 flex items-center gap-2">
                    <span class="font-mono text-[11px] text-[#9BA7B0] tabular-nums w-5 text-right flex-shrink-0">{{ i + 1 }}</span>
                    <div class="min-w-0">
                      <p class="text-sm text-[#1C2434] truncate">{{ productName(item.productId) || '—' }}</p>
                      <p v-if="productSku(item.productId)" class="text-[11px] font-mono text-[#9BA7B0] truncate">{{ productSku(item.productId) }}</p>
                    </div>
                  </div>

                  <div class="text-right">
                    <span v-if="item.productId"
                      class="font-mono text-sm font-semibold tabular-nums"
                      :class="availableStock(item.productId) > 0 ? 'text-green-700' : 'text-red-500'">
                      {{ availableStock(item.productId) }}
                    </span>
                    <span v-else class="text-[#CBD5E1]">—</span>
                  </div>

                  <input v-model.number="item.qty" type="number" min="0.01" step="0.01" placeholder="0"
                    class="w-full px-2.5 py-2 border text-sm text-right tabular-nums
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                    :class="item.qty > availableStock(item.productId)
                      ? 'border-red-400 text-red-600 focus:border-red-400'
                      : 'border-[#E2E8F0] text-violet-700 font-semibold focus:border-primary-400'" />

                  <input v-model="item.notes" type="text" :placeholder="t('erp.common.optional')"
                    class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm text-[#1C2434]
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                           transition-colors placeholder-[#CBD5E1]" />

                  <div class="flex items-center justify-end gap-1">
                    <div class="relative" data-dup-popover>
                      <button v-if="isDuplicate(item)" type="button"
                        tabindex="-1"
                        @click="toggleDupPopover(item)"
                        :aria-label="t('erp.stockTransfer.duplicateItemWarning')"
                        class="flex items-center justify-center w-5 h-5 hover:bg-amber-100 text-amber-500 transition-colors">
                        <ExclamationTriangleIcon class="w-4 h-4" />
                      </button>
                      <div v-if="openDupKey === item.key"
                        class="absolute z-20 right-full top-1/2 -translate-y-1/2 mr-2 w-60
                               bg-amber-50 border border-amber-200 shadow-lg p-2.5
                               text-[12px] text-amber-800 leading-snug">
                        <div class="flex items-start gap-1.5">
                          <ExclamationTriangleIcon class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>{{ t('erp.stockTransfer.duplicateItemWarning') }}</span>
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
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.stockTransfer.fromStore') }}</span>
              <span class="text-sm font-semibold text-[#374151] truncate">
                {{ stores.find(s => s.id === form.fromStoreId)?.name || '—' }}
              </span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.stockTransfer.toStore') }}</span>
              <span class="text-sm font-semibold text-[#374151] truncate">
                {{ stores.find(s => s.id === form.toStoreId)?.name || '—' }}
              </span>
            </div>
          </div>

          <div class="px-6 py-5 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('erp.stockTransfer.totalTransferQty') }}</p>
              <p class="text-3xl font-extrabold tabular-nums leading-none text-violet-600">{{ totalQty }}</p>
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
              <RouterLink :to="`/erp/stock-request/${route.params.id}`"
                class="px-5 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
                {{ t('common.cancel') }}
              </RouterLink>
              <button @click="save" :disabled="saving"
                class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold
                       bg-primary-500 text-white hover:bg-primary-600 shadow-sm
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  PlusIcon, TrashIcon, CheckIcon, ArrowPathIcon,
  ExclamationCircleIcon, ExclamationTriangleIcon,
  ArrowsRightLeftIcon, ArrowRightIcon,
  ClipboardDocumentListIcon, BuildingStorefrontIcon, CalculatorIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import SearchSelectPopup from '@/components/SearchSelectPopup.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useFormShortcuts } from '@/composables/useShortcuts'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import FieldError from '@/components/form/FieldError.vue'
import StatusPill from '@/components/form/StatusPill.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'

const { t }                = useI18n()
const route                = useRoute()
const router               = useRouter()

const stores               = ref([])
const storeProducts        = ref([])
const loadingStoreProducts = ref(false)

const form  = ref({ refNo: '', date: '', fromStoreId: '', toStoreId: '', notes: '' })
const dateRef = ref(null)

const { shortcuts } = useFormShortcuts({
  save: () => save(),
  cancel: () => router.push(`/erp/stock-request/${route.params.id}`),
  cancelLabel: 'Back to detail',
  extra: [
    { combo: 'ctrl+l', handler: () => openPicker(), hint: { key: 'Ctrl+L', label: 'Add items' } },
    { combo: 'ctrl+d', handler: () => { if (items.value.length) duplicateRow(items.value.length - 1) }, hint: { key: 'Ctrl+D', label: 'Duplicate last row' } },
  ],
})
const items = ref([])
const error = ref('')
const saving = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors, errorOf } = useFieldErrors()
const loading = ref(true)
const loadError = ref('')
const pickerRef = ref(null)

const fromStoreOptions = computed(() => stores.value.filter(s => s.id !== form.value.toStoreId))
const toStoreOptions   = computed(() => stores.value.filter(s => s.id !== form.value.fromStoreId))

let rowKeySeq = 0
const newKey = () => `r${++rowKeySeq}`

let initialFromStoreId = ''
let skipNextStoreWatch = false

onMounted(async () => {
  try {
    const [storesRes, reqRes] = await Promise.all([
      api.get('/erp/stock-request/stores-lookup'),
      api.get(`/erp/stock-request/${route.params.id}`),
    ])
    stores.value = storesRes.data.data.stores

    const req = reqRes.data.data.request
    if (!req) { loadError.value = 'Stock Transfer not found'; return }
    if (req.status !== 'draft') {
      loadError.value = 'Only draft transfers can be edited. This one is already ' + req.status + '.'
      return
    }

    form.value = {
      refNo:       req.refNo,
      date:        req.date,
      fromStoreId: req.fromStoreId,
      toStoreId:   req.toStoreId,
      notes:       req.notes || '',
    }
    initialFromStoreId = req.fromStoreId
    skipNextStoreWatch = true

    if (initialFromStoreId) {
      loadingStoreProducts.value = true
      try {
        const { data } = await api.get('/erp/stock-request/store-products', { params: { storeId: initialFromStoreId } })
        storeProducts.value = data.data.products
      } finally {
        loadingStoreProducts.value = false
      }
    }

    items.value = (req.items || []).map(i => ({
      key:       newKey(),
      productId: i.productId,
      qty:       Number(i.qty),
      notes:     i.notes || '',
    }))
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Failed to load transfer'
  } finally {
    loading.value = false
    await nextTick()
    dateRef.value?.$el?.focus()
  }
})

watch(() => form.value.fromStoreId, async (storeId) => {
  if (skipNextStoreWatch) { skipNextStoreWatch = false; return }
  items.value = []
  storeProducts.value = []
  if (!storeId) return
  loadingStoreProducts.value = true
  try {
    const { data } = await api.get('/erp/stock-request/store-products', { params: { storeId } })
    storeProducts.value = data.data.products
  } catch (err) {
    console.error('Failed to load store products:', err.message)
  } finally {
    loadingStoreProducts.value = false
  }
})

const totalQty = computed(() => items.value.reduce((s, i) => s + (parseFloat(i.qty) || 0), 0))

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
function availableStock(productId) {
  if (!productId) return 0
  return storeProducts.value.find(p => p.id === productId)?.stock ?? 0
}

function openPicker() {
  if (!form.value.fromStoreId || !storeProducts.value.length) return
  pickerRef.value?.open()
}

function onBulkAdd(selectedProducts) {
  for (const p of selectedProducts) {
    items.value.push({ key: newKey(), productId: p.id, qty: 1, notes: '' })
  }
}

function duplicateRow(i) {
  const src = items.value[i]
  if (!src) return
  items.value.splice(i + 1, 0, { key: newKey(), productId: src.productId, qty: src.qty, notes: src.notes })
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
  if (!form.value.date)        { setField('date',        t('common.errors.required', { field: t('erp.common.date') })); return }
  if (!form.value.fromStoreId) { setField('fromStoreId', t('common.errors.required', { field: t('erp.stockTransfer.fromStore') })); return }
  if (!form.value.toStoreId)   { setField('toStoreId',   t('common.errors.required', { field: t('erp.stockTransfer.toStore') })); return }
  if (form.value.fromStoreId === form.value.toStoreId) { error.value = t('erp.stockTransfer.sameStoreError'); return }
  if (!items.value.length) { error.value = 'Add at least one item'; return }
  if (items.value.find(i => !i.productId || !i.qty || i.qty <= 0)) {
    error.value = 'All items must have a product and quantity > 0'; return
  }
  const overStock = items.value.find(i => i.qty > availableStock(i.productId))
  if (overStock) { error.value = 'Quantity exceeds available stock for one or more items'; return }
  saving.value = true
  try {
    await api.put(`/erp/stock-request/${route.params.id}`, {
      date:        form.value.date,
      fromStoreId: form.value.fromStoreId,
      toStoreId:   form.value.toStoreId,
      notes:       form.value.notes,
      items:       items.value.map(i => ({ productId: i.productId, qty: i.qty, notes: i.notes })),
    })
    router.push(`/erp/stock-request/${route.params.id}`)
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onDocClickClosePopover))
onUnmounted(() => document.removeEventListener('mousedown', onDocClickClosePopover))
</script>
