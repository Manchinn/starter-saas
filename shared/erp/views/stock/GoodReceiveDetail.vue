<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/good-receive" class="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">Good Receive</h1>
        <span v-if="gr" :class="gr.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
          class="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{{ gr?.status }}</span>
      </div>

      <div v-if="loading" class="text-gray-400 py-12 text-center">Loading…</div>
      <div v-else-if="!gr" class="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        Record not found. <RouterLink to="/erp/good-receive" class="underline ml-1">Back to list</RouterLink>
      </div>

      <template v-else>
        <!-- Header info -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <!-- Row 1: core fields -->
          <div class="grid grid-cols-5 gap-6 text-sm">
            <div><p class="text-gray-500 mb-1">Ref No</p><p class="font-mono font-semibold text-gray-900">{{ gr.refNo }}</p></div>
            <div><p class="text-gray-500 mb-1">Date</p><p class="font-medium text-gray-900">{{ gr.date }}</p></div>
            <div><p class="text-gray-500 mb-1">Store</p><p class="font-medium text-gray-900">{{ gr.store?.name || '—' }}</p></div>
            <div><p class="text-gray-500 mb-1">Supplier</p><p class="font-medium text-gray-900">{{ gr.supplier || '—' }}</p></div>
            <div><p class="text-gray-500 mb-1">Notes</p><p class="text-gray-700">{{ gr.notes || '—' }}</p></div>
          </div>
          <!-- Row 2: document type -->
          <div class="flex items-center gap-6 pt-3 border-t border-gray-100 text-sm">
            <div>
              <p class="text-gray-500 mb-1">Document Type</p>
              <span :class="gr.docType === 'invoice' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'"
                class="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize">
                {{ gr.docType || 'invoice' }}
              </span>
            </div>
            <template v-if="gr.docType === 'invoice' || !gr.docType">
              <div><p class="text-gray-500 mb-1">Invoice No</p><p class="font-mono font-medium text-gray-900">{{ gr.invoiceNo || '—' }}</p></div>
              <div><p class="text-gray-500 mb-1">Invoice Date</p><p class="font-medium text-gray-900">{{ gr.invoiceDate || '—' }}</p></div>
              <div><p class="text-gray-500 mb-1">Invoice Discount</p><p class="font-medium text-gray-900">{{ fmtMoney(gr.invoiceDiscount) }}</p></div>
              <div class="px-4 py-2 bg-green-50 rounded-lg border border-green-100">
                <p class="text-gray-500 mb-1 text-xs">Net Amount</p>
                <p class="font-bold text-green-800 text-lg">{{ fmtMoney(gr.invoiceNetAmount) }}</p>
              </div>
            </template>
            <template v-if="gr.docType === 'delivery'">
              <div><p class="text-gray-500 mb-1">Delivery No</p><p class="font-mono font-medium text-gray-900">{{ gr.deliveryNo || '—' }}</p></div>
            </template>
          </div>
        </div>

        <!-- Items -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-700">Items</h2>
            <div class="flex gap-6 text-xs text-gray-500">
              <span>Gross: <span class="font-semibold text-gray-800">{{ fmtMoney(totalGross) }}</span></span>
              <span>Net Total: <span class="font-bold text-gray-900">{{ fmtMoney(totalNet) }}</span></span>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="text-sm" style="min-width: 1200px">
              <thead class="bg-gray-50 border-b border-gray-200 text-left">
                <tr>
                  <th class="px-3 py-2.5 font-medium text-gray-600">Product</th>
                  <th class="px-3 py-2.5 font-medium text-gray-600">SKU</th>
                  <th class="px-3 py-2.5 font-medium text-gray-600 text-right">Qty</th>
                  <th class="px-3 py-2.5 font-medium text-gray-600">Qty UOM</th>
                  <th class="px-3 py-2.5 font-medium text-gray-600 text-right">Free Qty</th>
                  <th class="px-3 py-2.5 font-medium text-gray-600">Free UOM</th>
                  <th class="px-3 py-2.5 font-medium text-gray-600">Batch ID</th>
                  <th class="px-3 py-2.5 font-medium text-gray-600">Expiry</th>
                  <th class="px-3 py-2.5 font-medium text-gray-600 text-right">Cost/Unit</th>
                  <th class="px-3 py-2.5 font-medium text-gray-600 text-right">Disc %</th>
                  <th class="px-3 py-2.5 font-medium text-gray-600 text-right">Discount</th>
                  <th class="px-3 py-2.5 font-medium text-gray-600 text-right">Net Amt</th>
                  <th class="px-3 py-2.5 font-medium text-gray-600 text-right">WAC</th>
                  <th class="px-3 py-2.5 font-medium text-gray-600">Comments</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="item in gr.items" :key="item.id" class="hover:bg-gray-50">
                  <td class="px-3 py-2.5 font-medium text-gray-900">{{ item.product?.name }}</td>
                  <td class="px-3 py-2.5 font-mono text-xs text-gray-400">{{ item.product?.sku || '—' }}</td>
                  <td class="px-3 py-2.5 text-right font-medium text-gray-900">{{ Number(item.qty) }}</td>
                  <td class="px-3 py-2.5 text-gray-500 text-xs">{{ item.qtyUom?.abbreviation || item.qtyUom?.name || '—' }}</td>
                  <td class="px-3 py-2.5 text-right text-gray-600">{{ Number(item.freeQty) || '—' }}</td>
                  <td class="px-3 py-2.5 text-gray-500 text-xs">{{ item.freeQtyUom?.abbreviation || item.freeQtyUom?.name || '—' }}</td>
                  <td class="px-3 py-2.5 font-mono text-xs text-gray-500">{{ item.batchId || '—' }}</td>
                  <td class="px-3 py-2.5 text-xs text-gray-500">{{ item.expiryDate || '—' }}</td>
                  <td class="px-3 py-2.5 text-right text-gray-700">{{ fmtMoney(item.cost) }}</td>
                  <td class="px-3 py-2.5 text-right text-gray-600">{{ Number(item.discountPct) ? `${Number(item.discountPct)}%` : '—' }}</td>
                  <td class="px-3 py-2.5 text-right text-gray-600">{{ fmtMoney(item.discount) !== '0.00' ? fmtMoney(item.discount) : '—' }}</td>
                  <td class="px-3 py-2.5 text-right font-semibold text-gray-900">{{ fmtMoney(item.netAmount) }}</td>
                  <td class="px-3 py-2.5 text-right text-xs text-blue-700 font-mono">{{ fmtRate(item.wac) }}</td>
                  <td class="px-3 py-2.5 text-gray-500 text-xs">{{ item.comments || '—' }}</td>
                </tr>
              </tbody>
              <tfoot class="border-t-2 border-gray-200 bg-gray-50">
                <tr>
                  <td colspan="8" class="px-3 py-2 text-xs font-medium text-gray-500">Totals</td>
                  <td class="px-3 py-2 text-right text-xs font-semibold text-gray-700">{{ fmtMoney(totalGross) }}</td>
                  <td colspan="2"></td>
                  <td class="px-3 py-2 text-right text-xs font-bold text-gray-900">{{ fmtMoney(totalNet) }}</td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <!-- Actions -->
        <div class="flex justify-between items-center">
          <button v-if="gr.status === 'draft'" @click="deleteGR"
            class="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">
            Delete Draft
          </button>
          <div class="flex gap-3 ml-auto">
            <RouterLink to="/erp/good-receive" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition">Back</RouterLink>
            <button v-if="gr.status === 'draft'" @click="confirmGR" :disabled="confirming"
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney, fmtRate } from '@/utils/fmt'

const route = useRoute()
const router = useRouter()
const gr = ref(null)
const loading = ref(true)
const confirming = ref(false)
const error = ref('')

async function load() {
  try {
    const { data } = await api.get(`/erp/good-receive/${route.params.id}`)
    gr.value = data.data.goodReceive
  } catch {
    gr.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)

const totalGross = computed(() =>
  (gr.value?.items || []).reduce((s, i) => s + (Number(i.qty) * Number(i.cost)), 0)
)
const totalNet = computed(() =>
  (gr.value?.items || []).reduce((s, i) => s + Number(i.netAmount || 0), 0)
)

async function confirmGR() {
  if (!confirm('Confirm this Good Receive? Stock will be updated and this cannot be undone.')) return
  confirming.value = true
  error.value = ''
  try {
    const { data } = await api.post(`/erp/good-receive/${route.params.id}/confirm`)
    gr.value = data.data.goodReceive
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to confirm'
  } finally {
    confirming.value = false
  }
}

async function deleteGR() {
  if (!confirm('Delete this draft? This cannot be undone.')) return
  try {
    await api.delete(`/erp/good-receive/${route.params.id}`)
    router.push('/erp/good-receive')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
