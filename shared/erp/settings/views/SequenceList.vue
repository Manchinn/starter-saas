<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Sequence Numbers</h1>
          <p class="text-sm text-gray-500 mt-0.5">Configure reference number formats for ERP transactions</p>
        </div>
        <RouterLink to="/erp/settings/sequence/create"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm
                 font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
          <PlusIcon class="w-4 h-4" />
          New Sequence
        </RouterLink>
      </div>

      <!-- Format hint -->
      <div class="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
        <p class="text-sm font-semibold text-blue-800 mb-2">Format Tokens</p>
        <div class="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-blue-700">
          <span><code class="bg-blue-100 px-1.5 py-0.5 rounded font-mono">{####}</code> → padded number</span>
          <span><code class="bg-blue-100 px-1.5 py-0.5 rounded font-mono">{YYYY}</code> → 4-digit year</span>
          <span><code class="bg-blue-100 px-1.5 py-0.5 rounded font-mono">{YY}</code> → 2-digit year</span>
          <span><code class="bg-blue-100 px-1.5 py-0.5 rounded font-mono">{MM}</code> → month</span>
          <span><code class="bg-blue-100 px-1.5 py-0.5 rounded font-mono">{DD}</code> → day</span>
        </div>
        <p class="mt-2 text-xs text-blue-600">
          Example: <code class="bg-blue-100 px-1.5 py-0.5 rounded font-mono">GR-{YYYY}{MM}-{####}</code>
          → <strong>GR-202504-0001</strong>
        </p>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100 text-left">
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Format</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Running</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reseed</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Next Ref No</th>
              <th class="px-5 py-3 w-20"></th>
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
                <p class="text-sm text-gray-400 font-medium">No sequences configured</p>
              </td>
            </tr>
            <tr v-for="row in rows" :key="row.id" class="hover:bg-gray-50 transition-colors group">
              <td class="px-5 py-3.5 font-mono font-bold text-gray-900">{{ row.code }}</td>
              <td class="px-5 py-3.5 text-gray-700">{{ row.name }}</td>
              <td class="px-5 py-3.5 font-mono text-xs text-gray-500">{{ row.format }}</td>
              <td class="px-5 py-3.5 text-right font-semibold text-gray-900 tabular-nums">{{ row.runningValue }}</td>
              <td class="px-5 py-3.5">
                <span :class="reseedClass(row.reseedPeriod)"
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold">
                  {{ reseedLabel(row.reseedPeriod) }}
                </span>
              </td>
              <td class="px-5 py-3.5 font-mono text-xs font-semibold text-primary-700">{{ row.preview }}</td>
              <td class="px-5 py-3.5">
                <div class="flex items-center justify-end gap-1 transition-opacity">
                  <RouterLink :to="`/erp/settings/sequence/${row.id}/edit`"
                    class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors" title="Edit">
                    <PencilIcon class="w-4 h-4" />
                  </RouterLink>
                  <button v-if="!isBuiltIn(row.code)" @click="deleteRow(row)"
                    class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const rows    = ref([])
const loading = ref(false)

const BUILT_IN = ['GR', 'ADJ', 'CNT', 'STR', 'RTN']
const isBuiltIn = (code) => BUILT_IN.includes(code)

const RESEED_LABELS = { F: 'Fixed', D: 'Daily', M: 'Monthly', Y: 'Yearly' }
const RESEED_CLASSES = {
  F: 'bg-gray-100 text-gray-600',
  D: 'bg-blue-50 text-blue-700',
  M: 'bg-purple-50 text-purple-700',
  Y: 'bg-orange-50 text-orange-700',
}
const reseedLabel = (p) => RESEED_LABELS[p] || p
const reseedClass = (p) => RESEED_CLASSES[p] || 'bg-gray-100 text-gray-600'

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/sequences')
    rows.value = data.data.sequences
  } finally { loading.value = false }
}

async function deleteRow(row) {
  if (!confirm(`Delete sequence '${row.code}'? This cannot be undone.`)) return
  try { await api.delete(`/erp/sequences/${row.id}`); load() }
  catch (err) { alert(err.response?.data?.message || 'Delete failed') }
}

onMounted(load)
</script>
