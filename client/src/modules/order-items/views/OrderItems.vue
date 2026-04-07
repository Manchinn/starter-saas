<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Order Items</h1>
        <RouterLink to="/erp/order-items/new" class="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition">
          + New Order Item
        </RouterLink>
      </div>

      <!-- Search -->
      <div>
        <input
          v-model="search"
          @input="onSearch"
          type="text"
          placeholder="Search by order name..."
          class="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <!-- Table -->
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th class="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Order Name</th>
              <th class="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Price List</th>
              <th class="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="store.loading">
              <td colspan="5" class="px-4 py-8 text-center text-gray-400">Loading...</td>
            </tr>
            <tr v-else-if="!store.orderItems.length">
              <td colspan="5" class="px-4 py-8 text-center text-gray-400">No order items found.</td>
            </tr>
            <tr v-for="row in store.orderItems" :key="row.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-mono text-xs text-gray-500">
                {{ row.itemCode || '—' }}
              </td>
              <td class="px-4 py-3 font-medium text-gray-900">
                {{ row.productName }}
              </td>
              <td class="px-4 py-3 text-gray-600">
                <template v-if="activePricing(row)">
                  <span class="font-medium text-gray-800">{{ activePricing(row).name }}</span>
                  <span v-if="activePricing(row).code" class="ml-1 font-mono text-xs text-gray-400">({{ activePricing(row).code }})</span>
                </template>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>
              <td class="px-4 py-3 text-right">
                <template v-if="activePricing(row)">
                  <span class="font-semibold text-gray-900">{{ fmtMoney(activePricing(row).unitPrice, activePricing(row).currency) }}</span>
                </template>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <RouterLink :to="`/erp/order-items/${row.id}/edit`" class="text-xs px-3 py-1 border rounded hover:bg-gray-50">Edit</RouterLink>
                  <button @click="deleteItem(row)" class="text-xs px-3 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="store.total > limit" class="flex items-center justify-between text-sm text-gray-500">
        <span>{{ store.total }} items total</span>
        <div class="flex gap-2">
          <button :disabled="page <= 1" @click="goPage(page - 1)" class="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Prev</button>
          <span class="px-3 py-1">Page {{ page }}</span>
          <button :disabled="page * limit >= store.total" @click="goPage(page + 1)" class="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Next</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import { useOrderItemsStore } from '@/stores/orderItems'
import { fmtMoney } from '@/utils/fmt'

const store = useOrderItemsStore()

const search = ref('')
const page   = ref(1)
const limit  = 20

let searchTimer = null

onMounted(() => load())

function load() {
  store.fetchAll({ page: page.value, limit, search: search.value })
}

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; load() }, 300)
}

function goPage(n) {
  page.value = n
  load()
}

// Return the first active pricing, falling back to the first one if none active
function activePricing(row) {
  const list = row.pricings
  if (!list || !list.length) return null
  return list.find(p => p.status === 'active') || list[0]
}

async function deleteItem(row) {
  if (!confirm(`Delete "${row.productName}"?`)) return
  try {
    await store.remove(row.id)
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}
</script>
