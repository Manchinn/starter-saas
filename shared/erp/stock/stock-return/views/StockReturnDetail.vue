<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/stock-return" class="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">Stock Return</h1>
        <span v-if="sr" :class="typeClass(sr.type)" class="px-2.5 py-0.5 rounded-full text-xs font-medium">
          {{ sr.type === 'customer_return' ? 'Customer Return' : 'Return to Vendor' }}
        </span>
        <span v-if="sr" :class="sr.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
          class="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{{ sr?.status }}</span>
      </div>

      <div v-if="loading" class="text-gray-400 py-12 text-center">Loading…</div>
      <div v-else-if="!sr" class="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        Record not found. <RouterLink to="/erp/stock-return" class="underline ml-1">Back to list</RouterLink>
      </div>

      <template v-else>
        <!-- Header info -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div class="grid grid-cols-5 gap-6 text-sm">
            <div><p class="text-gray-500 mb-1">Ref No</p><p class="font-mono font-semibold text-gray-900">{{ sr.refNo }}</p></div>
            <div><p class="text-gray-500 mb-1">Date</p><p class="font-medium text-gray-900">{{ sr.date }}</p></div>
            <div><p class="text-gray-500 mb-1">Store</p><p class="font-medium text-gray-900">{{ sr.store?.name || '—' }}</p></div>
            <div v-if="sr.type === 'customer_return'">
              <p class="text-gray-500 mb-1">Customer</p>
              <p class="font-medium text-gray-900">{{ sr.customer?.name || '—' }}</p>
              <p v-if="sr.customer?.company" class="text-xs text-gray-400">{{ sr.customer.company }}</p>
            </div>
            <div v-else>
              <p class="text-gray-500 mb-1">Vendor</p>
              <p class="font-medium text-gray-900">{{ sr.vendor?.name || '—' }}</p>
              <p v-if="sr.vendor?.code" class="text-xs text-gray-400 font-mono">{{ sr.vendor.code }}</p>
            </div>
            <div><p class="text-gray-500 mb-1">Notes</p><p class="text-gray-700">{{ sr.notes || '—' }}</p></div>
          </div>

          <div class="pt-3 border-t border-gray-100 text-xs"
            :class="sr.type === 'customer_return' ? 'text-blue-600' : 'text-orange-600'">
            <span v-if="sr.type === 'customer_return'">
              Customer Return — stock {{ sr.status === 'confirmed' ? 'was added' : 'will be added' }} to inventory {{ sr.status === 'confirmed' ? 'on confirmation' : 'when confirmed' }}.
            </span>
            <span v-else>
              Return to Vendor — stock {{ sr.status === 'confirmed' ? 'was removed' : 'will be removed' }} from inventory {{ sr.status === 'confirmed' ? 'on confirmation' : 'when confirmed' }}.
            </span>
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
                <th class="px-5 py-3 font-medium text-gray-600 text-right">Qty</th>
                <th class="px-5 py-3 font-medium text-gray-600 text-right">Cost / Unit</th>
                <th class="px-5 py-3 font-medium text-gray-600">Reason</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in sr.items" :key="item.id" class="hover:bg-gray-50">
                <td class="px-5 py-3 font-medium text-gray-900">{{ item.product?.name }}</td>
                <td class="px-5 py-3 font-mono text-xs text-gray-400">{{ item.product?.sku || '—' }}</td>
                <td class="px-5 py-3 text-right font-semibold"
                  :class="sr.type === 'customer_return' ? 'text-green-700' : 'text-red-600'">
                  {{ sr.type === 'customer_return' ? '+' : '−' }}{{ Number(item.qty) }}
                </td>
                <td class="px-5 py-3 text-right text-gray-600">{{ fmtMoney(item.cost) }}</td>
                <td class="px-5 py-3 text-gray-500 text-xs">{{ item.reason || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <!-- Actions -->
        <div class="flex justify-between items-center">
          <button v-if="sr.status === 'draft'" @click="deleteSR"
            class="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">
            Delete Draft
          </button>
          <div class="flex gap-3 ml-auto">
            <RouterLink to="/erp/stock-return" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition">Back</RouterLink>
            <button v-if="sr.status === 'draft'" @click="confirmSR" :disabled="confirming"
              class="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
              {{ confirming ? 'Confirming…' : 'Confirm & Update Stock' }}
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
import { fmtMoney } from '@/utils/fmt'

const route     = useRoute()
const router    = useRouter()
const sr        = ref(null)
const loading   = ref(true)
const confirming = ref(false)
const error     = ref('')

async function load() {
  try {
    const { data } = await api.get(`/erp/stock-return/${route.params.id}`)
    sr.value = data.data.stockReturn
  } catch {
    sr.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)

function typeClass(type) {
  return type === 'customer_return' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
}

async function confirmSR() {
  if (!confirm('Confirm this Stock Return? Stock will be updated and this cannot be undone.')) return
  confirming.value = true
  error.value = ''
  try {
    const { data } = await api.post(`/erp/stock-return/${route.params.id}/confirm`)
    sr.value = data.data.stockReturn
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to confirm'
  } finally {
    confirming.value = false
  }
}

async function deleteSR() {
  if (!confirm('Delete this draft? This cannot be undone.')) return
  try {
    await api.delete(`/erp/stock-return/${route.params.id}`)
    router.push('/erp/stock-return')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
