<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Price Lists</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ total }} record{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink to="/erp/pricing/create"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm
                 font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
          <PlusIcon class="w-4 h-4" />
          New Price List
        </RouterLink>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div class="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div class="relative flex-1 min-w-48 max-w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" placeholder="Search price list name…"
              class="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50
                     focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500
                     focus:border-transparent transition-colors" />
          </div>
          <select v-model="filterGroup" @change="() => { page = 1; loadPricings() }"
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-700 transition-colors">
            <option value="">All Groups</option>
            <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
          <select v-model="filterStatus" @change="loadPricings"
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-700 transition-colors">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100 text-left">
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer Group</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Unit Price</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th class="px-5 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="7" class="text-center py-16">
                <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </td>
            </tr>
            <tr v-else-if="!pricings.length">
              <td colspan="7" class="text-center py-16">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <CurrencyDollarIcon class="w-5 h-5 text-gray-400" />
                  </div>
                  <p class="text-sm text-gray-400 font-medium">No price lists found</p>
                </div>
              </td>
            </tr>
            <tr v-for="p in pricings" :key="p.id" class="hover:bg-gray-50 transition-colors group">
              <td class="px-5 py-3.5 font-mono text-xs text-gray-500">{{ p.code || '—' }}</td>
              <td class="px-5 py-3.5 font-medium text-gray-900">{{ p.name }}</td>
              <td class="px-5 py-3.5 text-gray-500">{{ p.customerGroup?.name || '—' }}</td>
              <td class="px-5 py-3.5 text-gray-500 max-w-xs truncate">{{ p.description || '—' }}</td>
              <td class="px-5 py-3.5 text-right font-semibold text-gray-800 tabular-nums">{{ fmtMoney(p.unitPrice) }}</td>
              <td class="px-5 py-3.5">
                <span :class="p.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize">
                  <span class="w-1.5 h-1.5 rounded-full" :class="p.status === 'active' ? 'bg-green-500' : 'bg-gray-400'"></span>
                  {{ p.status }}
                </span>
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center justify-end gap-1 transition-opacity">
                  <RouterLink :to="`/erp/pricing/${p.id}/edit`"
                    class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors" title="Edit">
                    <PencilIcon class="w-4 h-4" />
                  </RouterLink>
                  <button @click="confirmDelete(p)"
                    class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
          <span class="text-xs text-gray-500">Showing {{ pricings.length ? (page-1)*limit+1 : 0 }}–{{ Math.min(page*limit,total) }} of {{ total }}</span>
          <div class="flex items-center gap-1">
            <button @click="page--" :disabled="page <= 1" class="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors"><ChevronLeftIcon class="w-4 h-4" /></button>
            <span class="text-xs text-gray-600 font-medium px-2 tabular-nums">{{ page }} / {{ Math.max(1,Math.ceil(total/limit)) }}</span>
            <button @click="page++" :disabled="page*limit>=total" class="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors"><ChevronRightIcon class="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="deleteModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <h2 class="text-base font-semibold text-gray-900">Delete Price List</h2>
          <p class="text-sm text-gray-600">Delete <span class="font-semibold">{{ deleteModal.pricing?.name }}</span>? This cannot be undone.</p>
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
import { RouterLink } from 'vue-router'
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, CurrencyDollarIcon } from '@heroicons/vue/24/outline'
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
  } finally { loading.value = false }
}

function onSearch() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { page.value = 1; loadPricings() }, 300) }
watch(page, loadPricings)
onMounted(() => { fetchGroups(); loadPricings() })

function confirmDelete(p) { deleteModal.pricing = p; deleteModal.error = ''; deleteModal.open = true }

async function doDelete() {
  deleteModal.saving = true; deleteModal.error = ''
  try { await api.delete(`/erp/pricing/${deleteModal.pricing.id}`); deleteModal.open = false; loadPricings() }
  catch (err) { deleteModal.error = err.response?.data?.message || 'Delete failed' }
  finally { deleteModal.saving = false }
}
</script>
