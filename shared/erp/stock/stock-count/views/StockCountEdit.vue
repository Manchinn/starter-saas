<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.stockCount.edit')" :back-to="`/erp/stock-count/${route.params.id}`"
        :breadcrumb="[
          { label: t('erp.stockCount.title'), to: '/erp/stock-count' },
          { label: form.refNo || '…', to: `/erp/stock-count/${route.params.id}` },
          { label: t('common.edit') },
        ]">
        <template #badge>
          <StatusPill :label="t('erp.common.draft')" />
        </template>
        <template #actions>
          <HeaderSaveActions
            :cancel-to="`/erp/stock-count/${route.params.id}`"
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
        <div class="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Not found / not editable -->
      <div v-else-if="loadError"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ loadError }}
          <RouterLink to="/erp/stock-count" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <div v-else class="space-y-5">

        <!-- Lock conflict warning (a different draft holds the lock on this store) -->
        <div v-if="lockedStoreInfo && lockedStoreInfo.id !== route.params.id"
          class="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl">
          <ExclamationTriangleIcon class="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p class="font-semibold">{{ t('erp.stockCount.storeLocked') }}</p>
            <p class="text-xs mt-0.5">
              This store is currently locked by another draft (<strong>{{ lockedStoreInfo.refNo }}</strong>).
              Edits are still allowed but movements are blocked by that draft.
            </p>
          </div>
        </div>

        <!-- Section 1: Count Info -->
        <FormCard :title="t('erp.stockCount.countDetails')" :icon="ClipboardDocumentCheckIcon" icon-color="purple">
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
              <p v-if="form.storeId !== initialStoreId" class="mt-1 text-[11px] text-amber-600 flex items-start gap-1">
                <ExclamationTriangleIcon class="w-3 h-3 mt-0.5 flex-shrink-0" />
                Changing store will reload products and discard counted quantities.
              </p>
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
              <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                {{ t('erp.stockCount.stockMovement') }}
              </label>
              <label class="inline-flex items-center gap-2 px-3.5 py-2.5 border border-[#E2E8F0] rounded-xl cursor-pointer select-none w-full">
                <input type="checkbox" v-model="form.movementLocked"
                  class="w-4 h-4 rounded border-[#CBD5E1] text-primary-500 focus:ring-primary-500/40" />
                <LockClosedIcon v-if="form.movementLocked" class="w-4 h-4 text-red-600" />
                <LockOpenIcon   v-else                    class="w-4 h-4 text-[#9BA7B0]" />
                <span :class="form.movementLocked ? 'text-red-600 font-semibold' : 'text-[#637381]'"
                  class="text-sm">
                  {{ t('erp.stockCount.lockMovements') }}
                </span>
              </label>
            </div>

          </div>
        </FormCard>

        <!-- Section 2: Products -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <ClipboardDocumentListIcon class="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.stockCount.colProduct') }}s</h2>
                <p v-if="items.length" class="text-[11px] text-[#9BA7B0]">
                  {{ items.length }} product{{ items.length !== 1 ? 's' : '' }} · variance = counted − system
                </p>
              </div>
            </div>
            <button v-if="form.storeId" @click="reloadStoreProducts" type="button"
              :disabled="loadingProducts"
              :title="`${t('erp.stockCount.reloadProducts')}  (Ctrl+R)`"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#637381]
                     bg-white hover:bg-[#F7F9FC] border border-[#E2E8F0] rounded-lg
                     transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <ArrowPathIcon class="w-3.5 h-3.5" :class="loadingProducts ? 'animate-spin' : ''" />
              {{ t('erp.stockCount.reloadProducts') }}
            </button>
          </div>

          <div v-if="!form.storeId" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mb-4">
              <BuildingStorefrontIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">{{ t('erp.stockCount.selectStore') }}</p>
          </div>

          <div v-else-if="loadingProducts" class="flex items-center justify-center py-16 text-[#9BA7B0] gap-2">
            <div class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span class="text-sm">{{ t('erp.stockCount.loadingProducts') }}</span>
          </div>

          <div v-else-if="!items.length" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mb-4">
              <ClipboardDocumentListIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">{{ t('erp.stockIssue.noStoreProducts') }}</p>
          </div>

          <div v-else>
            <!-- Variance summary bar -->
            <div class="flex items-center gap-6 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]
                        text-[11px] font-semibold text-[#637381]">
              <span class="inline-flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span class="text-green-700">+{{ positiveVarianceCount }} over</span>
              </span>
              <span class="inline-flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span class="text-red-600">{{ negativeVarianceCount }} short</span>
              </span>
              <span class="inline-flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]"></span>
                <span class="text-[#637381]">{{ zeroVarianceCount }} matched</span>
              </span>
            </div>

            <!-- Header row -->
            <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]
                        text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider"
              style="grid-template-columns: 2.5fr 8rem 7rem 8rem 7rem">
              <div>{{ t('erp.stockCount.colProduct') }}</div>
              <div>{{ t('erp.stockCount.colSku') }}</div>
              <div class="text-right">{{ t('erp.stockCount.colSystemQty') }}</div>
              <div class="text-right">{{ t('erp.stockCount.colCountedQty') }} <span class="text-red-400 normal-case">*</span></div>
              <div class="text-right">{{ t('erp.stockCount.colVariance') }}</div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <div v-for="(item, i) in items" :key="item.productId"
                class="grid items-center gap-3 px-5 py-3 transition-colors hover:bg-[#F7F9FC]"
                :class="variance(item) !== 0 ? '' : ''"
                style="grid-template-columns: 2.5fr 8rem 7rem 8rem 7rem">

                <div class="min-w-0 flex items-center gap-2">
                  <span class="font-mono text-[11px] text-[#9BA7B0] tabular-nums w-5 text-right flex-shrink-0">{{ i + 1 }}</span>
                  <p class="text-sm text-[#1C2434] truncate">{{ item.name }}</p>
                </div>

                <div class="font-mono text-[11px] text-[#9BA7B0] truncate">{{ item.sku || '—' }}</div>

                <div class="text-right text-sm text-[#637381] font-mono tabular-nums">{{ item.systemQty }}</div>

                <input v-model.number="item.countedQty" type="number" min="0" step="1" placeholder="0"
                  class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm text-right tabular-nums text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />

                <div class="text-right font-bold text-sm tabular-nums"
                  :class="variance(item) > 0 ? 'text-green-700' : variance(item) < 0 ? 'text-red-600' : 'text-[#CBD5E1]'">
                  {{ variance(item) > 0 ? '+' : '' }}{{ variance(item) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Global error -->
        <div v-if="error"
          class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700
                 text-sm px-4 py-3.5 rounded-xl">
          <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{{ error }}</span>
        </div>

        <!-- Summary card -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5">
            <CalculatorIcon class="w-4 h-4 text-[#9BA7B0]" />
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.common.summary') }}</h2>
          </div>

          <div class="px-6 py-4 grid grid-cols-3 gap-6">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.stockCount.totalProducts') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">{{ items.length }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.stockCount.variancesFound') }}</span>
              <span class="text-sm font-semibold tabular-nums"
                :class="varianceCount > 0 ? 'text-amber-700' : 'text-green-700'">
                {{ varianceCount }}
              </span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.stockCount.netVariance') }}</span>
              <span class="text-sm font-semibold tabular-nums"
                :class="netVariance > 0 ? 'text-green-700' : netVariance < 0 ? 'text-red-600' : 'text-[#1C2434]'">
                {{ netVariance > 0 ? '+' : '' }}{{ netVariance }}
              </span>
            </div>
          </div>

          <div class="px-6 py-5 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('erp.stockCount.netVariance') }}</p>
              <p class="text-3xl font-extrabold tabular-nums leading-none"
                :class="netVariance > 0 ? 'text-green-600' : netVariance < 0 ? 'text-red-600' : 'text-[#1C2434]'">
                {{ netVariance > 0 ? '+' : '' }}{{ netVariance }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <div class="hidden lg:flex items-center gap-3 text-[11px] text-[#9BA7B0] mr-1">
                <span class="flex items-center gap-1">
                  <kbd class="px-1.5 py-0.5 rounded border border-[#E2E8F0] bg-white font-mono text-[10px]">Ctrl+S</kbd>
                  <span>save</span>
                </span>
                <span class="flex items-center gap-1">
                  <kbd class="px-1.5 py-0.5 rounded border border-[#E2E8F0] bg-white font-mono text-[10px]">Ctrl+R</kbd>
                  <span>reload</span>
                </span>
              </div>
              <RouterLink :to="`/erp/stock-count/${route.params.id}`"
                class="px-5 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
                {{ t('common.cancel') }}
              </RouterLink>
              <button @click="save" :disabled="saving || !items.length"
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  CheckIcon, ArrowPathIcon,
  ExclamationCircleIcon, ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon, ClipboardDocumentListIcon,
  BuildingStorefrontIcon, CalculatorIcon,
  LockClosedIcon, LockOpenIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import FieldError from '@/components/form/FieldError.vue'
import StatusPill from '@/components/form/StatusPill.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'

const { t }     = useI18n()
const route     = useRoute()
const router    = useRouter()

const stores         = ref([])
const items          = ref([])
const form           = ref({ refNo: '', date: '', storeId: '', notes: '', movementLocked: false })
const error          = ref('')
const saving         = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors, errorOf } = useFieldErrors()
const loading        = ref(true)
const loadError      = ref('')
const loadingProducts = ref(false)
const lockedStoreInfo = ref(null)

