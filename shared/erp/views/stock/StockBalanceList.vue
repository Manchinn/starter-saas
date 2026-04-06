<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900">Stock Balance</h1>
        <button @click="load" :disabled="loading"
          class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition disabled:opacity-40">
          {{ loading ? 'Loading…' : 'Refresh' }}
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex flex-wrap items-end gap-4">
          <div class="w-52">
            <label class="block text-xs font-medium text-gray-600 mb-1">Store</label>
            <select v-model="filters.storeId" @change="load"
              class="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">All Stores</option>
              <option v-for="s in stores" :key="s.id" :value="s.id">
                {{ s.name }}{{ s.code ? ` (${s.code})` : '' }}
              </option>
            </select>
          </div>

          <div class="w-64">
            <label class="block text-xs font-medium text-gray-600 mb-1">Product</label>
            <select v-model="filters.productId" @change="load"
              class="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">All Products</option>
              <option v-for="p in products" :key="p.id" :value="p.id">
                {{ p.name }}{{ p.sku ? ` [${p.sku}]` : '' }}
              </option>
            </select>
          </div>

          <label class="flex items-center gap-2 cursor-pointer pb-2">
            <input type="checkbox" v-model="filters.includeZero" @change="load" class="rounded" />
            <span class="text-sm text-gray-700">Include Zero Qty</span>
          </label>

          <button @click="resetFilters"
            class="pb-2 text-xs text-gray-400 hover:text-gray-600 transition underline">
            Reset
          </button>
        </div>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-xs text-gray-500 mb-1">Total Lines</p>
          <p class="text-2xl font-bold text-gray-900">{{ rows.length }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-xs text-gray-500 mb-1">Total Qty</p>
          <p class="text-2xl font-bold text-gray-900">{{ fmtQty(totalQty) }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-xs text-gray-500 mb-1">Total Value</p>
          <p class="text-2xl font-bold text-gray-900">{{ fmtMoney(totalValue) }}</p>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th class="px-5 py-3 font-medium text-gray-600">Store</th>
              <th class="px-5 py-3 font-medium text-gray-600">Product</th>
              <th class="px-5 py-3 font-medium text-gray-600">SKU</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Qty</th>
              <th class="px-5 py-3 font-medium text-gray-600">UOM</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">WAC</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Value</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td colspan="7" class="text-center py-12 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!rows.length">
              <td colspan="7" class="text-center py-12 text-gray-400">No records found.</td>
            </tr>
            <tr v-for="row in rows" :key="row.id"
              class="hover:bg-blue-50 transition cursor-pointer"
              @click="router.push(`/erp/stock-balance/product/${row.product?.id}`)"
              title="Click to view product summary">
              <td class="px-5 py-3 text-gray-700 font-medium">{{ row.store?.name || '—' }}</td>
              <td class="px-5 py-3 text-blue-700 font-medium hover:underline">{{ row.product?.name || '—' }}</td>
              <td class="px-5 py-3 font-mono text-xs text-gray-400">{{ row.product?.sku || '—' }}</td>
              <td class="px-5 py-3 text-right font-semibold"
                :class="row.qty > 0 ? 'text-gray-900' : 'text-red-400'">
                {{ fmtQty(row.qty) }}
              </td>
              <td class="px-5 py-3 text-gray-500">{{ row.uom?.abbreviation || row.uom?.name || '—' }}</td>
              <td class="px-5 py-3 text-right text-gray-600">{{ fmtMoney(row.wac) }}</td>
              <td class="px-5 py-3 text-right font-semibold text-gray-900">{{ fmtMoney(row.value) }}</td>
            </tr>
          </tbody>
          <tfoot v-if="rows.length" class="border-t-2 border-gray-200 bg-gray-50">
            <tr>
              <td colspan="3" class="px-5 py-3 text-xs text-gray-500 font-medium">{{ rows.length }} line(s)</td>
              <td class="px-5 py-3 text-right font-bold text-gray-900">{{ fmtQty(totalQty) }}</td>
              <td></td>
              <td></td>
              <td class="px-5 py-3 text-right font-bold text-gray-900">{{ fmtMoney(totalValue) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney, fmtQty } from '@/utils/fmt'

const router   = useRouter()
const rows     = ref([])
const stores   = ref([])
const products = ref([])
const loading  = ref(false)

const filters = ref({ storeId: '', productId: '', includeZero: false })

const totalQty   = computed(() => rows.value.reduce((s, r) => s + r.qty, 0))
const totalValue = computed(() => rows.value.reduce((s, r) => s + parseFloat(r.value || 0), 0))

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/stock-balance', {
      params: {
        storeId:     filters.value.storeId   || undefined,
        productId:   filters.value.productId || undefined,
        includeZero: filters.value.includeZero ? 'true' : undefined,
      },
    })
    rows.value = data.data.balances
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.value = { storeId: '', productId: '', includeZero: false }
  load()
}

onMounted(async () => {
  try {
    const { data } = await api.get('/erp/stock-balance/lookups')
    stores.value   = data.data.stores
    products.value = data.data.products
  } catch (err) {
    console.error('Failed to load lookups:', err.message)
  }
  load()
})
</script>
