<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.stockTransfer.new')" back-to="/erp/stock-request"
        :breadcrumb="[
          { label: t('erp.stockTransfer.title'), to: '/erp/stock-request' },
          { label: t('erp.stockTransfer.new') },
        ]">
        <template #badge>
          <StatusPill label="Draft" />
        </template>
        <template #actions>
          <RouterLink to="/erp/stock-request" class="btn-secondary">{{ t('common.cancel') }}</RouterLink>
          <button @click="save" :disabled="saving" class="btn-primary gap-2">
            <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
            <CheckIcon v-else class="w-4 h-4" />
            {{ saving ? t('erp.common.saving') : t('erp.common.saveDraft') }}
          </button>
        </template>
      </PageHeader>

      <div class="space-y-5">

        <!-- Section 1: Transfer Details -->
        <FormCard :title="t('erp.stockTransfer.transferDetails')" :icon="ArrowsRightLeftIcon" icon-color="purple">
          <div class="grid grid-cols-2 gap-x-6 gap-y-5">

              <!-- Date -->
              <div>
                <FieldLabel :text="t('erp.common.date')" required />
                <DateInput v-model="form.date" class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
              </div>

              <!-- Notes -->
              <div>
                <FieldLabel :text="t('erp.common.notes')" />
                <input v-model="form.notes" type="text" placeholder="Optional notes"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors placeholder-[#CBD5E1]" />
              </div>

              <!-- From Store -->
              <div>
                <FieldLabel :text="t('erp.stockTransfer.fromStore')" required />
                <SearchSelect v-model="form.fromStoreId" :options="fromStoreOptions" :placeholder="t('erp.common.selectStore')">
                  <template #option="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> ({{ option.code }})</span></template>
                  <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> ({{ option.code }})</span></template>
                </SearchSelect>
              </div>

              <!-- To Store -->
              <div>
                <FieldLabel :text="t('erp.stockTransfer.toStore')" required />
                <SearchSelect v-model="form.toStoreId" :options="toStoreOptions" :placeholder="t('erp.common.selectStore')">
                  <template #option="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> ({{ option.code }})</span></template>
                  <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> ({{ option.code }})</span></template>
                </SearchSelect>
              </div>

              <!-- Route arrow indicator -->
              <div v-if="form.fromStoreId && form.toStoreId" class="col-span-2">
                <div class="flex items-center gap-3 px-4 py-3 bg-violet-50 rounded-xl border border-violet-100">
                  <span class="text-sm font-semibold text-violet-800">
                    {{ stores.find(s => s.id === form.fromStoreId)?.name }}
                  </span>
                  <ArrowRightIcon class="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <span class="text-sm font-semibold text-violet-800">
                    {{ stores.find(s => s.id === form.toStoreId)?.name }}
                  </span>
                </div>
              </div>

          </div>
        </FormCard>

        <!-- Section 2: Items -->
        <FormCard :title="t('erp.stockTransfer.itemsToTransfer')" :icon="ClipboardDocumentListIcon" icon-color="green"
          :subtitle="items.length ? `${items.length} item${items.length !== 1 ? 's' : ''}` : ''"
          :padded="false">
          <template #actions>
            <button @click="addRow" type="button"
              :disabled="!form.fromStoreId || loadingStoreProducts || !storeProducts.length || allUsedIds.length >= storeProducts.length"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-primary-500
                     bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg
                     transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.common.addItem') }}
            </button>
          </template>

          <!-- No from-store selected -->
          <div v-if="!form.fromStoreId" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mb-4">
              <BuildingStorefrontIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">No source store selected</p>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('erp.stockIssue.selectStorePh') }}</p>
          </div>

          <!-- Loading store products -->
          <div v-else-if="loadingStoreProducts" class="flex items-center justify-center py-16 text-[#9BA7B0] gap-2">
            <div class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span class="text-sm">{{ t('erp.stockIssue.loadingProducts') }}</span>
          </div>

          <!-- No products with stock -->
          <div v-else-if="!storeProducts.length" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mb-4">
              <ClipboardDocumentListIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">No stock available</p>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('erp.stockIssue.noStoreProducts') }}</p>
          </div>

          <!-- Items table -->
          <div v-else>

            <!-- Empty state -->
            <div v-if="!items.length" class="flex flex-col items-center justify-center py-16 text-center">
              <div class="w-14 h-14 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mb-4">
                <ClipboardDocumentListIcon class="w-7 h-7 text-[#CBD5E1]" />
              </div>
              <p class="text-sm font-semibold text-[#637381]">{{ t('erp.common.noItems') }}</p>
              <p class="text-xs text-[#9BA7B0] mt-1 mb-4">Add products to transfer from the source store.</p>
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
                <div class="text-right">{{ t('erp.stockTransfer.available') }}</div>
                <div class="text-right">{{ t('erp.stockTransfer.transferQty') }}</div>
                <div>{{ t('erp.common.notes') }}</div>
                <div></div>
              </div>

              <div class="divide-y divide-[#E2E8F0]">
                <div v-for="(item, i) in items" :key="i"
                  class="group grid items-center gap-3 px-5 py-3 transition-colors"
                  :class="item.qty > availableStock(item.productId) ? 'bg-red-50 hover:bg-red-50/80' : 'hover:bg-[#F7F9FC]'"
                  style="grid-template-columns: 2.5fr 7rem 8rem 2fr 2rem">

                  <SearchSelect v-model="item.productId" :options="availableProducts(i)" :placeholder="t('erp.common.selectProduct')">
                    <template #option="{ option }">{{ option.name }}<span v-if="option.sku" class="text-[#9BA7B0]"> [{{ option.sku }}]</span></template>
                    <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.sku" class="text-[#9BA7B0]"> [{{ option.sku }}]</span></template>
                  </SearchSelect>

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
                      : 'border-[#E2E8F0] text-[#1C2434] focus:border-primary-400'" />

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

              <!-- Totals row -->
              <div class="grid items-center gap-3 px-5 py-3.5 bg-[#F7F9FC] border-t border-[#E2E8F0]"
                style="grid-template-columns: 2.5fr 7rem 8rem 2fr 2rem">
                <div class="col-span-2 text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">
                  Total Transfer Qty
                </div>
                <div class="text-sm font-bold text-[#1C2434] tabular-nums text-right pr-1">{{ totalQty }}</div>
                <div class="col-span-2"></div>
              </div>
            </div>
          </div>
        </FormCard>

        <ErrorBanner :message="error" />

        <!-- Summary card -->
        <FormCard :title="t('erp.common.summary')" :icon="CalculatorIcon" icon-color="slate" :padded="false">
          <div class="px-6 py-4 grid grid-cols-3 gap-6">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.common.items') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">{{ items.length }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.stockTransfer.fromStore') }}</span>
              <span class="text-sm font-semibold text-[#1C2434] truncate">
                {{ stores.find(s => s.id === form.fromStoreId)?.name || '—' }}
              </span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.stockTransfer.toStore') }}</span>
              <span class="text-sm font-semibold text-[#1C2434] truncate">
                {{ stores.find(s => s.id === form.toStoreId)?.name || '—' }}
              </span>
            </div>
          </div>

          <div class="px-6 py-5 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">Total Transfer Qty</p>
              <p class="text-3xl font-extrabold text-primary-500 tabular-nums leading-none">{{ totalQty }}</p>
            </div>
            <div class="flex items-center gap-3">
              <RouterLink to="/erp/stock-request"
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
  CheckIcon, ArrowPathIcon,
  ArrowsRightLeftIcon, ArrowRightIcon,
  ClipboardDocumentListIcon, BuildingStorefrontIcon, CalculatorIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import StatusPill from '@/components/form/StatusPill.vue'
