<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Stock Returns</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ total }} record{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink to="/erp/stock-return/create"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm
                 font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
          <PlusIcon class="w-4 h-4" />
          New Return
        </RouterLink>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div class="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button v-for="opt in typeOptions" :key="opt.value"
              @click="typeFilter = opt.value; page = 1; load()"
              :class="typeFilter === opt.value ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'"
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap">
              {{ opt.label }}
            </button>
          </div>
          <div class="relative flex-1 min-w-48 max-w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" placeholder="Search ref no…"
              class="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50
                     focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500
                     focus:border-transparent transition-colors" />
          </div>
        </div>

        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100 text-left">
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref No</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Store</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer / Vendor</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th class="px-5 py-3 w-28"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="7" class="text-center py-16">
                <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </td>
            </tr>
            <tr v-else-if="!rows.length">
              <td colspan="7" class="text-center py-16">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <ArrowUturnLeftIcon class="w-5 h-5 text-gray-400" />
                  </div>
                  <p class="text-sm text-gray-400 font-medium">No records found</p>
                </div>
              </td>
            </tr>
            <tr v-for="row in rows" :key="row.id" class="hover:bg-gray-50 transition-colors group">
              <td class="px-5 py-3.5 font-mono font-medium text-gray-900">{{ row.refNo }}</td>
              <td class="px-5 py-3.5 text-gray-600 text-xs">{{ row.date }}</td>
              <td class="px-5 py-3.5">
                <span :class="row.type === 'customer_return' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'"
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold">
                  {{ row.type === 'customer_return' ? 'Customer Return' : 'Return to Vendor' }}
                </span>
              </td>
              <td class="px-5 py-3.5 font-medium text-gray-700">{{ row.store?.name || '—' }}</td>
              <td class="px-5 py-3.5 text-gray-600 text-xs">
                {{ row.type === 'customer_return' ? (row.customer?.name || '—') : (row.vendor?.name || '—') }}
              </td>
              <td class="px-5 py-3.5">
                <span :class="row.status === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize">
                  <span class="w-1.5 h-1.5 rounded-full" :class="row.status === 'confirmed' ? 'bg-green-500' : 'bg-amber-500'"></span>
                  {{ row.status }}
                </span>
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center justify-end gap-1.5 transition-opacity">
                  <RouterLink :to="`/erp/stock-return/${row.id}`"
                    class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors" title="View">
                    <EyeIcon class="w-4 h-4" />
                  </RouterLink>
                  <button v-if="row.status === 'draft'" @click="approveRow(row)" :disabled="approvingId === row.id"
                    class="p-1.5 text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors disabled:opacity-40" title="Confirm">
                    <CheckCircleIcon class="w-4 h-4" />
                  </button>
                  <button v-if="row.status === 'draft'" @click="deleteRow(row)"
                    class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
          <span class="text-xs text-gray-500">Showing {{ rows.length ? (page-1)*limit+1 : 0 }}–{{ Math.min(page*limit,total) }} of {{ total }}</span>
          <div class="flex items-center gap-1">
            <button @click="page--" :disabled="page <= 1" class="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors"><ChevronLeftIcon class="w-4 h-4" /></button>
            <span class="text-xs text-gray-600 font-medium px-2 tabular-nums">{{ page }} / {{ Math.max(1,Math.ceil(total/limit)) }}</span>
            <button @click="page++" :disabled="page*limit>=total" class="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors"><ChevronRightIcon class="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { PlusIcon, MagnifyingGlassIcon, EyeIcon, CheckCircleIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, ArrowUturnLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const rows        = ref([])
const total       = ref(0)
const page        = ref(1)
const limit       = 20
const search      = ref('')
const typeFilter  = ref('')
const loading     = ref(false)
const approvingId = ref(null)
let searchTimeout = null

const typeOptions = [
  { value: '',                label: 'All' },
  { value: 'customer_return', label: 'Customer Return' },
  { value: 'vendor_return',   label: 'Return to Vendor' },
]

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/stock-return', {
      params: { page: page.value, limit, search: search.value, type: typeFilter.value },
    })
    rows.value  = data.data.returns
    total.value = data.data.total
  } finally { loading.value = false }
}

function onSearch() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { page.value = 1; load() }, 300) }
watch(page, load)
onMounted(load)

async function approveRow(row) {
  if (!confirm(`Confirm ${row.refNo}? Stock will be updated and this cannot be undone.`)) return
  approvingId.value = row.id
  try { await api.post(`/erp/stock-return/${row.id}/confirm`); load() }
  catch (err) { alert(err.response?.data?.message || 'Confirm failed') }
  finally { approvingId.value = null }
}

async function deleteRow(row) {
  if (!confirm(`Delete ${row.refNo}? This cannot be undone.`)) return
  try { await api.delete(`/erp/stock-return/${row.id}`); load() }
  catch (err) { alert(err.response?.data?.message || 'Delete failed') }
}
</script>
