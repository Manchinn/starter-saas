<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/stock-count" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.stockCount.new') }}</h1>
      </div>
      
      <!-- Existing Lock Warning -->
      <div v-if="lockedStoreInfo" class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <div class="mt-0.5">⚠️</div>
        <div>
          <p class="text-sm font-semibold text-amber-800">{{ t('erp.stockCount.storeLocked') }}</p>
          <p class="text-xs text-amber-700 mt-1">
            This store is already locked for movements by another stock count (<strong>{{ lockedStoreInfo.refNo }}</strong>).
            You can still create this draft, but movements are already being blocked.
          </p>
        </div>
      </div>

      <!-- Header -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6">
        <h2 class="text-sm font-semibold text-[#374151] mb-4">{{ t('erp.common.header') }}</h2>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.common.date') }} <span class="text-red-500">*</span></label>
            <DateInput v-model="form.date" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.common.store') }} <span class="text-red-500">*</span></label>
            <select v-model="form.storeId" @change="onStoreChange"
              class="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">{{ t('erp.common.selectStore') }}</option>
              <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}{{ s.code ? ` (${s.code})` : '' }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.common.notes') }}</label>
            <input v-model="form.notes" type="text" placeholder="Optional notes"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div class="flex items-end pb-1">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" v-model="form.movementLocked" class="w-4 h-4 rounded border-[#CBD5E1] text-primary-500 focus:ring-primary-500">
              <span class="text-sm font-medium text-[#374151] font-bold text-red-600">{{ t('erp.stockCount.lockMovement') }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Products -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.stockCount.colProduct') }}s</h2>
            <p class="text-xs text-[#9BA7B0] mt-0.5">Enter the physically counted quantity for each product. Variance = Counted − System.</p>
          </div>
          <div class="flex items-center gap-2">
            <button v-if="form.storeId && !loadingProducts" @click="loadStoreProducts"
              class="text-sm px-3 py-1.5 border border-[#CBD5E1] text-[#637381] rounded-lg hover:bg-[#F7F9FC] transition">
              {{ t('erp.stockCount.reloadProducts') }}
            </button>
          </div>
        </div>

        <div v-if="!form.storeId" class="text-sm text-[#9BA7B0] text-center py-8">
          {{ t('erp.stockCount.selectStore') }}
        </div>
        <div v-else-if="loadingProducts" class="text-sm text-[#9BA7B0] text-center py-8">{{ t('erp.stockCount.loadingProducts') }}</div>
        <div v-else-if="!items.length" class="text-sm text-[#9BA7B0] text-center py-8">
          {{ t('erp.stockIssue.noStoreProducts') }}
        </div>
        <template v-else>
          <!-- Summary bar -->
          <div class="flex items-center gap-6 mb-4 px-3 py-2 bg-[#F7F9FC] rounded-lg text-xs text-[#637381]">
            <span>{{ items.length }} product{{ items.length !== 1 ? 's' : '' }}</span>
            <span class="text-green-700 font-medium">+{{ positiveVarianceCount }} over</span>
            <span class="text-red-600 font-medium">{{ negativeVarianceCount }} short</span>
            <span class="text-[#637381]">{{ zeroVarianceCount }} matched</span>
          </div>

          <table class="w-full text-sm">
            <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0] text-left">
              <tr>
                <th class="px-3 py-2 font-medium text-[#637381]">{{ t('erp.stockCount.colProduct') }}</th>
                <th class="px-3 py-2 font-medium text-[#637381]">{{ t('erp.stockCount.colSku') }}</th>
                <th class="px-3 py-2 font-medium text-[#637381] text-right w-28">{{ t('erp.stockCount.colSystemQty') }}</th>
                <th class="px-3 py-2 font-medium text-[#637381] text-right w-32">{{ t('erp.stockCount.colCountedQty') }} <span class="text-red-500">*</span></th>
                <th class="px-3 py-2 font-medium text-[#637381] text-right w-28">{{ t('erp.stockCount.colVariance') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              <tr v-for="(item, i) in items" :key="i" class="hover:bg-[#F7F9FC]">
                <td class="px-3 py-2 font-medium text-[#1C2434]">{{ item.name }}</td>
                <td class="px-3 py-2 font-mono text-xs text-[#9BA7B0]">{{ item.sku || '—' }}</td>
                <td class="px-3 py-2 text-right text-[#637381]">{{ item.systemQty }}</td>
                <td class="px-3 py-2">
                  <input v-model.number="item.countedQty" type="number" min="0"
                    class="w-full px-2 py-1.5 border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </td>
                <td class="px-3 py-2 text-right font-semibold"
                  :class="variance(item) > 0 ? 'text-green-700' : variance(item) < 0 ? 'text-red-600' : 'text-[#9BA7B0]'">
                  {{ variance(item) > 0 ? '+' : '' }}{{ variance(item) }}
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>

      <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

      <div class="flex justify-end gap-3">
        <RouterLink to="/erp/stock-count" class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">{{ t('common.cancel') }}</RouterLink>
        <button @click="save" :disabled="saving || !items.length"
          class="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
          {{ saving ? t('erp.common.saving') : t('erp.common.saveDraft') }}
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const { t } = useI18n()
const router = useRouter()
const stores = ref([])
const items = ref([])
const form = ref({ date: new Date().toISOString().slice(0, 10), storeId: '', notes: '', movementLocked: false })
const error = ref('')
const saving = ref(false)
const loadingProducts = ref(false)
const lockedStoreInfo = ref(null)

onMounted(async () => {
  try {
    const { data } = await api.get('/erp/stock-count/stores-lookup')
    stores.value = data.data.stores
  } catch (err) {
    console.error('Failed to load stores:', err.message)
  }
})

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
      countedQty: p.systemQty, // default to system qty so variance starts at 0
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
  if (!form.value.date)    { error.value = 'Date is required'; return }
  if (!form.value.storeId) { error.value = 'Store is required'; return }
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
    error.value = err.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>
