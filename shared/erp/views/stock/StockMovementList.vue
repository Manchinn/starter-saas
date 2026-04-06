<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900">Stock Movements</h1>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-3 flex-wrap">
        <select v-model="filterProduct" @change="onFilter"
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-52">
          <option value="">All Products</option>
          <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <select v-model="filterStore" @change="onFilter"
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-44">
          <option value="">All Stores</option>
          <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <select v-model="filterType" @change="onFilter"
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-40">
          <option value="">All Types</option>
          <option value="receive">Receive</option>
          <option value="adjust">Adjustment</option>
          <option value="transfer_in">Transfer In</option>
          <option value="transfer_out">Transfer Out</option>
          <option value="sale">Sale</option>
        </select>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th class="px-5 py-3 font-medium text-gray-600">Date</th>
              <th class="px-5 py-3 font-medium text-gray-600">Product</th>
              <th class="px-5 py-3 font-medium text-gray-600">Store</th>
              <th class="px-5 py-3 font-medium text-gray-600">Type</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Qty</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Before</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">After</th>
              <th class="px-5 py-3 font-medium text-gray-600">Reference</th>
              <th class="px-5 py-3 font-medium text-gray-600">Notes</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading"><td colspan="9" class="text-center py-12 text-gray-400">Loading…</td></tr>
            <tr v-else-if="!rows.length"><td colspan="9" class="text-center py-12 text-gray-400">No movements found.</td></tr>
            <tr v-for="row in rows" :key="row.id" class="hover:bg-gray-50 transition">
              <td class="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">{{ formatDate(row.createdAt) }}</td>
              <td class="px-5 py-3 font-medium text-gray-900">{{ row.product?.name }}</td>
              <td class="px-5 py-3 text-gray-600">{{ row.store?.name || '—' }}</td>
              <td class="px-5 py-3">
                <span :class="typeBadge(row.type)" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">{{ row.type }}</span>
              </td>
              <td class="px-5 py-3 text-right font-semibold" :class="row.qty > 0 ? 'text-green-700' : 'text-red-600'">
                {{ row.qty > 0 ? '+' : '' }}{{ row.qty }}
              </td>
              <td class="px-5 py-3 text-right text-gray-500">{{ row.stockBefore }}</td>
              <td class="px-5 py-3 text-right font-medium text-gray-900">{{ row.stockAfter }}</td>
              <td class="px-5 py-3 font-mono text-xs text-gray-500">{{ row.refNo || '—' }}</td>
              <td class="px-5 py-3 text-gray-500 max-w-xs truncate">{{ row.notes || '—' }}</td>
            </tr>
          </tbody>
        </table>
        <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>{{ total }} movement{{ total !== 1 ? 's' : '' }}</span>
          <div class="flex items-center gap-1">
            <button @click="page--" :disabled="page <= 1" class="px-3 py-1 border rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <span class="px-3 py-1 text-xs">{{ page }} / {{ Math.max(1, Math.ceil(total / limit)) }}</span>
            <button @click="page++" :disabled="page * limit >= total" class="px-3 py-1 border rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const route = useRoute()
const rows = ref([])
const products = ref([])
const total = ref(0)
const page = ref(1)
const limit = 20
const filterProduct = ref(route.query.productId || '')
const filterStore   = ref('')
const filterType    = ref('')
const loading = ref(false)
const stores  = ref([])

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/stock-movements', {
      params: { page: page.value, limit, productId: filterProduct.value, storeId: filterStore.value, type: filterType.value },
    })
    rows.value = data.data.movements
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
  } catch (err) {
    console.error(err.message)
  }
}

function onFilter() { page.value = 1; load() }
watch(page, load)
onMounted(() => { load(); loadLookups() })

function formatDate(d) {
  return new Date(d).toLocaleString()
}

function typeBadge(type) {
  if (type === 'receive')      return 'bg-blue-100 text-blue-700'
  if (type === 'adjust')       return 'bg-purple-100 text-purple-700'
  if (type === 'transfer_in')  return 'bg-green-100 text-green-700'
  if (type === 'transfer_out') return 'bg-orange-100 text-orange-700'
  if (type === 'sale')         return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-600'
}
</script>
