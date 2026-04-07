<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Sequence Numbers</h1>
          <p class="text-sm text-gray-500 mt-1">Configure reference number formats for ERP transactions</p>
        </div>
        <RouterLink to="/erp/settings/sequence/create"
          class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition">
          + New Sequence
        </RouterLink>
      </div>

      <!-- Format hint -->
      <div class="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-800">
        <p class="font-semibold mb-1">Format tokens</p>
        <div class="flex flex-wrap gap-x-6 gap-y-1 text-xs mt-1 text-blue-700">
          <span><code class="bg-blue-100 px-1 rounded">{####}</code> → padded number (# count = digits)</span>
          <span><code class="bg-blue-100 px-1 rounded">{YYYY}</code> → 4-digit year</span>
          <span><code class="bg-blue-100 px-1 rounded">{YY}</code> → 2-digit year</span>
          <span><code class="bg-blue-100 px-1 rounded">{MM}</code> → month</span>
          <span><code class="bg-blue-100 px-1 rounded">{DD}</code> → day</span>
        </div>
        <p class="mt-2 text-xs text-blue-600">Example: <code class="bg-blue-100 px-1 rounded">GR-{YYYY}{MM}-{####}</code> → <strong>GR-202504-0001</strong></p>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th class="px-5 py-3 font-medium text-gray-600">Code</th>
              <th class="px-5 py-3 font-medium text-gray-600">Name</th>
              <th class="px-5 py-3 font-medium text-gray-600">Format</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Initial</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Running</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Max</th>
              <th class="px-5 py-3 font-medium text-gray-600">Reseed</th>
              <th class="px-5 py-3 font-medium text-gray-600">Next Ref No</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading"><td colspan="9" class="text-center py-12 text-gray-400">Loading…</td></tr>
            <tr v-else-if="!rows.length"><td colspan="9" class="text-center py-12 text-gray-400">No sequences configured.</td></tr>
            <tr v-for="row in rows" :key="row.id" class="hover:bg-gray-50 transition">
              <td class="px-5 py-3 font-mono font-bold text-gray-900">{{ row.code }}</td>
              <td class="px-5 py-3 text-gray-700">{{ row.name }}</td>
              <td class="px-5 py-3 font-mono text-xs text-gray-500">{{ row.format }}</td>
              <td class="px-5 py-3 text-right text-gray-500">{{ row.initialValue }}</td>
              <td class="px-5 py-3 text-right font-semibold text-gray-900">{{ row.runningValue }}</td>
              <td class="px-5 py-3 text-right text-gray-500">{{ row.maxValue }}</td>
              <td class="px-5 py-3">
                <span :class="reseedClass(row.reseedPeriod)"
                  class="px-2 py-0.5 rounded-full text-xs font-medium">
                  {{ reseedLabel(row.reseedPeriod) }}
                </span>
              </td>
              <td class="px-5 py-3 font-mono text-xs font-semibold text-primary-700">{{ row.preview }}</td>
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <RouterLink :to="`/erp/settings/sequence/${row.id}/edit`"
                    class="text-xs px-3 py-1 border rounded hover:bg-gray-50">Edit</RouterLink>
                  <button v-if="!isBuiltIn(row.code)" @click="deleteRow(row)"
                    class="text-xs px-3 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50">Delete</button>
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
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const rows    = ref([])
const loading = ref(false)

const BUILT_IN = ['GR', 'ADJ', 'CNT', 'STR', 'RTN']
const isBuiltIn = (code) => BUILT_IN.includes(code)

const RESEED_LABELS = { F: 'Fixed', D: 'Daily', M: 'Monthly', Y: 'Yearly' }
const RESEED_CLASSES = {
  F: 'bg-gray-100 text-gray-600',
  D: 'bg-blue-100 text-blue-700',
  M: 'bg-purple-100 text-purple-700',
  Y: 'bg-orange-100 text-orange-700',
}
const reseedLabel = (p) => RESEED_LABELS[p] || p
const reseedClass = (p) => RESEED_CLASSES[p] || 'bg-gray-100 text-gray-600'

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/sequences')
    rows.value = data.data.sequences
  } finally {
    loading.value = false
  }
}

async function deleteRow(row) {
  if (!confirm(`Delete sequence '${row.code}'? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/sequences/${row.id}`)
    load()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}

onMounted(load)
</script>