let initialStoreId = ''
let skipNextStoreWatch = false

onMounted(async () => {
  try {
    const [storesRes, scRes] = await Promise.all([
      api.get('/erp/stock-count/stores-lookup'),
      api.get(`/erp/stock-count/${route.params.id}`),
    ])
    stores.value = storesRes.data.data.stores

    const sc = scRes.data.data.stockCount
    if (!sc) { loadError.value = 'Stock Count not found'; return }
    if (sc.status !== 'draft') {
      loadError.value = 'Only draft stock counts can be edited. This one is already ' + sc.status + '.'
      return
    }

    form.value = {
      refNo:          sc.refNo,
      date:           sc.date,
      storeId:        sc.storeId,
      notes:          sc.notes || '',
      movementLocked: !!sc.movementLocked,
    }
    initialStoreId = sc.storeId
    skipNextStoreWatch = true

    // Hydrate items from the saved count. We keep the saved systemQty/countedQty
    // rather than re-fetching from the store, so the user can pick up exactly
    // where they left off. Reload button re-fetches if they want fresh system qty.
    items.value = (sc.items || []).map(i => ({
      productId:  i.productId,
      name:       i.product?.name || '',
      sku:        i.product?.sku  || '',
      systemQty:  parseFloat(i.systemQty),
      countedQty: parseFloat(i.countedQty),
    }))

    // Surface lock conflicts so users don't accidentally save into a store that
    // another draft has locked.
    await checkStoreLockStatus()
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Failed to load stock count'
  } finally {
    loading.value = false
  }
})

