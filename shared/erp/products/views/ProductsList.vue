<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900">Product Master</h1>
        <div class="flex items-center gap-3">
          <input
            v-model="search"
            @input="onSearch"
            type="search"
            placeholder="Search Product Master…"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
          />
          <RouterLink
            to="/erp/item-master/create"
            class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition whitespace-nowrap"
          >+ New Product Master</RouterLink>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th class="px-5 py-3 font-medium text-gray-600">Code / SKU</th>
              <th class="px-5 py-3 font-medium text-gray-600">Name</th>
              <th class="px-5 py-3 font-medium text-gray-600">Category</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Stock</th>
              <th class="px-5 py-3 font-medium text-gray-600">Stores</th>
              <th class="px-5 py-3 font-medium text-gray-600">Status</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td colspan="7" class="text-center py-12 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="7" class="text-center py-12 text-gray-400">No Product Master found.</td>
            </tr>
            <tr v-for="p in items" :key="p.id" class="hover:bg-gray-50 transition">
              <td class="px-5 py-3 text-gray-500 font-mono text-xs">{{ p.sku || '—' }}</td>
              <td class="px-5 py-3 font-medium text-gray-900">{{ p.name }}</td>
              <td class="px-5 py-3 text-gray-500">{{ p.category || '—' }}</td>
              <td class="px-5 py-3 text-right">
                <span :class="p.stock <= 0 ? 'text-red-600 font-semibold' : 'text-gray-700'">{{ p.stock }}</span>
              </td>
              <td class="px-5 py-3">
                <div class="flex flex-wrap gap-1">
                  <span v-if="!p.stores?.length" class="text-gray-400 text-xs">—</span>
                  <span v-for="s in p.stores" :key="s.id"
                    class="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded font-medium">
                    {{ s.name }}
                  </span>
                </div>
              </td>
              <td class="px-5 py-3">
                <span :class="p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">{{ p.status }}</span>
              </td>
              <td class="px-5 py-3 text-right whitespace-nowrap">
                <RouterLink :to="`/erp/item-master/${p.id}/edit`" class="text-primary-600 hover:underline text-xs mr-3">Edit</RouterLink>
                <button @click="confirmDelete(p)" class="text-red-500 hover:underline text-xs">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>{{ total }} Product Master{{ total !== 1 ? 's' : '' }}</span>
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

const items = ref([])
const total    = ref(0)
const page     = ref(1)
const limit    = 20
const search   = ref('')
const loading  = ref(false)
let searchTimeout = null

async function fetchItems() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/item-master', { params: { page: page.value, limit, search: search.value } })
    items.value = data.data.products
    total.value    = data.data.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; fetchItems() }, 350)
}

watch(page, fetchItems)
onMounted(fetchItems)

async function confirmDelete(p) {
  if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/item-master/${p.id}`)
    fetchItems()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}

</script>
