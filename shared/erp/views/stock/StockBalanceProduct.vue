<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/stock-balance" class="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">Stock Overview</h1>
      </div>

      <div v-if="loading" class="text-gray-400 py-12 text-center">Loading…</div>
      <div v-else-if="!summary" class="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        Product not found. <RouterLink to="/erp/stock-balance" class="underline ml-1">Back</RouterLink>
      </div>

      <template v-else>
        <!-- Product info -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="flex items-start justify-between gap-6">
            <div>
              <h2 class="text-xl font-bold text-gray-900">{{ summary.product.name }}</h2>
              <p v-if="summary.product.sku" class="font-mono text-sm text-gray-400 mt-0.5">{{ summary.product.sku }}</p>
            </div>
            <div class="flex gap-6 text-right">
              <div>
                <p class="text-xs text-gray-500 mb-0.5">Total Stock</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ fmtQty(summary.totalStock) }}
                  <span class="text-sm font-normal text-gray-400 ml-1">{{ summary.product.sellingUom?.abbreviation || '' }}</span>
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-0.5">WAC</p>
                <p class="text-2xl font-bold text-gray-900">{{ fmtMoney(summary.product.cost) }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-0.5">Total Value</p>
                <p class="text-2xl font-bold text-gray-900">{{ fmtMoney(summary.totalValue) }}</p>
              </div>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Selling UOM:</span>
              <span class="ml-2 text-gray-800">{{ summary.product.sellingUom?.name || '—' }}</span>
            </div>
            <div>
              <span class="text-gray-500">Purchasing UOM:</span>
              <span class="ml-2 text-gray-800">{{ summary.product.purchasingUom?.name || '—' }}</span>
            </div>
            <div>
              <span class="text-gray-500">Cost / WAC:</span>
              <span class="ml-2 text-gray-800">{{ fmtMoney(summary.product.cost) }}</span>
            </div>
          </div>
        </div>

        <!-- Stock by Store -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-700">Stock by Store</h2>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200 text-left">
              <tr>
                <th class="px-5 py-3 font-medium text-gray-600">Store</th>
                <th class="px-5 py-3 font-medium text-gray-600">Code</th>
                <th class="px-5 py-3 font-medium text-gray-600 text-right">Qty</th>
                <th class="px-5 py-3 font-medium text-gray-600 text-right">Value</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="!summary.storeStocks.length">
                <td colspan="4" class="px-5 py-8 text-center text-gray-400">No store stock found.</td>
              </tr>
              <tr v-for="ss in summary.storeStocks" :key="ss.id" class="hover:bg-gray-50">
                <td class="px-5 py-3 font-medium text-gray-900">{{ ss.store?.name || '—' }}</td>
                <td class="px-5 py-3 font-mono text-xs text-gray-400">{{ ss.store?.code || '—' }}</td>
                <td class="px-5 py-3 text-right font-semibold"
                  :class="Number(ss.stock) > 0 ? 'text-gray-900' : 'text-red-400'">
                  {{ fmtQty(ss.stock) }}
                </td>
                <td class="px-5 py-3 text-right text-gray-700">
                  {{ fmtMoney(Number(ss.stock) * Number(summary.product.cost || 0)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Recent Movements -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-700">Recent Stock Movements <span class="text-gray-400 font-normal">(last 20)</span></h2>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200 text-left">
              <tr>
                <th class="px-5 py-3 font-medium text-gray-600">Date</th>
                <th class="px-5 py-3 font-medium text-gray-600">Type</th>
                <th class="px-5 py-3 font-medium text-gray-600">Store</th>
                <th class="px-5 py-3 font-medium text-gray-600">Ref</th>
                <th class="px-5 py-3 font-medium text-gray-600 text-right">Qty</th>
                <th class="px-5 py-3 font-medium text-gray-600 text-right">After</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="!summary.movements.length">
                <td colspan="6" class="px-5 py-8 text-center text-gray-400">No movements recorded.</td>
              </tr>
              <tr v-for="mv in summary.movements" :key="mv.id" class="hover:bg-gray-50">
                <td class="px-5 py-3 text-gray-500 text-xs">{{ mv.createdAt?.slice(0, 10) }}</td>
                <td class="px-5 py-3">
                  <span :class="movementClass(mv.type)"
                    class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                    {{ movementLabel(mv.type) }}
                  </span>
                </td>
                <td class="px-5 py-3 text-gray-600">{{ mv.store?.name || '—' }}</td>
                <td class="px-5 py-3 font-mono text-xs text-gray-400">{{ mv.refNo || '—' }}</td>
                <td class="px-5 py-3 text-right font-semibold"
                  :class="Number(mv.qty) >= 0 ? 'text-green-700' : 'text-red-600'">
                  {{ Number(mv.qty) >= 0 ? '+' : '' }}{{ fmtQty(mv.qty) }}
                </td>
                <td class="px-5 py-3 text-right text-gray-600">{{ fmtQty(mv.stockAfter) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney, fmtQty } from '@/utils/fmt'

const route   = useRoute()
const summary = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await api.get(`/erp/stock-balance/product/${route.params.productId}`)
    summary.value = data.data
  } catch {
    summary.value = null
  } finally {
    loading.value = false
  }
})

const movementTypeMap = {
  receive:         { label: 'Receive',          cls: 'bg-green-100 text-green-700' },
  adjust:          { label: 'Adjustment',        cls: 'bg-yellow-100 text-yellow-700' },
  count:           { label: 'Count',             cls: 'bg-blue-100 text-blue-700' },
  request:         { label: 'Request',           cls: 'bg-purple-100 text-purple-700' },
  customer_return: { label: 'Customer Return',   cls: 'bg-blue-100 text-blue-700' },
  vendor_return:   { label: 'Return to Vendor',  cls: 'bg-orange-100 text-orange-700' },
}

function movementLabel(type) {
  return movementTypeMap[type]?.label || type
}
function movementClass(type) {
  return movementTypeMap[type]?.cls || 'bg-gray-100 text-gray-600'
}
</script>
