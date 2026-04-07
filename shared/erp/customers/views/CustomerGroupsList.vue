<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900">Customer Groups</h1>
        <div class="flex items-center gap-3">
          <input
            v-model="search"
            @input="onSearch"
            type="search"
            placeholder="Search groups…"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
          />
          <RouterLink
            v-can="'erp.customer-groups.edit'"
            to="/erp/customer-groups/create"
            class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition whitespace-nowrap"
          >+ New Group</RouterLink>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th class="px-5 py-3 font-medium text-gray-600">Name</th>
              <th class="px-5 py-3 font-medium text-gray-600">Description</th>
              <th class="px-5 py-3 font-medium text-gray-600">Status</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td colspan="4" class="text-center py-12 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!groups.length">
              <td colspan="4" class="text-center py-12 text-gray-400">No groups found.</td>
            </tr>
            <tr v-for="g in groups" :key="g.id" class="hover:bg-gray-50 transition">
              <td class="px-5 py-3 font-medium text-gray-900">{{ g.name }}</td>
              <td class="px-5 py-3 text-gray-500 max-w-xs truncate">{{ g.description || '—' }}</td>
              <td class="px-5 py-3">
                <span
                  :class="g.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                  class="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                >{{ g.status }}</span>
              </td>
              <td class="px-5 py-3 text-right whitespace-nowrap">
                <RouterLink v-can="'erp.customer-groups.edit'" :to="`/erp/customer-groups/${g.id}/edit`" class="text-primary-600 hover:underline text-xs mr-3">Edit</RouterLink>
                <button v-can="'erp.customer-groups.delete'" @click="confirmDelete(g)" class="text-red-500 hover:underline text-xs">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>{{ total }} group{{ total !== 1 ? 's' : '' }}</span>
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

const groups  = ref([])
const total   = ref(0)
const page    = ref(1)
const limit   = 20
const search  = ref('')
const loading = ref(false)
let searchTimeout = null

async function fetchGroups() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/customer-groups', { params: { page: page.value, limit, search: search.value } })
    groups.value = data.data.groups
    total.value  = data.data.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; fetchGroups() }, 350)
}

watch(page, fetchGroups)
onMounted(fetchGroups)

async function confirmDelete(g) {
  if (!confirm(`Delete "${g.name}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/customer-groups/${g.id}`)
    fetchGroups()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}
</script>
