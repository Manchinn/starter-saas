<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900">Pricing</h1>
        <RouterLink to="/erp/pricing/create" class="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition">
          + New Pricing
        </RouterLink>
      </div>

      <!-- Search + filter -->
      <div class="flex items-center gap-3">
        <input
          v-model="search"
          @input="onSearch"
          type="search"
          placeholder="Search pricing name…"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
        />
        <select v-model="filterStatus" @change="loadPricings" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th class="px-5 py-3 font-medium text-gray-600">Name</th>
              <th class="px-5 py-3 font-medium text-gray-600">Description</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Unit Price</th>
              <th class="px-5 py-3 font-medium text-gray-600">Currency</th>
              <th class="px-5 py-3 font-medium text-gray-600">Status</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td colspan="6" class="text-center py-12 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!pricings.length">
              <td colspan="6" class="text-center py-12 text-gray-400">No pricing entries found.</td>
            </tr>
            <tr v-for="p in pricings" :key="p.id" class="hover:bg-gray-50 transition">
              <td class="px-5 py-3 font-medium text-gray-900">{{ p.name }}</td>
              <td class="px-5 py-3 text-gray-500 max-w-xs truncate">{{ p.description || '—' }}</td>
              <td class="px-5 py-3 text-right font-semibold text-gray-800">{{ fmtMoney(p.unitPrice, p.currency) }}</td>
              <td class="px-5 py-3 text-gray-600 font-mono text-xs">{{ p.currency }}</td>
              <td class="px-5 py-3">
                <span :class="p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                  class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                  {{ p.status }}
                </span>
              </td>
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openApply(p)" class="text-xs px-3 py-1 border border-primary-200 text-primary-600 rounded hover:bg-primary-50">Apply</button>
                  <button @click="openEdit(p)" class="text-xs px-3 py-1 border rounded hover:bg-gray-50">Edit</button>
                  <button @click="confirmDelete(p)" class="text-xs px-3 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50">Delete</button>
                </div>
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
      <div v-if="formModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-gray-900">Edit Pricing</h2>
            <button @click="formModal.open = false" class="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input v-model="form.name" type="text" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. Standard Rate" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea v-model="form.description" rows="2" class="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Optional notes…" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Unit Price *</label>
                <input v-model.number="form.unitPrice" type="number" min="0" step="0.01"
                  class="w-full px-3 py-2 border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <input v-model="form.currency" type="text" maxlength="10"
                  class="w-full px-3 py-2 border rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="USD" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select v-model="form.status" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Order Item</label>
              <select v-model="form.orderItemId" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" :disabled="orderItemsLoading">
                <option value="">— None —</option>
                <option v-for="item in orderItemsLookup" :key="item.id" :value="item.id">
                  {{ item.productName }}<span v-if="item.order"> · {{ item.order.orderNumber }}</span>
                </option>
              </select>
            </div>
          </div>

          <div v-if="formModal.error" class="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{{ formModal.error }}</div>

          <div class="flex justify-end gap-3 pt-1">
            <button @click="formModal.open = false" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition">Cancel</button>
            <button @click="saveForm" :disabled="formModal.saving"
              class="px-5 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
              {{ formModal.saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Apply to Order Items Modal -->
    <Teleport to="body">
      <div v-if="applyModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]">
          <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
            <div>
              <h2 class="text-base font-semibold text-gray-900">Apply Pricing to Order Items</h2>
              <p class="text-xs text-gray-500 mt-0.5">
                Pricing: <span class="font-medium text-gray-700">{{ applyModal.pricing?.name }}</span>
                — <span class="font-semibold text-primary-600">{{ fmtMoney(applyModal.pricing?.unitPrice, applyModal.pricing?.currency) }}</span>
              </p>
            </div>
            <button @click="applyModal.open = false" class="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
          </div>

          <!-- Search order items -->
          <div class="px-6 py-3 border-b border-gray-100">
            <input
              v-model="applyModal.search"
              @input="onApplySearch"
              type="search"
              placeholder="Search product name…"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p class="mt-1.5 text-xs text-gray-400">Only showing items from <span class="font-medium">draft</span> orders. Selected: {{ applyModal.selected.length }}</p>
          </div>

          <!-- Order items list -->
          <div class="flex-1 overflow-y-auto divide-y divide-gray-100">
            <div v-if="applyModal.loading" class="py-10 text-center text-gray-400 text-sm">Loading…</div>
            <div v-else-if="!applyModal.orderItems.length" class="py-10 text-center text-gray-400 text-sm">No draft order items found.</div>
            <label
              v-for="item in applyModal.orderItems"
              :key="item.id"
              class="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 cursor-pointer"
            >
              <input type="checkbox" :value="item.id" v-model="applyModal.selected" class="rounded" />
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-800 text-sm truncate">{{ item.productName }}</p>
                <p class="text-xs text-gray-400">
                  Order: <span class="font-mono">{{ item.order?.orderNumber }}</span>
                  <span v-if="item.product?.sku"> · SKU: {{ item.product.sku }}</span>
                </p>
              </div>
              <div class="text-right text-sm shrink-0">
                <p class="text-gray-500">Qty: {{ item.quantity }}</p>
                <p class="text-gray-400 text-xs">Current: {{ fmtMoney(item.unitPrice) }}</p>
              </div>
            </label>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
            <button @click="toggleSelectAll" class="text-xs text-primary-600 hover:underline">
              {{ applyModal.selected.length === applyModal.orderItems.length ? 'Deselect all' : 'Select all' }}
            </button>
            <div class="flex gap-3">
              <div v-if="applyModal.error" class="text-sm text-red-600">{{ applyModal.error }}</div>
              <button @click="applyModal.open = false" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button @click="doApply" :disabled="!applyModal.selected.length || applyModal.saving"
                class="px-5 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
                {{ applyModal.saving ? 'Applying…' : `Apply to ${applyModal.selected.length} item(s)` }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirm -->
    <Teleport to="body">
      <div v-if="deleteModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <h2 class="text-base font-semibold text-gray-900">Delete Pricing</h2>
          <p class="text-sm text-gray-600">Delete <span class="font-medium">{{ deleteModal.pricing?.name }}</span>? This cannot be undone.</p>
          <div v-if="deleteModal.error" class="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{{ deleteModal.error }}</div>
          <div class="flex justify-end gap-3">
            <button @click="deleteModal.open = false" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition">Cancel</button>
            <button @click="doDelete" :disabled="deleteModal.saving"
              class="px-5 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
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
import { RouterLink } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const pricings     = ref([])
const total        = ref(0)
const page         = ref(1)
const limit        = 20
const search       = ref('')
const filterStatus = ref('')
const loading      = ref(false)
let searchTimeout  = null

const form = reactive({ name: '', description: '', unitPrice: 0, currency: 'USD', status: 'active', orderItemId: '' })
const formModal = reactive({ open: false, isEdit: false, id: null, saving: false, error: '' })

const orderItemsLookup = ref([])
const orderItemsLoading = ref(false)

async function fetchOrderItemsLookup() {
  orderItemsLoading.value = true
  try {
    const { data } = await api.get('/api/erp/pricing/order-items')
    orderItemsLookup.value = data.data.orderItems
  } finally {
    orderItemsLoading.value = false
  }
}

const applyModal = reactive({
  open: false,
  pricing: null,
  orderItems: [],
  selected: [],
  search: '',
  loading: false,
  saving: false,
  error: '',
})
let applySearchTimeout = null

const deleteModal = reactive({ open: false, pricing: null, saving: false, error: '' })

async function loadPricings() {
  loading.value = true
  try {
    const { data } = await api.get('/api/erp/pricing', {
      params: { page: page.value, limit, search: search.value, status: filterStatus.value },
    })
    pricings.value = data.data.pricings
    total.value    = data.data.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; loadPricings() }, 300)
}

watch(page, loadPricings)
onMounted(loadPricings)

// ── CRUD ──────────────────────────────────────────────────────────────────────

function openEdit(p) {
  Object.assign(form, {
    name: p.name,
    description: p.description || '',
    unitPrice: Number(p.unitPrice),
    currency: p.currency,
    status: p.status,
    orderItemId: p.orderItemId || '',
  })
  formModal.isEdit = true
  formModal.id     = p.id
  formModal.error  = ''
  formModal.open   = true
  fetchOrderItemsLookup()
}

async function saveForm() {
  if (!form.name.trim()) { formModal.error = 'Name is required'; return }
  formModal.saving = true
  formModal.error  = ''
  try {
    const payload = { ...form, orderItemId: form.orderItemId || null }
    await api.put(`/api/erp/pricing/${formModal.id}`, payload)
    formModal.open = false
    loadPricings()
  } catch (err) {
    formModal.error = err.response?.data?.message || 'Save failed'
  } finally {
    formModal.saving = false
  }
}

function confirmDelete(p) {
  deleteModal.pricing = p
  deleteModal.error   = ''
  deleteModal.open    = true
}

async function doDelete() {
  deleteModal.saving = true
  deleteModal.error  = ''
  try {
    await api.delete(`/api/erp/pricing/${deleteModal.pricing.id}`)
    deleteModal.open = false
    loadPricings()
  } catch (err) {
    deleteModal.error = err.response?.data?.message || 'Delete failed'
  } finally {
    deleteModal.saving = false
  }
}

// ── Apply to Order Items ──────────────────────────────────────────────────────

async function fetchApplyOrderItems() {
  applyModal.loading = true
  try {
    const { data } = await api.get('/api/erp/pricing/order-items', {
      params: { search: applyModal.search, draftOnly: 'true' },
    })
    applyModal.orderItems = data.data.orderItems
  } finally {
    applyModal.loading = false
  }
}

function openApply(p) {
  applyModal.pricing    = p
  applyModal.selected   = []
  applyModal.search     = ''
  applyModal.error      = ''
  applyModal.open       = true
  fetchApplyOrderItems()
}

function onApplySearch() {
  clearTimeout(applySearchTimeout)
  applySearchTimeout = setTimeout(fetchApplyOrderItems, 300)
}

function toggleSelectAll() {
  if (applyModal.selected.length === applyModal.orderItems.length) {
    applyModal.selected = []
  } else {
    applyModal.selected = applyModal.orderItems.map((i) => i.id)
  }
}

async function doApply() {
  applyModal.saving = true
  applyModal.error  = ''
  try {
    const { data } = await api.post(`/api/erp/pricing/${applyModal.pricing.id}/apply`, {
      orderItemIds: applyModal.selected,
    })
    applyModal.open = false
    // Brief success flash in the pricing table
    loadPricings()
    alert(`${data.message}`)
  } catch (err) {
    applyModal.error = err.response?.data?.message || 'Apply failed'
  } finally {
    applyModal.saving = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
</script>
