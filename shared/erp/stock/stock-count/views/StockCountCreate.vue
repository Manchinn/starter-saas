<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.stockCount.new')" back-to="/erp/stock-count"
        :breadcrumb="[
          { label: t('erp.stockCount.title'), to: '/erp/stock-count' },
          { label: t('erp.stockCount.new') },
        ]">
        <template #badge>
          <StatusPill :label="t('erp.common.draft')" />
        </template>
        <template #actions>
          <KeyboardShortcuts :shortcuts="pageShortcuts" width="w-48" />
          <HeaderSaveActions
            cancel-to="/erp/stock-count"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.saving')"
            :save-label="t('erp.common.saveDraft')"
            @save="save"
          />
        </template>
      </PageHeader>

      <!-- Existing Lock Warning -->
      <div v-if="lockedStoreInfo" class="bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
        <ExclamationTriangleIcon class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-semibold text-amber-800">{{ t('erp.stockCount.storeLocked') }}</p>
          <p class="text-xs text-amber-700 mt-1">
            This store is already locked for movements by another stock count (<strong>{{ lockedStoreInfo.refNo }}</strong>).
            You can still create this draft, but movements are already being blocked.
          </p>
        </div>
      </div>

      <div class="space-y-5">

        <!-- Section 1: Count Info -->
        <FormCard :title="t('erp.stockCount.countDetails')" :icon="ClipboardDocumentCheckIcon" icon-color="purple">
          <div class="grid grid-cols-2 gap-x-6 gap-y-5">

            <div>
              <FieldLabel :text="t('erp.common.date')" required />
              <DateInput ref="dateRef" v-model="form.date" :class="['w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors', errorOf('date') && 'input-error']" />
              <FieldError name="date" :errors="fieldErrors" />
            </div>

            <div>
              <FieldLabel :text="t('erp.common.store')" required />
              <SearchSelect v-model="form.storeId" :options="storeOptions" :invalid="!!errorOf('storeId')" :placeholder="t('erp.common.selectStore')" @change="onStoreChange" />
              <FieldError name="storeId" :errors="fieldErrors" />
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
              <label class="inline-flex items-center gap-2 px-3.5 py-2.5 border border-[#E2E8F0] cursor-pointer select-none w-full">
                <input type="checkbox" v-model="form.movementLocked"
                  class="w-4 h-4 border-[#CBD5E1] text-primary-500 focus:ring-primary-500/40" />
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
        <div class="bg-white border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-green-50 flex items-center justify-center flex-shrink-0">
                <ClipboardDocumentListIcon class="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.stockCount.colProduct') }}s</h2>
                <p class="text-xs text-[#9BA7B0] mt-0.5">Enter the physically counted quantity for each product. Variance = Counted − System.</p>
              </div>
            </div>
            <button v-if="form.storeId && !loadingProducts" @click="loadStoreProducts" type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#637381]
                     bg-white hover:bg-[#F7F9FC] border border-[#E2E8F0]
                     transition-colors disabled:opacity-40">
              <ArrowPathIcon class="w-3.5 h-3.5" />
              {{ t('erp.stockCount.reloadProducts') }}
            </button>
          </div>

          <div v-if="!form.storeId" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] flex items-center justify-center mb-4">
              <BuildingStorefrontIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">{{ t('erp.stockCount.selectStore') }}</p>
          </div>

          <div v-else-if="loadingProducts" class="flex items-center justify-center py-16 text-[#9BA7B0] gap-2">
            <div class="w-4 h-4 border-2 border-primary-500 border-t-transparent animate-spin" />
            <span class="text-sm">{{ t('erp.stockCount.loadingProducts') }}</span>
          </div>

          <div v-else-if="!items.length" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] flex items-center justify-center mb-4">
              <ClipboardDocumentListIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">{{ t('erp.stockIssue.noStoreProducts') }}</p>
          </div>

          <div v-else>
            <!-- Variance summary bar -->
            <div class="flex items-center gap-6 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]
                        text-[11px] font-semibold text-[#637381]">
              <span class="inline-flex items-center gap-1">
                <span class="w-1.5 h-1.5 bg-green-500"></span>
                <span class="text-green-700">+{{ positiveVarianceCount }} over</span>
              </span>
              <span class="inline-flex items-center gap-1">
                <span class="w-1.5 h-1.5 bg-red-500"></span>
                <span class="text-red-600">{{ negativeVarianceCount }} short</span>
              </span>
              <span class="inline-flex items-center gap-1">
                <span class="w-1.5 h-1.5 bg-[#CBD5E1]"></span>
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
              <div v-for="(item, i) in items" :key="i"
                class="grid items-center gap-3 px-5 py-3 transition-colors hover:bg-[#F7F9FC]"
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
                 text-sm px-4 py-3.5">
          <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{{ error }}</span>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowPathIcon, ExclamationCircleIcon, ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon, ClipboardDocumentListIcon,
  BuildingStorefrontIcon, LockClosedIcon, LockOpenIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import FieldError from '@/components/form/FieldError.vue'
import StatusPill from '@/components/form/StatusPill.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'

const { t } = useI18n()
const router = useRouter()
const stores = ref([])
const storeOptions = computed(() => stores.value.map(s => ({ id: s.id, name: `${s.name}${s.code ? ` (${s.code})` : ''}` })))
const items = ref([])
const form = ref({ date: new Date().toISOString().slice(0, 10), storeId: '', notes: '', movementLocked: false })
const error = ref('')
const saving = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors, errorOf } = useFieldErrors()
const loadingProducts = ref(false)
const lockedStoreInfo = ref(null)
const dateRef = ref(null)

