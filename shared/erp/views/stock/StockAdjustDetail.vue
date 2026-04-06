<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/stock-adjust" class="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">Stock Adjustment</h1>
        <span v-if="adj" :class="adj.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
          class="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{{ adj?.status }}</span>
      </div>

      <div v-if="loading" class="text-gray-400 py-12 text-center">Loading…</div>
      <div v-else-if="!adj" class="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        Record not found. <RouterLink to="/erp/stock-adjust" class="underline ml-1">Back to list</RouterLink>
      </div>

      <template v-else>
        <!-- Header info -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="grid grid-cols-5 gap-6 text-sm">
            <div><p class="text-gray-500 mb-1">Ref No</p><p class="font-mono font-semibold text-gray-900">{{ adj.refNo }}</p></div>
            <div><p class="text-gray-500 mb-1">Date</p><p class="font-medium text-gray-900">{{ adj.date }}</p></div>
            <div><p class="text-gray-500 mb-1">Store</p><p class="font-medium text-gray-900">{{ adj.store?.name || '—' }}</p></div>
            <div><p class="text-gray-500 mb-1">Reason</p><p class="font-medium text-gray-900">{{ adj.reason || '—' }}</p></div>
            <div><p class="text-gray-500 mb-1">Notes</p><p class="text-gray-700">{{ adj.notes || '—' }}</p></div>
          </div>
        </div>

        <!-- Items -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-700">Items</h2>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200 text-left">
              <tr>
                <th class="px-5 py-3 font-medium text-gray-600">Product</th>
                <th class="px-5 py-3 font-medium text-gray-600">SKU</th>
                <th class="px-5 py-3 font-medium text-gray-600 text-right">Qty Adjustment</th>
                <th class="px-5 py-3 font-medium text-gray-600">Notes</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in adj.items" :key="item.id" class="hover:bg-gray-50">
                <td class="px-5 py-3 font-medium text-gray-900">{{ item.product?.name }}</td>
                <td class="px-5 py-3 font-mono text-gray-500 text-xs">{{ item.product?.sku || '—' }}</td>
                <td class="px-5 py-3 text-right font-semibold"
                  :class="item.qty > 0 ? 'text-green-700' : 'text-red-600'">
                  {{ item.qty > 0 ? '+' : '' }}{{ item.qty }}
                </td>
                <td class="px-5 py-3 text-gray-500">{{ item.notes || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <!-- Actions -->
        <div class="flex justify-between items-center">
          <button v-if="adj.status === 'draft'" @click="deleteAdj"
            class="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">
            Delete Draft
          </button>
          <div class="flex gap-3 ml-auto">
            <RouterLink to="/erp/stock-adjust" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition">Back</RouterLink>
            <button v-if="adj.status === 'draft'" @click="confirmAdj" :disabled="confirming"
              class="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
              {{ confirming ? 'Confirming…' : 'Confirm & Apply Adjustment' }}
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

const route = useRoute()
const router = useRouter()
const adj = ref(null)
const loading = ref(true)
const confirming = ref(false)
const error = ref('')

async function load() {
  try {
    const { data } = await api.get(`/erp/stock-adjust/${route.params.id}`)
    adj.value = data.data.adjustment
  } catch {
    adj.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function confirmAdj() {
  if (!confirm('Confirm this adjustment? Stock will be updated and this cannot be undone.')) return
  confirming.value = true
  error.value = ''
  try {
    const { data } = await api.post(`/erp/stock-adjust/${route.params.id}/confirm`)
    adj.value = data.data.adjustment
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to confirm'
  } finally {
    confirming.value = false
  }
}

async function deleteAdj() {
  if (!confirm('Delete this draft? This cannot be undone.')) return
  try {
    await api.delete(`/erp/stock-adjust/${route.params.id}`)
    router.push('/erp/stock-adjust')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
