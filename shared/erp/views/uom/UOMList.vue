<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900">Units of Measure</h1>
        <div class="flex items-center gap-3">
          <input v-model="search" @input="onSearch" type="search" placeholder="Search UOM…"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-56" />
          <RouterLink to="/erp/uom/create"
            class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition whitespace-nowrap">
            + New UOM
          </RouterLink>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th class="px-5 py-3 font-medium text-gray-600">Name</th>
              <th class="px-5 py-3 font-medium text-gray-600">Abbreviation</th>
              <th class="px-5 py-3 font-medium text-gray-600">Description</th>
              <th class="px-5 py-3 font-medium text-gray-600">Status</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td colspan="5" class="text-center py-12 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!uoms.length">
              <td colspan="5" class="text-center py-12 text-gray-400">No UOMs found.</td>
            </tr>
            <tr v-for="u in uoms" :key="u.id" class="hover:bg-gray-50 transition">
              <td class="px-5 py-3 font-medium text-gray-900">{{ u.name }}</td>
              <td class="px-5 py-3 font-mono text-sm text-gray-700 font-semibold">{{ u.abbreviation }}</td>
              <td class="px-5 py-3 text-gray-500 max-w-xs truncate">{{ u.description || '—' }}</td>
              <td class="px-5 py-3">
                <span :class="u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                  class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                  {{ u.status }}
                </span>
              </td>
              <td class="px-5 py-3 text-right whitespace-nowrap">
                <RouterLink :to="`/erp/uom/${u.id}/edit`" class="text-primary-600 hover:underline text-xs mr-3">Edit</RouterLink>
                <button @click="confirmDelete(u)" class="text-red-500 hover:underline text-xs">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>{{ total }} UOM{{ total !== 1 ? 's' : '' }}</span>
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

const uoms    = ref([])
const total   = ref(0)
const page    = ref(1)
const limit   = 20
const search  = ref('')
const loading = ref(false)
let searchTimeout = null

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/uom', { params: { page: page.value, limit, search: search.value } })
    uoms.value  = data.data.uoms
    total.value = data.data.total
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

async function confirmDelete(u) {
  if (!confirm(`Delete "${u.name} (${u.abbreviation})"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/uom/${u.id}`)
    load()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}
</script>