const pageShortcuts = [
  { key: 'Ctrl+S', label: 'Save draft' },
  { key: 'Escape', label: 'Back to list' },
]

function onPageKeydown(e) {
  if (e.key === 'Escape' && !e.ctrlKey && !e.metaKey) { router.push('/erp/stock-count'); return }
  const ctrl = e.ctrlKey || e.metaKey
  if (!ctrl) return
  if (e.key.toLowerCase() === 's') { e.preventDefault(); save() }
}

onMounted(async () => {
  dateRef.value?.$el?.focus()
  document.addEventListener('keydown', onPageKeydown)
  try {
    const { data } = await api.get('/erp/stock-count/stores-lookup')
    stores.value = data.data.stores
  } catch (err) {
    console.error('Failed to load stores:', err.message)
  }
})
onUnmounted(() => document.removeEventListener('keydown', onPageKeydown))

async function onStoreChange() {
  items.value = []
  lockedStoreInfo.value = null
  if (form.value.storeId) {
    await Promise.all([
      loadStoreProducts(),
      checkStoreLockStatus()
    ])
  }
}

async function checkStoreLockStatus() {
  try {
    const { data } = await api.get(`/erp/stock-count/check-lock/${form.value.storeId}`)
    if (data.data.isLocked) {
      lockedStoreInfo.value = data.data.lockedBy
    }
  } catch (err) {
    console.error('Failed to check store lock:', err)
  }
}

async function loadStoreProducts() {
  loadingProducts.value = true
  try {
    const { data } = await api.get('/erp/stock-count/store-products', { params: { storeId: form.value.storeId } })
    items.value = data.data.products.map((p) => ({
      productId: p.productId,
      name: p.name,
      sku: p.sku,
      systemQty: p.systemQty,
      countedQty: p.systemQty,
    }))
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load products'
  } finally {
    loadingProducts.value = false
  }
}

function variance(item) {
  return (item.countedQty ?? 0) - (item.systemQty ?? 0)
}

const positiveVarianceCount = computed(() => items.value.filter((i) => variance(i) > 0).length)
const negativeVarianceCount = computed(() => items.value.filter((i) => variance(i) < 0).length)
const zeroVarianceCount     = computed(() => items.value.filter((i) => variance(i) === 0).length)

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.date)    { setField('date',    t('common.errors.required', { field: t('erp.common.date') })); return }
  if (!form.value.storeId) { setField('storeId', t('common.errors.required', { field: t('erp.common.store') })); return }
  if (!items.value.length) { error.value = 'Load products before saving'; return }

  saving.value = true
  try {
    const payload = {
      ...form.value,
      items: items.value.map((i) => ({
        productId: i.productId,
        systemQty: i.systemQty,
        countedQty: i.countedQty,
      })),
    }
    const { data } = await api.post('/erp/stock-count', payload)
    router.push(`/erp/stock-count/${data.data.stockCount.id}`)
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>
