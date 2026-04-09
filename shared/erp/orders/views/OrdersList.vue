<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Sales Orders</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ total }} order{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink
          v-can="'erp.orders.edit'"
          to="/erp/orders/create"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm
                 font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
          <PlusIcon class="w-4 h-4" />
          New Order
        </RouterLink>
      </div>

      <!-- Table card -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <!-- Filter bar -->
        <div class="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div class="relative flex-1 min-w-48 max-w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" placeholder="Search by order #…"
              class="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50
                     focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500
                     focus:border-transparent transition-colors" />
          </div>
          <select v-model="statusFilter" @change="page = 1; fetchOrders()"
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50
                   focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500
                   focus:border-transparent text-gray-700 transition-colors">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100 text-left">
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order #</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Total</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th class="px-5 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="6" class="text-center py-16">
                <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </td>
            </tr>
            <tr v-else-if="!orders.length">
              <td colspan="6" class="text-center py-16">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <DocumentTextIcon class="w-5 h-5 text-gray-400" />
                  </div>
                  <p class="text-sm text-gray-400 font-medium">No orders found</p>
                </div>
              </td>
            </tr>
            <tr v-for="o in orders" :key="o.id"
              class="hover:bg-gray-50 transition-colors group">
              <td class="px-5 py-3.5 font-mono text-sm font-medium text-gray-900">{{ o.orderNumber }}</td>
              <td class="px-5 py-3.5 text-gray-700">{{ o.customer?.name || '—' }}</td>
              <td class="px-5 py-3.5 text-gray-500 text-xs">{{ o.orderDate }}</td>
              <td class="px-5 py-3.5 font-semibold text-gray-900 text-right tabular-nums">{{ fmtMoney(o.total) }}</td>
              <td class="px-5 py-3.5">
                <span :class="statusClass(o.status)"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize">
                  <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(o.status)"></span>
                  {{ o.status }}
                </span>
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center justify-end transition-opacity">
                  <RouterLink :to="`/erp/orders/${o.id}`"
                    class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                    title="View">
                    <EyeIcon class="w-4 h-4" />
                  </RouterLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
          <span class="text-xs text-gray-500">
            Showing {{ orders.length ? (page - 1) * limit + 1 : 0 }}–{{ Math.min(page * limit, total) }} of {{ total }}
          </span>
          <div class="flex items-center gap-1">
            <button @click="page--" :disabled="page <= 1"
              class="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200
                     text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors">
              <ChevronLeftIcon class="w-4 h-4" />
            </button>
            <span class="text-xs text-gray-600 font-medium px-2 tabular-nums">
              {{ page }} / {{ Math.max(1, Math.ceil(total / limit)) }}
            </span>
            <button @click="page++" :disabled="page * limit >= total"
              class="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200
                     text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors">
              <ChevronRightIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import {
  PlusIcon, MagnifyingGlassIcon, EyeIcon,
  ChevronLeftIcon, ChevronRightIcon, DocumentTextIcon,
} from '@heroicons/vue/24/outline'
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
    const { data } = await api.get('/erp/orders', {
      params: { page: page.value, limit, search: search.value, status: statusFilter.value },
    })
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

const STATUS_STYLE = {
  draft:     { badge: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  confirmed: { badge: 'bg-blue-50 text-blue-700',     dot: 'bg-blue-500' },
  shipped:   { badge: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-500' },
  delivered: { badge: 'bg-green-50 text-green-700',   dot: 'bg-green-500' },
  cancelled: { badge: 'bg-red-50 text-red-600',       dot: 'bg-red-500' },
}
function statusClass(s) { return (STATUS_STYLE[s] || STATUS_STYLE.draft).badge }
function statusDot(s)   { return (STATUS_STYLE[s] || STATUS_STYLE.draft).dot }
</script>
