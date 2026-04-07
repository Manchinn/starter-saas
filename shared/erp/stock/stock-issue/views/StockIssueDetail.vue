<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/stock-issue" class="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">Stock Issue</h1>
        <span v-if="issue" :class="issue.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
          class="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{{ issue?.status }}</span>
      </div>

      <div v-if="loading" class="text-gray-400 py-12 text-center">Loading…</div>
      <div v-else-if="!issue" class="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        Record not found. <RouterLink to="/erp/stock-issue" class="underline ml-1">Back to list</RouterLink>
      </div>

      <template v-else>
        <!-- Header info -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="grid grid-cols-5 gap-6 text-sm">
            <div><p class="text-gray-500 mb-1">Ref No</p><p class="font-mono font-semibold text-gray-900">{{ issue.refNo }}</p></div>
            <div><p class="text-gray-500 mb-1">Date</p><p class="font-medium text-gray-900">{{ issue.date }}</p></div>
            <div><p class="text-gray-500 mb-1">Store</p><p class="font-medium text-gray-900">{{ issue.store?.name || '—' }}</p></div>
            <div><p class="text-gray-500 mb-1">Reason</p><p class="text-gray-700">{{ issue.reason || '—' }}</p></div>
            <div><p class="text-gray-500 mb-1">Notes</p><p class="text-gray-700">{{ issue.notes || '—' }}</p></div>
          </div>
        </div>

        <!-- Items -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-700">Items</h2>
            <span class="text-xs text-gray-500">{{ issue.items?.length }} item{{ issue.items?.length !== 1 ? 's' : '' }}</span>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200 text-left">
              <tr>
                <th class="px-5 py-2.5 font-medium text-gray-600">Product</th>
                <th class="px-5 py-2.5 font-medium text-gray-600">SKU</th>
                <th class="px-5 py-2.5 font-medium text-gray-600 text-right">Qty Issued</th>
                <th class="px-5 py-2.5 font-medium text-gray-600">Notes</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in issue.items" :key="item.id" class="hover:bg-gray-50">
                <td class="px-5 py-2.5 font-medium text-gray-900">{{ item.product?.name }}</td>
                <td class="px-5 py-2.5 font-mono text-xs text-gray-400">{{ item.product?.sku || '—' }}</td>
                <td class="px-5 py-2.5 text-right font-semibold text-red-600">−{{ Number(item.qty) }}</td>
                <td class="px-5 py-2.5 text-gray-500 text-xs">{{ item.notes || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <!-- Actions -->
        <div class="flex justify-between items-center">
          <button v-if="issue.status === 'draft'" @click="deleteDraft"
            class="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">
            Delete Draft
          </button>
          <div class="ml-auto flex gap-3">
            <button v-if="issue.status === 'draft'" @click="confirmIssue" :disabled="confirming"
              class="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
              {{ confirming ? 'Confirming…' : 'Confirm & Issue Stock' }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const route     = useRoute()
const router    = useRouter()
const issue     = ref(null)
const loading   = ref(true)
const confirming = ref(false)
const error     = ref('')

async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/stock-issue/${route.params.id}`)
    issue.value = data.data.issue
  } catch {
    issue.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function confirmIssue() {
  if (!confirm(`Confirm ${issue.value.refNo}? Stock will be deducted and this cannot be undone.`)) return
  confirming.value = true
  error.value = ''
  try {
    await api.post(`/erp/stock-issue/${route.params.id}/confirm`)
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || 'Confirm failed'
  } finally {
    confirming.value = false
  }
}

async function deleteDraft() {
  if (!confirm(`Delete ${issue.value.refNo}? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/stock-issue/${route.params.id}`)
    router.push('/erp/stock-issue')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
