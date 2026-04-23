<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Employees</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ total }} employee{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink to="/erp/hrms/employees/create"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm
                 font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
          <PlusIcon class="w-4 h-4" />
          New Employee
        </RouterLink>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div class="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div class="relative flex-1 min-w-48 max-w-72">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" placeholder="Search name, code, position…"
              class="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50
                     focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500
                     focus:border-transparent transition-colors" />
          </div>
          <select v-model="filterStatus" @change="() => { page = 1; load() }"
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white
                   focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-700 transition-colors">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100 text-left">
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Position</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Start Date</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Login</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th class="px-5 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="8" class="text-center py-16">
                <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </td>
            </tr>
            <tr v-else-if="!employees.length">
              <td colspan="8" class="text-center py-16">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <IdentificationIcon class="w-5 h-5 text-gray-400" />
                  </div>
                  <p class="text-sm text-gray-400 font-medium">No employees found</p>
                </div>
              </td>
            </tr>
            <tr v-for="emp in employees" :key="emp.id" class="hover:bg-gray-50 transition-colors group">

              <!-- Code -->
              <td class="px-5 py-3.5 font-mono text-xs text-gray-500">{{ emp.employeeCode || '—' }}</td>

              <!-- Employee name + avatar -->
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center
                              justify-center font-bold text-sm flex-shrink-0">
                    {{ emp.firstName.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 leading-tight">{{ emp.firstName }} {{ emp.lastName }}</p>
                    <p class="text-xs text-gray-400">{{ emp.phone || '—' }}</p>
                  </div>
                </div>
              </td>

              <!-- Position -->
              <td class="px-5 py-3.5 text-gray-600">{{ emp.position || '—' }}</td>

              <!-- Department -->
              <td class="px-5 py-3.5 text-gray-600">
                <div v-if="emp.departments && emp.departments.length" class="flex flex-wrap gap-1">
                  <span v-for="d in emp.departments" :key="d.id" 
                    class="inline-block px-1.5 py-0.5 bg-gray-100 text-[10px] font-medium text-gray-600 rounded">
                    {{ d.name }}
                  </span>
                </div>
                <span v-else class="text-gray-400">—</span>
              </td>

              <!-- Start date -->
              <td class="px-5 py-3.5 text-gray-500 text-xs">{{ emp.startDate || '—' }}</td>

              <!-- Login (user email + active badge) -->
              <td class="px-5 py-3.5">
                <div v-if="emp.user" class="space-y-0.5">
                  <p class="text-xs text-gray-600">{{ emp.user.email }}</p>
                  <span :class="emp.user.isActive ? 'text-green-600' : 'text-red-500'"
                    class="text-xs font-medium">
                    {{ emp.user.isActive ? 'Active' : 'Disabled' }}
                  </span>
                </div>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>

              <!-- Status -->
              <td class="px-5 py-3.5">
                <span :class="statusClass(emp.status)"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize">
                  <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(emp.status)"></span>
                  {{ emp.status }}
                </span>
              </td>

              <!-- Actions -->
              <td class="px-5 py-3.5">
                <div class="flex items-center justify-end gap-1 transition-opacity">
                  <RouterLink :to="`/erp/hrms/employees/${emp.id}/edit`"
                    class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors" title="Edit">
                    <PencilIcon class="w-4 h-4" />
                  </RouterLink>
                  <button @click="confirmDelete(emp)"
                    class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
          <span class="text-xs text-gray-500">
            Showing {{ employees.length ? (page - 1) * limit + 1 : 0 }}–{{ Math.min(page * limit, total) }} of {{ total }}
          </span>
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

    <!-- Delete confirm modal -->
    <Teleport to="body">
      <div v-if="deleteModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <h2 class="text-base font-semibold text-gray-900">Delete Employee</h2>
          <p class="text-sm text-gray-600">
            Delete <span class="font-semibold">{{ deleteModal.emp?.firstName }} {{ deleteModal.emp?.lastName }}</span>?
            <span v-if="deleteModal.emp?.userId" class="block mt-1">Note: Their linked login account will also be disconnected from this record.</span>
            This action cannot be undone.
          </p>
          <div v-if="deleteModal.error" class="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{{ deleteModal.error }}</div>
          <div class="flex justify-end gap-3">
            <button @click="deleteModal.open = false" class="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button @click="doDelete" :disabled="deleteModal.saving"
              class="px-5 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
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
import {
  PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon,
  ChevronLeftIcon, ChevronRightIcon, IdentificationIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const employees    = ref([])
const total        = ref(0)
const page         = ref(1)
const limit        = 20
const search       = ref('')
const filterStatus = ref('')
const loading      = ref(false)
let   searchTimeout = null

const deleteModal = reactive({ open: false, emp: null, saving: false, error: '' })

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/hrms/employees', {
      params: { page: page.value, limit, search: search.value, status: filterStatus.value },
    })
    employees.value = data.data.employees
    total.value     = data.data.total
  } finally { loading.value = false }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; load() }, 300)
}

watch(page, load)
onMounted(load)

function statusClass(s) {
  return s === 'active' ? 'bg-green-50 text-green-700' : s === 'terminated' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'
}
function statusDot(s) {
  return s === 'active' ? 'bg-green-500' : s === 'terminated' ? 'bg-red-500' : 'bg-gray-400'
}

function confirmDelete(emp) { deleteModal.emp = emp; deleteModal.error = ''; deleteModal.open = true }

async function doDelete() {
  deleteModal.saving = true; deleteModal.error = ''
  try {
    await api.delete(`/erp/hrms/employees/${deleteModal.emp.id}`)
    deleteModal.open = false
    load()
  } catch (err) {
    deleteModal.error = err.response?.data?.message || 'Delete failed'
  } finally { deleteModal.saving = false }
}
</script>
