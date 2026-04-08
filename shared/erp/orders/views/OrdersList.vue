<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900">Sales Order</h1>
        <div class="flex items-center gap-3">
          <select v-model="statusFilter" @change="fetchOrders" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            v-model="search"
            @input="onSearch"
            type="search"
            placeholder="Search by order #…"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-48"
          />
          <RouterLink
            v-can="'erp.orders.edit'"
            to="/erp/orders/create"
            class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition whitespace-nowrap"
          >+ New Order</RouterLink>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th class="px-5 py-3 font-medium text-gray-600">Order #</th>
              <th class="px-5 py-3 font-medium text-gray-600">Customer</th>
              <th class="px-5 py-3 font-medium text-gray-600">Date</th>
              <th class="px-5 py-3 font-medium text-gray-600">Total</th>
              <th class="px-5 py-3 font-medium text-gray-600">Status</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td colspan="6" class="text-center py-12 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!orders.length">
              <td colspan="6" class="text-center py-12 text-gray-400">No orders found.</td>
            </tr>
            <tr v-for="o in orders" :key="o.id" class="hover:bg-gray-50 transition">
              <td class="px-5 py-3 font-mono font-medium text-gray-900">{{ o.orderNumber }}</td>
              <td class="px-5 py-3 text-gray-600">{{ o.customer?.name || '—' }}</td>
              <td class="px-5 py-3 text-gray-500 text-xs">{{ o.orderDate }}</td>
              <td class="px-5 py-3 font-medium text-gray-900">{{ fmtMoney(o.total) }}</td>
              <td class="px-5 py-3">
                <span :class="statusClass(o.status)" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">{{ o.status }}</span>
              </td>
              <td class="px-5 py-3 text-right">
                <RouterLink :to="`/erp/orders/${o.id}`" class="text-primary-600 hover:underline text-xs">View</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>{{ total }} order{{ total !== 1 ? 's' : '' }}</span>
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
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const orders       = ref([])
const total        = ref(0)
const page         = ref(1)
const limit        = 20
const search       = ref('')
const statusFilter = ref('')
const loading      = ref(false)
let searchTimeout  = null

async function fetchOrders() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/orders', { params: { page: page.value, limit, search: search.value, status: statusFilter.value } })
    orders.value = data.data.orders
    total.value  = data.data.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; fetchOrders() }, 350)
}

watch(page, fetchOrders)
onMounted(fetchOrders)


const STATUS_CLASSES = {
  draft:     'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped:   'bg-yellow-100 text-yellow-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}
function statusClass(s) { return STATUS_CLASSES[s] || 'bg-gray-100 text-gray-600' }
</script>
