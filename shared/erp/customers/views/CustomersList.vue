<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900">Customers</h1>
        <div class="flex items-center gap-3">
          <input
            v-model="search"
            @input="onSearch"
            type="search"
            placeholder="Search customers…"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
          />
          <select v-model="filterGroup" @change="() => { page = 1; fetchCustomers() }"
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All Groups</option>
            <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
          <RouterLink
            v-can="'erp.customers.edit'"
            to="/erp/customers/create"
            class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition whitespace-nowrap"
          >+ New Customer</RouterLink>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th class="px-5 py-3 font-medium text-gray-600">Name</th>
              <th class="px-5 py-3 font-medium text-gray-600">Company</th>
              <th class="px-5 py-3 font-medium text-gray-600">Group</th>
              <th class="px-5 py-3 font-medium text-gray-600">Email</th>
              <th class="px-5 py-3 font-medium text-gray-600">Phone</th>
              <th class="px-5 py-3 font-medium text-gray-600">Status</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td colspan="7" class="text-center py-12 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!customers.length">
              <td colspan="7" class="text-center py-12 text-gray-400">No customers found.</td>
            </tr>
            <tr v-for="c in customers" :key="c.id" class="hover:bg-gray-50 transition">
              <td class="px-5 py-3 font-medium text-gray-900">{{ c.name }}</td>
              <td class="px-5 py-3 text-gray-500">{{ c.company || '—' }}</td>
              <td class="px-5 py-3 text-gray-500">{{ c.group?.name || '—' }}</td>
              <td class="px-5 py-3 text-gray-500">{{ c.email || '—' }}</td>
              <td class="px-5 py-3 text-gray-500">{{ c.phone || '—' }}</td>
              <td class="px-5 py-3">
                <span
                  :class="c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                  class="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                >{{ c.status }}</span>
              </td>
              <td class="px-5 py-3 text-right whitespace-nowrap">
                <RouterLink v-can="'erp.customers.edit'" :to="`/erp/customers/${c.id}/edit`" class="text-primary-600 hover:underline text-xs mr-3">Edit</RouterLink>
                <button v-can="'erp.customers.delete'" @click="confirmDelete(c)" class="text-red-500 hover:underline text-xs">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>{{ total }} customer{{ total !== 1 ? 's' : '' }}</span>
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

const customers  = ref([])
const groups     = ref([])
const total      = ref(0)
const page       = ref(1)
const limit      = 20
const search     = ref('')
const filterGroup = ref('')
const loading    = ref(false)
let searchTimeout = null

async function fetchGroups() {
  const { data } = await api.get('/erp/customer-groups/all')
  groups.value = data.data.groups
}

async function fetchCustomers() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/customers', {
      params: { page: page.value, limit, search: search.value, groupId: filterGroup.value || undefined },
    })
    customers.value = data.data.customers
    total.value     = data.data.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; fetchCustomers() }, 350)
}

watch(page, fetchCustomers)
onMounted(() => { fetchGroups(); fetchCustomers() })

async function confirmDelete(c) {
  if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/customers/${c.id}`)
    fetchCustomers()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}
</script>
