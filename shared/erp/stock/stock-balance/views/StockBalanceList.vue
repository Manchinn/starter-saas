<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Stock Balance</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ rows.length }} line{{ rows.length !== 1 ? 's' : '' }}</p>
        </div>
        <button @click="load" :disabled="loading"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-200 rounded-lg
                 hover:bg-gray-50 transition-colors disabled:opacity-40 text-gray-600">
          <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          Refresh
        </button>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Lines</p>
          <p class="text-2xl font-bold text-gray-900 tabular-nums">{{ rows.length }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Qty</p>
          <p class="text-2xl font-bold text-gray-900 tabular-nums">{{ fmtQty(totalQty) }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Value</p>
          <p class="text-2xl font-bold text-primary-700 tabular-nums">{{ fmtMoney(totalValue) }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
        <div class="flex flex-wrap items-end gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Store</label>
            <select v-model="filters.storeId" @change="load"
              class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     transition-colors w-48">
              <option value="">All Stores</option>
              <option v-for="s in stores" :key="s.id" :value="s.id">
                {{ s.name }}{{ s.code ? ` (${s.code})` : '' }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Product</label>
            <select v-model="filters.productId" @change="load"
              class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     transition-colors w-56">
              <option value="">All Products</option>
              <option v-for="p in products" :key="p.id" :value="p.id">
                {{ p.name }}{{ p.sku ? ` [${p.sku}]` : '' }}
              </option>
            </select>
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="filters.includeZero" @change="load" class="rounded w-4 h-4" />
            <span class="text-sm text-gray-700">Include Zero Qty</span>
          </label>
          <button @click="resetFilters"
            class="text-xs text-gray-400 hover:text-gray-700 transition-colors underline">
            Reset
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100 text-left">
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Store</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Qty</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">UOM</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">WAC</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Value</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="7" class="text-center py-16">
                <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </td>
            </tr>
            <tr v-else-if="!rows.length">
              <td colspan="7" class="text-center py-16">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <ChartBarIcon class="w-5 h-5 text-gray-400" />
                  </div>
                  <p class="text-sm text-gray-400 font-medium">No records found</p>
                </div>
              </td>
            </tr>
            <tr v-for="row in rows" :key="row.id"
              class="hover:bg-blue-50/40 transition-colors cursor-pointer"
              @click="router.push(`/erp/stock-balance/product/${row.product?.id}`)">
              <td class="px-5 py-3.5 text-gray-700 font-medium">{{ row.store?.name || '—' }}</td>
              <td class="px-5 py-3.5 text-primary-700 font-medium hover:underline">{{ row.product?.name || '—' }}</td>
              <td class="px-5 py-3.5 font-mono text-xs text-gray-400">{{ row.product?.sku || '—' }}</td>
              <td class="px-5 py-3.5 text-right font-semibold tabular-nums"
                :class="row.qty > 0 ? 'text-gray-900' : 'text-red-500'">
                {{ fmtQty(row.qty) }}
              </td>
              <td class="px-5 py-3.5 text-gray-500">{{ row.uom?.abbreviation || row.uom?.name || '—' }}</td>
              <td class="px-5 py-3.5 text-right text-gray-600 tabular-nums">{{ fmtMoney(row.wac) }}</td>
              <td class="px-5 py-3.5 text-right font-semibold text-gray-900 tabular-nums">{{ fmtMoney(row.value) }}</td>
            </tr>
          </tbody>
          <tfoot v-if="rows.length" class="border-t-2 border-gray-200 bg-gray-50">
            <tr>
              <td colspan="3" class="px-5 py-3 text-xs text-gray-500 font-semibold">{{ rows.length }} lines total</td>
              <td class="px-5 py-3 text-right font-bold text-gray-900 tabular-nums">{{ fmtQty(totalQty) }}</td>
              <td></td>
              <td></td>
              <td class="px-5 py-3 text-right font-bold text-primary-700 tabular-nums">{{ fmtMoney(totalValue) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowPathIcon, ChartBarIcon } from '@heroicons/vue/24/outline'
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
  } finally { loading.value = false }
}

function resetFilters() { filters.value = { storeId: '', productId: '', includeZero: false }; load() }

onMounted(async () => {
  try {
    const { data } = await api.get('/erp/stock-balance/lookups')
    stores.value   = data.data.stores
    products.value = data.data.products
  } catch (err) { console.error('Failed to load lookups:', err.message) }
  load()
})
</script>
