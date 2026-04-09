<template>
  <AppLayout>
    <div class="space-y-5">

      <div>
        <h1 class="text-xl font-semibold text-gray-900">Stock Movements</h1>
        <p class="text-sm text-gray-500 mt-0.5">{{ total }} movement{{ total !== 1 ? 's' : '' }}</p>
      </div>

      <!-- Table card -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <!-- Filters -->
        <div class="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <select v-model="filterProduct" @change="onFilter"
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                   text-gray-700 transition-colors min-w-44 max-w-52">
            <option value="">All Products</option>
            <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <select v-model="filterStore" @change="onFilter"
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                   text-gray-700 transition-colors">
            <option value="">All Stores</option>
            <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
          <select v-model="filterType" @change="onFilter"
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                   text-gray-700 transition-colors">
            <option value="">All Types</option>
            <option value="receive">Receive</option>
            <option value="adjust">Adjustment</option>
            <option value="transfer_in">Transfer In</option>
            <option value="transfer_out">Transfer Out</option>
            <option value="sale">Sale</option>
          </select>
        </div>

        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100 text-left">
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Store</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Qty</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Before</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">After</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="8" class="text-center py-16">
                <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </td>
            </tr>
            <tr v-else-if="!rows.length">
              <td colspan="8" class="text-center py-16">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <ArrowsRightLeftIcon class="w-5 h-5 text-gray-400" />
                  </div>
                  <p class="text-sm text-gray-400 font-medium">No movements found</p>
                </div>
              </td>
            </tr>
            <tr v-for="row in rows" :key="row.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">{{ formatDate(row.createdAt) }}</td>
              <td class="px-5 py-3.5 font-medium text-gray-900">{{ row.product?.name }}</td>
              <td class="px-5 py-3.5 text-gray-600">{{ row.store?.name || '—' }}</td>
              <td class="px-5 py-3.5">
                <span :class="typeBadge(row.type)"
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize">
                  {{ row.type?.replace('_', ' ') }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-right font-semibold tabular-nums"
                :class="row.qty > 0 ? 'text-green-700' : 'text-red-600'">
                {{ row.qty > 0 ? '+' : '' }}{{ row.qty }}
              </td>
              <td class="px-5 py-3.5 text-right text-gray-500 tabular-nums">{{ row.stockBefore }}</td>
              <td class="px-5 py-3.5 text-right font-semibold text-gray-900 tabular-nums">{{ row.stockAfter }}</td>
              <td class="px-5 py-3.5 font-mono text-xs text-gray-500">{{ row.refNo || '—' }}</td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
          <span class="text-xs text-gray-500">Showing {{ rows.length ? (page-1)*limit+1 : 0 }}–{{ Math.min(page*limit,total) }} of {{ total }}</span>
          <div class="flex items-center gap-1">
            <button @click="page--" :disabled="page <= 1" class="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors"><ChevronLeftIcon class="w-4 h-4" /></button>
            <span class="text-xs text-gray-600 font-medium px-2 tabular-nums">{{ page }} / {{ Math.max(1,Math.ceil(total/limit)) }}</span>
            <button @click="page++" :disabled="page*limit>=total" class="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors"><ChevronRightIcon class="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeftIcon, ChevronRightIcon, ArrowsRightLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const route         = useRoute()
const rows          = ref([])
const products      = ref([])
const stores        = ref([])
const total         = ref(0)
const page          = ref(1)
const limit         = 20
const filterProduct = ref(route.query.productId || '')
const filterStore   = ref('')
const filterType    = ref('')
const loading       = ref(false)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/stock-movements', {
      params: { page: page.value, limit, productId: filterProduct.value, storeId: filterStore.value, type: filterType.value },
    })
    rows.value  = data.data.movements
    total.value = data.data.total
  } finally { loading.value = false }
}

async function loadLookups() {
  try {
    const [prodRes, storeRes] = await Promise.all([
      api.get('/erp/item-master', { params: { limit: 200 } }),
      api.get('/erp/item-master/stores-lookup'),
    ])
    products.value = prodRes.data.data.products
    stores.value   = storeRes.data.data.stores
  } catch (err) { console.error(err.message) }
}

function onFilter() { page.value = 1; load() }
watch(page, load)
onMounted(() => { load(); loadLookups() })

function formatDate(d) { return new Date(d).toLocaleString() }

const TYPE_BADGE = {
  receive:      'bg-blue-50 text-blue-700',
  adjust:       'bg-purple-50 text-purple-700',
  transfer_in:  'bg-green-50 text-green-700',
  transfer_out: 'bg-orange-50 text-orange-700',
  sale:         'bg-red-50 text-red-700',
}
function typeBadge(type) { return TYPE_BADGE[type] || 'bg-gray-100 text-gray-600' }
</script>
