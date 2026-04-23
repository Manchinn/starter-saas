<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Departments</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ total }} department{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink v-can="'erp.departments.edit'" to="/erp/hrms/departments/create"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm
                 font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
          <PlusIcon class="w-4 h-4" />
          New Department
        </RouterLink>
      </div>

      <!-- Table Section -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        
        <!-- Search bar -->
        <div class="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
          <div class="relative flex-1 min-w-48 max-w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" placeholder="Search departments…"
              class="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50
                     focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500
                     focus:border-transparent transition-colors" />
          </div>
        </div>

        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100 text-left">
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th class="px-5 py-3 w-28"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="5" class="text-center py-16">
                <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </td>
            </tr>
            <tr v-else-if="!departments.length">
              <td colspan="5" class="text-center py-16">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <UserGroupIcon class="w-5 h-5 text-gray-400" />
                  </div>
                  <p class="text-sm text-gray-400 font-medium">No departments found</p>
                </div>
              </td>
            </tr>
            <tr v-for="d in departments" :key="d.id" class="hover:bg-gray-50 transition-colors group">
              <td class="px-5 py-3.5 font-mono text-gray-500 text-xs">{{ d.code || '—' }}</td>
              <td class="px-5 py-3.5 font-medium text-gray-900">{{ d.name }}</td>
              <td class="px-5 py-3.5 text-gray-500 max-w-xs truncate">{{ d.description || '—' }}</td>
              <td class="px-5 py-3.5">
                <span :class="d.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold">
                  {{ d.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-right">
                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <RouterLink v-can="'erp.departments.edit'" :to="`/erp/hrms/departments/${d.id}/edit`"
                    class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors" title="Edit">
                    <PencilIcon class="w-4 h-4" />
                  </RouterLink>
                  <button v-can="'erp.departments.delete'" @click="confirmDelete(d)"
                    class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
          <span class="text-xs text-gray-500">Showing {{ departments.length ? (page-1)*limit+1 : 0 }}–{{ Math.min(page*limit,total) }} of {{ total }}</span>
          <div class="flex items-center gap-1">
            <button @click="page--" :disabled="page <= 1"
              class="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors">
              <ChevronLeftIcon class="w-4 h-4" />
            </button>
            <span class="text-xs text-gray-600 font-medium px-2 tabular-nums">{{ page }} / {{ Math.max(1, Math.ceil(total / limit)) }}</span>
            <button @click="page++" :disabled="page * limit >= total"
              class="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors">
              <ChevronRightIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const departments = ref([])
const total       = ref(0)
const page        = ref(1)
const limit       = 20
const search      = ref('')
const loading     = ref(false)

let searchTimeout = null

async function fetchDepartments() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/hrms/departments', {
      params: { page: page.value, limit, search: search.value }
    })
    departments.value = data.data.departments
    total.value = data.data.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; fetchDepartments() }, 350)
}

async function confirmDelete(row) {
  if (!confirm(`Delete department "${row.name}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/hrms/departments/${row.id}`)
    fetchDepartments()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}

watch(page, fetchDepartments)
onMounted(fetchDepartments)
</script>
