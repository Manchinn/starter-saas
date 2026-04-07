<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900">Vendors</h1>
        <div class="flex items-center gap-3">
          <select v-model="statusFilter" @change="page = 1; load()" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <input v-model="search" @input="onSearch" type="search" placeholder="Search vendors…"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-56" />
          <RouterLink to="/erp/vendors/create"
            class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition whitespace-nowrap">
            + New Vendor
          </RouterLink>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th class="px-5 py-3 font-medium text-gray-600">Code</th>
              <th class="px-5 py-3 font-medium text-gray-600">Name</th>
              <th class="px-5 py-3 font-medium text-gray-600">Contact</th>
              <th class="px-5 py-3 font-medium text-gray-600">Email</th>
              <th class="px-5 py-3 font-medium text-gray-600">Phone</th>
              <th class="px-5 py-3 font-medium text-gray-600">Status</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td colspan="7" class="text-center py-12 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!vendors.length">
              <td colspan="7" class="text-center py-12 text-gray-400">No vendors found.</td>
            </tr>
            <tr v-for="v in vendors" :key="v.id" class="hover:bg-gray-50 transition">
              <td class="px-5 py-3 font-mono text-xs text-gray-500">{{ v.code || '—' }}</td>
              <td class="px-5 py-3 font-medium text-gray-900">{{ v.name }}</td>
              <td class="px-5 py-3 text-gray-600">{{ v.contactPerson || '—' }}</td>
              <td class="px-5 py-3 text-gray-500 text-xs">{{ v.email || '—' }}</td>
              <td class="px-5 py-3 text-gray-500 text-xs">{{ v.phone || '—' }}</td>
              <td class="px-5 py-3">
                <span :class="v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                  class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                  {{ v.status }}
                </span>
              </td>
              <td class="px-5 py-3 text-right whitespace-nowrap">
                <RouterLink :to="`/erp/vendors/${v.id}/edit`" class="text-primary-600 hover:underline text-xs mr-3">Edit</RouterLink>
                <button @click="confirmDelete(v)" class="text-red-500 hover:underline text-xs">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>{{ total }} vendor{{ total !== 1 ? 's' : '' }}</span>
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

const vendors      = ref([])
const total        = ref(0)
const page         = ref(1)
const limit        = 20
const search       = ref('')
const statusFilter = ref('')
const loading      = ref(false)
let searchTimeout  = null

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/vendors', { params: { page: page.value, limit, search: search.value, status: statusFilter.value } })
    vendors.value = data.data.vendors
    total.value   = data.data.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; load() }, 300)
}

watch(page, load)
onMounted(load)

async function confirmDelete(v) {
  if (!confirm(`Delete vendor "${v.name}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/vendors/${v.id}`)
    load()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}
</script>
