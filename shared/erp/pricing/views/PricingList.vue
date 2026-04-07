<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900">Price Lists</h1>
        <RouterLink to="/erp/pricing/create" class="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition">
          + New Price List
        </RouterLink>
      </div>

      <!-- Search + filter -->
      <div class="flex items-center gap-3 flex-wrap">
        <input
          v-model="search"
          @input="onSearch"
          type="search"
          placeholder="Search price list name…"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
        />
        <select v-model="filterGroup" @change="() => { page = 1; loadPricings() }" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">All Groups</option>
          <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
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
              <th class="px-5 py-3 font-medium text-gray-600">Code</th>
              <th class="px-5 py-3 font-medium text-gray-600">Name</th>
              <th class="px-5 py-3 font-medium text-gray-600">Customer Group</th>
              <th class="px-5 py-3 font-medium text-gray-600">Description</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Unit Price</th>
              <th class="px-5 py-3 font-medium text-gray-600">Currency</th>
              <th class="px-5 py-3 font-medium text-gray-600">Status</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td colspan="8" class="text-center py-12 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!pricings.length">
              <td colspan="8" class="text-center py-12 text-gray-400">No price list entries found.</td>
            </tr>
            <tr v-for="p in pricings" :key="p.id" class="hover:bg-gray-50 transition">
              <td class="px-5 py-3 font-mono text-xs text-gray-500">{{ p.code || '—' }}</td>
              <td class="px-5 py-3 font-medium text-gray-900">{{ p.name }}</td>
              <td class="px-5 py-3 text-gray-500">{{ p.customerGroup?.name || '—' }}</td>
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
                  <RouterLink :to="`/erp/pricing/${p.id}/edit`" class="text-xs px-3 py-1 border rounded hover:bg-gray-50">Edit</RouterLink>
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

    <!-- Delete Confirm -->
    <Teleport to="body">
      <div v-if="deleteModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <h2 class="text-base font-semibold text-gray-900">Delete Price List</h2>
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
const groups       = ref([])
const total        = ref(0)
const page         = ref(1)
const limit        = 20
const search       = ref('')
const filterStatus = ref('')
const filterGroup  = ref('')
const loading      = ref(false)
let searchTimeout  = null

const deleteModal = reactive({ open: false, pricing: null, saving: false, error: '' })

async function fetchGroups() {
  const { data } = await api.get('/erp/customer-groups/all')
  groups.value = data.data.groups
}

async function loadPricings() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/pricing', {
      params: { page: page.value, limit, search: search.value, status: filterStatus.value, customerGroupId: filterGroup.value || undefined },
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
onMounted(() => { fetchGroups(); loadPricings() })

function confirmDelete(p) {
  deleteModal.pricing = p
  deleteModal.error   = ''
  deleteModal.open    = true
}

async function doDelete() {
  deleteModal.saving = true
  deleteModal.error  = ''
  try {
    await api.delete(`/erp/pricing/${deleteModal.pricing.id}`)
    deleteModal.open = false
    loadPricings()
  } catch (err) {
    deleteModal.error = err.response?.data?.message || 'Delete failed'
  } finally {
    deleteModal.saving = false
  }
}
</script>
