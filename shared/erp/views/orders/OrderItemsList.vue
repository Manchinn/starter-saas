<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900">Sale Items</h1>
        <div class="flex items-center gap-3">
          <input
            v-model="search"
            @input="onSearch"
            type="search"
            placeholder="Search item name…"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
          />
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th class="px-5 py-3 font-medium text-gray-600">Product / Description</th>
              <th class="px-5 py-3 font-medium text-gray-600">Order #</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Qty</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Price</th>
              <th class="px-5 py-3 font-medium text-gray-600">Stock Link</th>
              <th class="px-5 py-3 font-medium text-gray-600">Order Status</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td colspan="7" class="text-center py-12 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="7" class="text-center py-12 text-gray-400">No order items found.</td>
            </tr>
            <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50 transition">
              <td class="px-5 py-3">
                <div class="font-medium text-gray-900">{{ item.productName }}</div>
                <div v-if="item.product?.sku" class="text-xs text-gray-500 font-mono">{{ item.product.sku }}</div>
              </td>
              <td class="px-5 py-3">
                <RouterLink :to="`/erp/orders/${item.order?.id}`" class="text-primary-600 hover:underline font-mono">{{ item.order?.orderNumber }}</RouterLink>
                <div class="text-[10px] text-gray-400">{{ item.order?.orderDate }}</div>
              </td>
              <td class="px-5 py-3 text-right text-gray-700 font-medium">{{ item.quantity }}</td>
              <td class="px-5 py-3 text-right text-gray-600">{{ fmtMoney(item.unitPrice) }}</td>
              <td class="px-5 py-3">
                <div v-if="item.product" class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-green-500"></span>
                  <span class="text-xs text-gray-600">Linked to Master</span>
                </div>
                <div v-else class="flex items-center gap-2 opacity-50">
                  <span class="w-2 h-2 rounded-full bg-gray-300"></span>
                  <span class="text-xs text-gray-400">Custom Item</span>
                </div>
              </td>
              <td class="px-5 py-3">
                <span :class="statusClass(item.order?.status)" class="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize">{{ item.order?.status }}</span>
              </td>
              <td class="px-5 py-3 text-right">
                <div v-if="item.order?.status === 'draft'" class="flex items-center justify-end gap-2">
                  <button @click="openEdit(item)" class="text-xs text-primary-600 hover:underline">Edit</button>
                  <button @click="confirmDelete(item)" class="text-xs text-red-500 hover:underline">Delete</button>
                </div>
                <span v-else class="text-xs text-gray-300">—</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>{{ total }} record{{ total !== 1 ? 's' : '' }}</span>
          <div class="flex items-center gap-1">
            <button @click="page--" :disabled="page <= 1" class="px-3 py-1 border rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <span class="px-3 py-1 text-xs">{{ page }} / {{ Math.max(1, Math.ceil(total / limit)) }}</span>
            <button @click="page++" :disabled="page * limit >= total" class="px-3 py-1 border rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>

    </div>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div v-if="editModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-gray-900">Edit Order Item</h2>
            <button @click="closeEdit" class="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
          </div>

          <div class="space-y-4">
            <!-- Link toggle -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Item Master Link</label>
              <select v-model="editForm.productId" @change="onEditProductSelected" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Custom item (no link)</option>
                <option v-for="p in masterItems" :key="p.id" :value="p.id">{{ p.name }}{{ p.sku ? ` — ${p.sku}` : '' }}</option>
              </select>
              <p v-if="editForm.productId" class="mt-1 text-xs text-green-600">Linked to Item Master</p>
              <p v-else class="mt-1 text-xs text-gray-400">Not linked — custom description</p>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input v-model="editForm.productName" type="text" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Item description" />
            </div>

            <!-- Qty + Price -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input v-model.number="editForm.quantity" type="number" min="1" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-right" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                <input v-model.number="editForm.unitPrice" type="number" min="0" step="0.01" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-right" />
              </div>
            </div>

            <div class="text-right text-sm text-gray-500">
              Line total: <span class="font-semibold text-gray-800">{{ fmtMoney((editForm.quantity || 0) * (editForm.unitPrice || 0)) }}</span>
            </div>

            <div v-if="editModal.error" class="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{{ editModal.error }}</div>
          </div>

          <div class="flex justify-end gap-3 pt-1">
            <button @click="closeEdit" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition">Cancel</button>
            <button @click="saveEdit" :disabled="editModal.saving" class="px-5 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
              {{ editModal.saving ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirm Modal -->
    <Teleport to="body">
      <div v-if="deleteModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <h2 class="text-base font-semibold text-gray-900">Delete Order Item</h2>
          <p class="text-sm text-gray-600">Remove <span class="font-medium">{{ deleteModal.item?.productName }}</span> from order <span class="font-mono font-medium">{{ deleteModal.item?.order?.orderNumber }}</span>? This will recalculate the order total.</p>
          <div v-if="deleteModal.error" class="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{{ deleteModal.error }}</div>
          <div class="flex justify-end gap-3">
            <button @click="deleteModal.open = false" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition">Cancel</button>
            <button @click="doDelete" :disabled="deleteModal.saving" class="px-5 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
              {{ deleteModal.saving ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </AppLayout>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const items        = ref([])
const total        = ref(0)
const page         = ref(1)
const limit        = 50
const search       = ref('')
const loading      = ref(false)
let searchTimeout  = null

const masterItems  = ref([])

const editModal  = reactive({ open: false, item: null, saving: false, error: '' })
const editForm   = reactive({ productId: '', productName: '', quantity: 1, unitPrice: 0 })

const deleteModal = reactive({ open: false, item: null, saving: false, error: '' })

async function fetchItems() {
  loading.value = true
  try {
    const { data } = await api.get('/api/erp/orders/items', { params: { page: page.value, limit, search: search.value } })
    items.value = data.data.items
    total.value  = data.data.total
  } finally {
    loading.value = false
  }
}

async function fetchMasterItems() {
  try {
    const { data } = await api.get('/api/erp/item-master', { params: { limit: 500, status: 'active' } })
    masterItems.value = data.data.products
  } catch {
    masterItems.value = []
  }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; fetchItems() }, 350)
}

watch(page, fetchItems)
onMounted(() => { fetchItems(); fetchMasterItems() })

function openEdit(item) {
  editForm.productId   = item.productId || ''
  editForm.productName = item.productName
  editForm.quantity    = item.quantity
  editForm.unitPrice   = Number(item.unitPrice)
  editModal.item  = item
  editModal.error = ''
  editModal.open  = true
}

function closeEdit() {
  editModal.open = false
}

function onEditProductSelected() {
  const product = masterItems.value.find(p => p.id === editForm.productId)
  if (product) {
    editForm.productName = product.name
    editForm.unitPrice   = Number(product.price)
  } else {
    editForm.productName = ''
  }
}

async function saveEdit() {
  if (!editForm.productName?.trim()) { editModal.error = 'Description is required'; return }
  if (!editForm.quantity || editForm.quantity < 1) { editModal.error = 'Quantity must be at least 1'; return }
  editModal.saving = true
  editModal.error  = ''
  try {
    await api.put(`/api/erp/orders/items/${editModal.item.id}`, {
      productId:   editForm.productId || null,
      productName: editForm.productName,
      quantity:    editForm.quantity,
      unitPrice:   editForm.unitPrice,
    })
    closeEdit()
    fetchItems()
  } catch (err) {
    const d = err.response?.data
    editModal.error = d?.message || 'Failed to update item'
  } finally {
    editModal.saving = false
  }
}

function confirmDelete(item) {
  deleteModal.item  = item
  deleteModal.error = ''
  deleteModal.open  = true
}

async function doDelete() {
  deleteModal.saving = true
  deleteModal.error  = ''
  try {
    await api.delete(`/api/erp/orders/items/${deleteModal.item.id}`)
    deleteModal.open = false
    fetchItems()
  } catch (err) {
    const d = err.response?.data
    deleteModal.error = d?.message || 'Failed to delete item'
  } finally {
    deleteModal.saving = false
  }
}


const STATUS_CLASSES = {
  draft:     'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped:   'bg-yellow-100 text-yellow-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}
function statusClass(s) { return STATUS_CLASSES[s] || 'bg-gray-100 text-gray-600' }
</script>
