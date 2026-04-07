<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900">Stock Adjustments</h1>
        <RouterLink to="/erp/stock-adjust/create"
          class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition">
          + New Adjustment
        </RouterLink>
      </div>

      <div class="flex items-center gap-3">
        <input v-model="search" @input="onSearch" type="search" placeholder="Search ref no, reason…"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64" />
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th class="px-5 py-3 font-medium text-gray-600">Ref No</th>
              <th class="px-5 py-3 font-medium text-gray-600">Date</th>
              <th class="px-5 py-3 font-medium text-gray-600">Store</th>
              <th class="px-5 py-3 font-medium text-gray-600">Reason</th>
              <th class="px-5 py-3 font-medium text-gray-600">Status</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading"><td colspan="6" class="text-center py-12 text-gray-400">Loading…</td></tr>
            <tr v-else-if="!rows.length"><td colspan="6" class="text-center py-12 text-gray-400">No records found.</td></tr>
            <tr v-for="row in rows" :key="row.id" class="hover:bg-gray-50 transition">
              <td class="px-5 py-3 font-mono font-medium text-gray-900">{{ row.refNo }}</td>
              <td class="px-5 py-3 text-gray-600">{{ row.date }}</td>
              <td class="px-5 py-3 text-gray-700 font-medium">{{ row.store?.name || '—' }}</td>
              <td class="px-5 py-3 text-gray-600">{{ row.reason || '—' }}</td>
              <td class="px-5 py-3">
                <span :class="row.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
                  class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">{{ row.status }}</span>
              </td>
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <RouterLink :to="`/erp/stock-adjust/${row.id}`" class="text-xs px-3 py-1 border rounded hover:bg-gray-50">View</RouterLink>
                  <button v-if="row.status === 'draft'" @click="approveRow(row)"
                    :disabled="approvingId === row.id"
                    class="text-xs px-3 py-1 border border-green-500 text-green-600 rounded hover:bg-green-50 disabled:opacity-50 transition">
                    {{ approvingId === row.id ? '…' : 'Approve' }}
                  </button>
                  <button v-if="row.status === 'draft'" @click="confirmDelete(row)"
                    class="text-xs px-3 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50">Delete</button>
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
  </AppLayout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = 20
const search = ref('')
const loading = ref(false)
const approvingId = ref(null)
let searchTimeout = null

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/stock-adjust', { params: { page: page.value, limit, search: search.value } })
    rows.value = data.data.adjustments
    total.value = data.data.total
  } finally { loading.value = false }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; load() }, 300)
}

watch(page, load)
onMounted(load)

async function approveRow(row) {
  if (!confirm(`Approve ${row.refNo}? Stock will be adjusted and this cannot be undone.`)) return
  approvingId.value = row.id
  try {
    await api.post(`/erp/stock-adjust/${row.id}/confirm`)
    load()
  } catch (err) {
    alert(err.response?.data?.message || 'Approve failed')
  } finally {
    approvingId.value = null
  }
}

async function confirmDelete(row) {
  if (!confirm(`Delete ${row.refNo}? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/stock-adjust/${row.id}`)
    load()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}
</script>
