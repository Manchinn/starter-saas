<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Page Header -->
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <RouterLink to="/erp/stock-issue"
            class="p-2 rounded-xl border border-transparent hover:border-[#E2E8F0] text-[#9BA7B0] hover:text-[#637381] transition">
            <ArrowLeftIcon class="w-4 h-4" />
          </RouterLink>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-bold text-[#1C2434]">{{ t('erp.stockIssue.new') }}</h1>
              <span class="badge badge-amber">{{ t('erp.common.draft') }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-[#9BA7B0] mt-0.5">
              <RouterLink to="/erp/stock-issue" class="hover:text-[#637381] transition">{{ t('erp.stockIssue.title') }}</RouterLink>
              <ChevronRightIcon class="w-3 h-3" />
              <span>{{ t('erp.stockIssue.new') }}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <RouterLink to="/erp/stock-issue"
            class="px-4 py-2.5 text-sm border border-[#E2E8F0] rounded-xl hover:bg-[#F7F9FC] transition text-[#637381]">
            {{ t('common.cancel') }}
          </RouterLink>
          <button @click="save" :disabled="saving"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary-500 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition shadow-sm">
            <CheckIcon class="w-4 h-4" />
            {{ saving ? t('erp.common.saving') : t('erp.common.saveDraft') }}
          </button>
        </div>
      </div>

      <!-- Issue Info -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
            <ArchiveBoxArrowDownIcon class="w-4 h-4 text-orange-500" />
          </div>
          <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.stockIssue.issueInfo') }}</h2>
        </div>
        <div class="px-6 py-5">
          <div class="grid grid-cols-2 gap-5">
            <div>
              <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                {{ t('erp.common.date') }} <span class="text-red-500">*</span>
              </label>
              <input v-model="form.date" type="date"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                {{ t('erp.common.store') }} <span class="text-red-500">*</span>
              </label>
              <select v-model="form.storeId"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition">
                <option value="">{{ t('erp.common.selectStore') }}</option>
                <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}{{ s.code ? ` (${s.code})` : '' }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                {{ t('erp.stockIssue.reason') }}
              </label>
              <input v-model="form.reason" type="text" :placeholder="t('erp.stockIssue.reasonPh')"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                {{ t('erp.common.notes') }}
              </label>
              <input v-model="form.notes" type="text" :placeholder="t('erp.common.optional')"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition" />
            </div>
          </div>
        </div>
      </div>

      <!-- Items -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
              <ClipboardDocumentListIcon class="w-4 h-4 text-green-600" />
            </div>
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.common.items') }}</h2>
            <span v-if="items.length"
              class="text-xs font-semibold text-[#9BA7B0] bg-[#F7F9FC] border border-[#E2E8F0] px-2 py-0.5 rounded-full">
              {{ items.length }}
            </span>
          </div>
          <button v-if="form.storeId && storeProducts.length" @click="addRow"
            :disabled="allUsedIds.length >= storeProducts.length"
            class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
            + {{ t('erp.common.addItem') }}
          </button>
        </div>

        <!-- No store selected -->
        <div v-if="!form.storeId" class="py-14 flex flex-col items-center gap-3 text-center">
          <div class="w-12 h-12 rounded-2xl bg-[#F7F9FC] border border-[#E2E8F0] flex items-center justify-center">
            <BuildingStorefrontIcon class="w-6 h-6 text-[#CBD5E1]" />
          </div>
          <p class="text-sm text-[#9BA7B0]">{{ t('erp.stockIssue.selectStorePh') }}</p>
        </div>

        <!-- Loading -->
        <div v-else-if="loadingStoreProducts" class="py-14 flex flex-col items-center gap-3">
          <div class="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p class="text-sm text-[#9BA7B0]">{{ t('erp.stockIssue.loadingProducts') }}</p>
        </div>

        <!-- No products with stock -->
        <div v-else-if="!storeProducts.length" class="py-14 flex flex-col items-center gap-3 text-center">
          <div class="w-12 h-12 rounded-2xl bg-[#F7F9FC] border border-[#E2E8F0] flex items-center justify-center">
            <ClipboardDocumentListIcon class="w-6 h-6 text-[#CBD5E1]" />
          </div>
          <p class="text-sm text-[#9BA7B0]">{{ t('erp.stockIssue.noStoreProducts') }}</p>
        </div>

        <!-- Items list -->
        <div v-else>
          <!-- Column headers -->
          <div class="px-6 py-2.5 border-b border-[#E2E8F0] bg-[#F7F9FC]"
               style="display:grid; grid-template-columns: 2.5fr 7rem 8rem 2fr 2rem; gap: 0.75rem; align-items: center;">
            <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.common.product') }}</span>
            <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.stockIssue.available') }}</span>
            <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.stockIssue.issueQty') }} <span class="text-red-400">*</span></span>
            <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.common.notes') }}</span>
            <span></span>
          </div>

          <!-- Empty state -->
          <div v-if="!items.length" class="py-14 flex flex-col items-center gap-3 text-center">
            <div class="w-12 h-12 rounded-2xl bg-[#F7F9FC] border border-[#E2E8F0] flex items-center justify-center">
              <ClipboardDocumentListIcon class="w-6 h-6 text-[#CBD5E1]" />
            </div>
            <p class="text-sm text-[#9BA7B0]">{{ t('erp.common.noItems') }}</p>
            <button @click="addRow"
              class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-700 transition">
              + {{ t('erp.common.addItem') }}
            </button>
          </div>

          <!-- Item rows -->
          <div v-for="(item, i) in items" :key="i"
               class="group px-6 py-3 border-b border-[#E2E8F0] last:border-0 transition"
               :class="item.qty > availableStock(item.productId) ? 'bg-red-50' : 'hover:bg-[#F7F9FC]'"
               style="display:grid; grid-template-columns: 2.5fr 7rem 8rem 2fr 2rem; gap: 0.75rem; align-items: center;">

            <!-- Product -->
            <select v-model="item.productId"
              class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition">
              <option value="">{{ t('erp.common.selectProduct') }}</option>
              <option v-for="p in availableProducts(i)" :key="p.id" :value="p.id">
                {{ p.name }}{{ p.sku ? ` [${p.sku}]` : '' }}
              </option>
            </select>

            <!-- Available -->
            <div class="text-right">
              <span v-if="item.productId" class="font-mono text-sm font-semibold"
                :class="availableStock(item.productId) > 0 ? 'text-green-700' : 'text-red-500'">
                {{ availableStock(item.productId) }}
              </span>
              <span v-else class="text-[#CBD5E1]">—</span>
            </div>

            <!-- Qty -->
            <input v-model.number="item.qty" type="number" min="0.01" step="0.01" placeholder="0"
              class="w-full px-3 py-2 border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition"
              :class="item.qty > availableStock(item.productId) ? 'border-red-400 text-red-600' : 'border-[#E2E8F0]'" />

            <!-- Notes -->
            <input v-model="item.notes" type="text" :placeholder="t('erp.common.optional')"
              class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition" />

            <!-- Remove -->
            <button @click="removeRow(i)"
              class="opacity-0 group-hover:opacity-100 flex items-center justify-center w-7 h-7 rounded-lg text-[#9BA7B0] hover:text-red-500 hover:bg-red-50 transition">
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error"
        class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
        <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
        {{ error }}
      </div>

      <!-- Summary card -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center">
            <CalculatorIcon class="w-4 h-4 text-primary-500" />
          </div>
          <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.common.summary') }}</h2>
        </div>
        <div class="px-6 py-5">
          <div class="grid grid-cols-3 gap-6 mb-5">
            <div class="text-center">
              <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-1">{{ t('erp.common.items') }}</p>
              <p class="text-2xl font-bold text-[#1C2434]">{{ items.length }}</p>
            </div>
            <div class="text-center">
              <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-1">{{ t('erp.common.store') }}</p>
              <p class="text-sm font-semibold text-[#374151] truncate">{{ storeName || '—' }}</p>
            </div>
            <div class="text-center">
              <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-1">{{ t('erp.stockIssue.totalIssueQty') }}</p>
              <p class="text-2xl font-bold text-primary-500">{{ totalQty }}</p>
            </div>
          </div>
          <div class="flex justify-end">
            <button @click="save" :disabled="saving"
              class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary-500 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition shadow-sm">
              <CheckIcon class="w-4 h-4" />
              {{ saving ? t('erp.common.saving') : t('erp.common.saveDraft') }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  ArchiveBoxArrowDownIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  CalculatorIcon,
  TrashIcon,
  CheckIcon,
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const { t } = useI18n()
const router               = useRouter()
const stores               = ref([])
const storeProducts        = ref([])
const loadingStoreProducts = ref(false)
const form   = ref({ date: new Date().toISOString().slice(0, 10), storeId: '', reason: '', notes: '' })
const items  = ref([])
const error  = ref('')
const saving = ref(false)

onMounted(async () => {
  try {
    const { data } = await api.get('/erp/stock-issue/stores-lookup')
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
    const { data } = await api.get('/erp/stock-request/store-products', { params: { storeId } })
    storeProducts.value = data.data.products
  } catch (err) {
    console.error('Failed to load store products:', err.message)
  } finally {
    loadingStoreProducts.value = false
  }
})

const allUsedIds = computed(() => items.value.map(it => it.productId).filter(Boolean))

const storeName = computed(() => stores.value.find(s => s.id === form.value.storeId)?.name ?? '')

const totalQty = computed(() => items.value.reduce((sum, it) => sum + (Number(it.qty) || 0), 0))

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
  items.value.push({ productId: '', qty: 0, notes: '' })
}

function removeRow(i) {
  items.value.splice(i, 1)
}

async function save() {
  error.value = ''
  if (!form.value.date)    { error.value = 'Date is required'; return }
  if (!form.value.storeId) { error.value = 'Store is required'; return }
  if (!items.value.length) { error.value = 'Add at least one item'; return }
  if (items.value.find(i => !i.productId || !i.qty || i.qty <= 0)) {
    error.value = 'All items must have a product and quantity > 0'; return
  }
  if (items.value.find(i => i.qty > availableStock(i.productId))) {
    error.value = 'Quantity exceeds available stock for one or more items'; return
  }
  saving.value = true
  try {
    const { data } = await api.post('/erp/stock-issue', { ...form.value, items: items.value })
    router.push(`/erp/stock-issue/${data.data.issue.id}`)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>