watch(() => form.value.storeId, async (storeId) => {
  if (skipNextStoreWatch) { skipNextStoreWatch = false; return }
  items.value = []
  lockedStoreInfo.value = null
  if (!storeId) return
  await Promise.all([loadStoreProducts(), checkStoreLockStatus()])
})

async function checkStoreLockStatus() {
  if (!form.value.storeId) return
  try {
    const { data } = await api.get(`/erp/stock-count/check-lock/${form.value.storeId}`)
    lockedStoreInfo.value = data.data.isLocked ? data.data.lockedBy : null
  } catch (err) {
    console.error('Failed to check store lock:', err)
  }
}

async function loadStoreProducts() {
  if (!form.value.storeId) return
  loadingProducts.value = true
  try {
    const { data } = await api.get('/erp/stock-count/store-products', { params: { storeId: form.value.storeId } })
    items.value = data.data.products.map(p => ({
      productId:  p.productId,
      name:       p.name,
      sku:        p.sku,
      systemQty:  p.systemQty,
      countedQty: p.systemQty,
    }))
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load products'
  } finally {
    loadingProducts.value = false
  }
}

// Manual reload — preserves the user's intent to refresh system qty without
// changing the store. We re-fetch and re-apply the user's existing counted
// values so they don't lose progress.
async function reloadStoreProducts() {
  if (!form.value.storeId) return
  const prevCounted = new Map(items.value.map(i => [i.productId, i.countedQty]))
  await loadStoreProducts()
  for (const it of items.value) {
    if (prevCounted.has(it.productId)) it.countedQty = prevCounted.get(it.productId)
  }
}

function variance(item) {
  return (item.countedQty ?? 0) - (item.systemQty ?? 0)
}

const varianceCount         = computed(() => items.value.filter(i => variance(i) !== 0).length)
const netVariance           = computed(() => items.value.reduce((s, i) => s + variance(i), 0))
const positiveVarianceCount = computed(() => items.value.filter(i => variance(i) > 0).length)
const negativeVarianceCount = computed(() => items.value.filter(i => variance(i) < 0).length)
const zeroVarianceCount     = computed(() => items.value.filter(i => variance(i) === 0).length)

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.date)    { setField('date',    t('common.errors.required', { field: t('erp.common.date') })); return }
  if (!form.value.storeId) { setField('storeId', t('common.errors.required', { field: t('erp.common.store') })); return }
  if (!items.value.length) { error.value = 'Load products before saving'; return }

  saving.value = true
  try {
    await api.put(`/erp/stock-count/${route.params.id}`, {
      date:           form.value.date,
      storeId:        form.value.storeId,
      notes:          form.value.notes,
      movementLocked: form.value.movementLocked,
      items: items.value.map(i => ({
        productId:  i.productId,
        systemQty:  i.systemQty,
        countedQty: i.countedQty,
      })),
    })
    router.push(`/erp/stock-count/${route.params.id}`)
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}

// Keyboard shortcuts: Ctrl+S save, Ctrl+R reload products.
function onPageKeydown(e) {
  const ctrl = e.ctrlKey || e.metaKey
  if (!ctrl) return
  const key = e.key.toLowerCase()
  if (key === 's') { e.preventDefault(); save() }
  else if (key === 'r') {
    // Only intercept if a store is selected — otherwise let the browser refresh.
    if (!form.value.storeId) return
    e.preventDefault()
    reloadStoreProducts()
  }
}
onMounted(() => document.addEventListener('keydown', onPageKeydown))
onUnmounted(() => document.removeEventListener('keydown', onPageKeydown))
</script>
