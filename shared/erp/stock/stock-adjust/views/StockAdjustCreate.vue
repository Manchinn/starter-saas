<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Page Header -->
      <div class="flex items-start gap-4">
        <RouterLink to="/erp/stock-adjust"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white border border-transparent
                 hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5">
            <h1 class="text-xl font-bold text-[#1C2434]">{{ t('erp.stockAdjust.new') }}</h1>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                         bg-amber-50 text-amber-600 border border-amber-200">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Draft
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/stock-adjust" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.stockAdjust.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ t('erp.stockAdjust.new') }}</span>
          </nav>
        </div>
        <div class="flex items-center gap-2.5 flex-shrink-0">
          <RouterLink to="/erp/stock-adjust" class="btn-secondary">{{ t('common.cancel') }}</RouterLink>
          <button @click="save" :disabled="saving" class="btn-primary gap-2">
            <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
            <CheckIcon v-else class="w-4 h-4" />
            {{ saving ? t('erp.common.saving') : t('erp.common.saveDraft') }}
          </button>
        </div>
      </div>

      <div class="space-y-5">

        <!-- Section 1: Adjustment Info -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <AdjustmentsHorizontalIcon class="w-4 h-4 text-amber-500" />
            </div>
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.common.header') }}</h2>
          </div>
          <div class="px-6 py-5">
            <div class="grid grid-cols-2 gap-x-6 gap-y-5">

              <!-- Date -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.common.date') }} <span class="text-red-500 normal-case font-normal">*</span>
                </label>
                <input v-model="form.date" type="date"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
              </div>

              <!-- Store -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.common.store') }} <span class="text-red-500 normal-case font-normal">*</span>
                </label>
                <select v-model="form.storeId"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm bg-white text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors">
                  <option value="">{{ t('erp.common.selectStore') }}</option>
                  <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}{{ s.code ? ` (${s.code})` : '' }}</option>
                </select>
              </div>

              <!-- Reason -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.stockAdjust.reason') }}
                </label>
                <input v-model="form.reason" type="text" placeholder="e.g. Damaged goods, Stocktake"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors placeholder-[#CBD5E1]" />
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.common.notes') }}
                </label>
                <input v-model="form.notes" type="text" placeholder="Optional notes"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors placeholder-[#CBD5E1]" />
              </div>

            </div>
          </div>
        </div>

        <!-- Section 2: Items -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <ClipboardDocumentListIcon class="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.common.items') }}</h2>
                <p v-if="items.length" class="text-[11px] text-[#9BA7B0]">
                  {{ items.length }} item{{ items.length !== 1 ? 's' : '' }}
                </p>
              </div>
            </div>
            <button @click="addRow" type="button"
              :disabled="!form.storeId || loadingStoreProducts || (storeProducts.length > 0 && allUsedIds.length >= storeProducts.length)"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-primary-500
                     bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg
                     transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.common.addItem') }}
            </button>
          </div>

          <!-- No store selected -->
          <div v-if="!form.storeId" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mb-4">
              <BuildingStorefrontIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">No store selected</p>
            <p class="text-xs text-[#9BA7B0] mt-1">Select a store above to load available products.</p>
          </div>

          <!-- Loading store products -->
          <div v-else-if="loadingStoreProducts" class="flex items-center justify-center py-16 text-[#9BA7B0] gap-2">
            <div class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span class="text-sm">Loading products…</span>
          </div>

          <!-- Items table -->
          <div v-else>

            <!-- Empty state -->
            <div v-if="!items.length" class="flex flex-col items-center justify-center py-16 text-center">
              <div class="w-14 h-14 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mb-4">
                <ClipboardDocumentListIcon class="w-7 h-7 text-[#CBD5E1]" />
              </div>
              <p class="text-sm font-semibold text-[#637381]">{{ t('erp.common.noItems') }}</p>
              <p class="text-xs text-[#9BA7B0] mt-1 mb-4">Add products to adjust their stock quantities.</p>
              <button @click="addRow" type="button"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-500
                       bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors">
                <PlusIcon class="w-4 h-4" />
                {{ t('erp.common.addItem') }}
              </button>
            </div>

            <div v-else>
              <!-- Header row -->
              <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]
                          text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider"
                style="grid-template-columns: 2.5fr 7rem 8rem 2fr 2rem">
                <div>{{ t('erp.common.product') }}</div>
                <div class="text-right">{{ t('erp.stockAdjust.storeBalance') }}</div>
                <div class="text-right">{{ t('erp.stockAdjust.adjQty') }} <span class="normal-case font-normal">(+/−)</span></div>
                <div>{{ t('erp.common.notes') }}</div>
                <div></div>
              </div>

              <div class="divide-y divide-[#E2E8F0]">
                <div v-for="(item, i) in items" :key="i"
                  class="group grid items-center gap-3 px-5 py-3 transition-colors"
                  :class="item.qty < 0 && Math.abs(item.qty) > storeBalance(item.productId)
                    ? 'bg-red-50 hover:bg-red-50/80'
                    : 'hover:bg-[#F7F9FC]'"
                  style="grid-template-columns: 2.5fr 7rem 8rem 2fr 2rem">

                  <select v-model="item.productId"
                    class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm bg-white text-[#1C2434]
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors">
                    <option value="">{{ t('erp.common.selectProduct') }}</option>
                    <option v-for="p in availableProducts(i)" :key="p.id" :value="p.id">
                      {{ p.name }}{{ p.sku ? ` [${p.sku}]` : '' }}
                    </option>
                  </select>

                  <div class="text-right">
                    <span v-if="item.productId"
                      class="font-mono text-sm font-semibold tabular-nums"
                      :class="storeBalance(item.productId) > 0 ? 'text-[#374151]' : 'text-[#9BA7B0]'">
                      {{ storeBalance(item.productId) }}
                    </span>
                    <span v-else class="text-[#CBD5E1]">—</span>
                  </div>

                  <input v-model.number="item.qty" type="number" placeholder="0"
                    class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm text-right tabular-nums
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors"
                    :class="item.qty > 0 ? 'text-green-700 font-semibold' : item.qty < 0 ? 'text-red-600 font-semibold' : 'text-[#1C2434]'" />

                  <input v-model="item.notes" type="text" placeholder="Optional"
                    class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm text-[#1C2434]
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                           transition-colors placeholder-[#CBD5E1]" />

                  <button @click="removeRow(i)" type="button"
                    class="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center
                           text-[#CBD5E1] hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                    <TrashIcon class="w-3.5 h-3.5" />
                  </button>
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
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.common.items') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">{{ items.length }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Stock In <span class="text-green-600">(+)</span></span>
              <span class="text-sm font-semibold text-green-700 tabular-nums">{{ totalIn }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Stock Out <span class="text-red-500">(−)</span></span>
              <span class="text-sm font-semibold text-red-600 tabular-nums">{{ totalOut }}</span>
            </div>
          </div>

          <div class="px-6 py-5 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">Net Quantity Change</p>
              <p class="text-3xl font-extrabold tabular-nums leading-none"
                :class="netQty > 0 ? 'text-green-600' : netQty < 0 ? 'text-red-600' : 'text-primary-500'">
                {{ netQty > 0 ? '+' : '' }}{{ netQty }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <RouterLink to="/erp/stock-adjust"
                class="px-5 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
                {{ t('common.cancel') }}
              </RouterLink>
              <button @click="save" :disabled="saving"
                class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold
                       bg-primary-500 text-white rounded-xl hover:bg-primary-600 shadow-sm
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
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  ArrowLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon,
  CheckIcon, ExclamationCircleIcon, ArrowPathIcon,
  AdjustmentsHorizontalIcon, ClipboardDocumentListIcon,
  BuildingStorefrontIcon, CalculatorIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const { t } = useI18n()
const router               = useRouter()
const stores               = ref([])
const storeProducts        = ref([])
const loadingStoreProducts = ref(false)
const form  = ref({ date: new Date().toISOString().slice(0, 10), storeId: '', reason: '', notes: '' })
const items = ref([])
const error = ref('')
const saving = ref(false)

onMounted(async () => {
  try {
    const { data } = await api.get('/erp/stock-adjust/stores-lookup')
    stores.value = data.data.stores
  } catch (err) {
    console.error('Failed to load stores:', err.message)
  }
})

watch(() => form.value.storeId, async (storeId) => {
  items.value = []
  storeProducts.value = []
  if (!storeId) return
  loadingStoreProducts.value = true
  try {
    const { data } = await api.get('/erp/stock-adjust/store-products', { params: { storeId } })
    storeProducts.value = data.data.products
  } catch (err) {
    console.error('Failed to load store products:', err.message)
  } finally {
    loadingStoreProducts.value = false
  }
})

const allUsedIds = computed(() => items.value.map(it => it.productId).filter(Boolean))

function availableProducts(rowIndex) {
  const otherIds = items.value
    .filter((_, i) => i !== rowIndex)
    .map(it => it.productId)
    .filter(Boolean)
  return storeProducts.value.filter(p => !otherIds.includes(p.id))
}

function storeBalance(productId) {
  if (!productId) return 0
  return storeProducts.value.find(p => p.id === productId)?.stock ?? 0
}

function addRow() {
  if (items.value.length >= storeProducts.value.length && storeProducts.value.length > 0) return
  items.value.push({ productId: '', qty: 0, notes: '' })
}

function removeRow(i) {
  items.value.splice(i, 1)
}

const totalIn  = computed(() => items.value.reduce((s, i) => s + (i.qty > 0 ? i.qty : 0), 0))
const totalOut = computed(() => items.value.reduce((s, i) => s + (i.qty < 0 ? i.qty : 0), 0))
const netQty   = computed(() => items.value.reduce((s, i) => s + (parseFloat(i.qty) || 0), 0))

async function save() {
  error.value = ''
  if (!form.value.date)    { error.value = 'Date is required'; return }
  if (!form.value.storeId) { error.value = 'Store is required'; return }
  if (!items.value.length) { error.value = 'Add at least one item'; return }
  if (items.value.find(i => !i.productId || i.qty === 0)) {
    error.value = 'All items must have a product and non-zero quantity'; return
  }
  saving.value = true
  try {
    const { data } = await api.post('/erp/stock-adjust', { ...form.value, items: items.value })
    router.push(`/erp/stock-adjust/${data.data.adjustment.id}`)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>