import api from '@/api'

const { t } = useI18n()
const router               = useRouter()
const stores               = ref([])
const storeProducts        = ref([])
const loadingStoreProducts = ref(false)
const form  = ref({ date: new Date().toISOString().slice(0, 10), fromStoreId: '', toStoreId: '', notes: '' })

const fromStoreOptions = computed(() => stores.value.filter(s => s.id !== form.value.toStoreId))
const toStoreOptions   = computed(() => stores.value.filter(s => s.id !== form.value.fromStoreId))
const items = ref([])
const error = ref('')
const saving = ref(false)

onMounted(async () => {
  try {
    const { data } = await api.get('/erp/stock-request/stores-lookup')
    stores.value = data.data.stores
  } catch (err) {
    console.error('Failed to load stores:', err.message)
  }
})

watch(() => form.value.fromStoreId, async (storeId) => {
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

const allUsedIds = computed(() => items.value.map(it => it.productId).filter(Boolean))

function availableProducts(rowIndex) {
  const otherIds = items.value
    .filter((_, i) => i !== rowIndex)
    .map(it => it.productId)
    .filter(Boolean)
  return storeProducts.value.filter(p => !otherIds.includes(p.id))
}

function availableStock(productId) {
  if (!productId) return 0
  return storeProducts.value.find(p => p.id === productId)?.stock ?? 0
}

function addRow() {
  if (items.value.length >= storeProducts.value.length && storeProducts.value.length > 0) return
  items.value.push({ productId: '', qty: 1, notes: '' })
}

function removeRow(i) {
  items.value.splice(i, 1)
}

const totalQty = computed(() =>
  items.value.reduce((s, i) => s + (parseFloat(i.qty) || 0), 0)
)

async function save() {
  error.value = ''
  if (!form.value.date)        { error.value = 'Date is required'; return }
  if (!form.value.fromStoreId) { error.value = 'Source store is required'; return }
  if (!form.value.toStoreId)   { error.value = 'Destination store is required'; return }
  if (form.value.fromStoreId === form.value.toStoreId) { error.value = 'Source and destination stores must be different'; return }
  if (!items.value.length) { error.value = 'Add at least one item'; return }
  if (items.value.find(i => !i.productId || !i.qty || i.qty <= 0)) {
    error.value = 'All items must have a product and quantity > 0'; return
  }
  const overStock = items.value.find(i => i.qty > availableStock(i.productId))
  if (overStock) { error.value = 'Quantity exceeds available stock for one or more items'; return }
  saving.value = true
  try {
    const { data } = await api.post('/erp/stock-request', { ...form.value, items: items.value })
    router.push(`/erp/stock-request/${data.data.request.id}`)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>
