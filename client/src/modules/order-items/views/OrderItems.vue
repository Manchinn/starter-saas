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
      <div class="flex gap-3">
        <input
          v-model="search"
          @input="onSearch"
          type="text"
          placeholder="Search by product name..."
          class="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <!-- Table -->
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th class="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Item (Master)</th>
              <th class="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Order</th>
              <th class="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
              <th class="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="store.loading">
              <td colspan="6" class="px-4 py-8 text-center text-gray-400">Loading...</td>
            </tr>
            <tr v-else-if="!store.orderItems.length">
              <td colspan="6" class="px-4 py-8 text-center text-gray-400">No order items found.</td>
            </tr>
            <tr v-for="row in store.orderItems" :key="row.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900">{{ row.productName }}</p>
                <p v-if="row.itemCode" class="text-xs text-gray-400 font-mono">{{ row.itemCode }}</p>
                <p v-else-if="row.product" class="text-xs text-gray-400 font-mono">{{ row.product.sku }}</p>
              </td>
              <td class="px-4 py-3">
                <span v-if="row.item" class="inline-flex items-center gap-1 text-gray-700">
                  {{ row.item.title }}
                  <span class="ml-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">stock: {{ row.item.stock }}</span>
                </span>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>
              <td class="px-4 py-3 text-gray-600">
                {{ row.order?.orderNumber || '—' }}
                <span v-if="row.order" class="ml-1 px-1.5 py-0.5 text-xs rounded-full" :class="statusClass(row.order.status)">
                  {{ row.order.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-right text-gray-700">{{ fmtMoney(row.unitPrice) }}</td>
              <td class="px-4 py-3 text-right font-medium text-gray-900">{{ fmtMoney(row.total) }}</td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openEdit(row)" class="text-xs px-3 py-1 border rounded hover:bg-gray-50">Edit</button>
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

    <!-- Edit Modal -->
    <div v-if="modal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 class="text-lg font-semibold">Edit Order Item</h2>


        <!-- Order Item Name -->
        <div>
          <label class="text-sm font-medium text-gray-700">Order Item Name *</label>
          <input v-model="modal.productName" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Widget A" />
        </div>

        <!-- Order Item Code -->
        <div>
          <label class="text-sm font-medium text-gray-700">Order Item Code</label>
          <input v-model="modal.itemCode" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm font-mono" placeholder="e.g. ITM-001" />
        </div>

        <!-- Item Master selector (optional) -->
        <div>
          <label class="text-sm font-medium text-gray-700">
            Item Master
            <span class="ml-1 text-gray-400 font-normal">(optional — cuts stock on save)</span>
          </label>
          <select v-model="modal.itemId" @change="onItemSelect" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white">
            <option value="">— None —</option>
            <option v-for="mi in store.masterItems" :key="mi.id" :value="mi.id">
              {{ mi.title }} (stock: {{ mi.stock }})
            </option>
          </select>
        </div>



        <div v-if="modalError" class="text-sm text-red-600">{{ modalError }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <button @click="modal = null" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
          <button @click="saveItem" class="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">Save</button>
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
const page = ref(1)
const limit = 20
const modal = ref(null)
const modalError = ref('')

let searchTimer = null

onMounted(() => {
  store.fetchMasterItems()
  load()
})

function load() {
  store.fetchAll({ page: page.value, limit, search: search.value })
}

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 300)
}

function goPage(n) {
  page.value = n
  load()
}

function openEdit(row) {
  modal.value = {
    id: row.id,
    itemId: row.itemId || '',
    productName: row.productName,
    itemCode: row.itemCode || '',
  }
  modalError.value = ''
}

function onItemSelect() {
  if (!modal.value.itemId) return
  const selected = store.masterItems.find((m) => m.id === modal.value.itemId)
  if (selected) modal.value.productName = selected.title
}

async function saveItem() {
  modalError.value = ''
  try {
    const payload = {
      productName: modal.value.productName,
      itemCode: modal.value.itemCode || null,
      itemId: modal.value.itemId || null,
    }
    await store.update(modal.value.id, payload)
    modal.value = null
    store.fetchMasterItems()
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Save failed'
  }
}

async function deleteItem(row) {
  if (!confirm(`Delete "${row.productName}"?`)) return
  try {
    await store.remove(row.id)
    store.fetchMasterItems()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}


function statusClass(status) {
  const map = {
    draft: 'bg-gray-100 text-gray-600',
    confirmed: 'bg-blue-100 text-blue-600',
    shipped: 'bg-yellow-100 text-yellow-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}
</script>
